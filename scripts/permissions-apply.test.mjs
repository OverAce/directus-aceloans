// ABOUTME: Integration tests for the permissions[] apply path in apply-manifests.mjs.
// ABOUTME: Runs against a LIVE local Directus (:8055) + local Postgres (:54322); mutates and restores permission rows.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "apply-manifests.mjs");
const MANIFEST = join(HERE, "..", "..", "config", "directus", "public-core.json");
const URL = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN;
assert.ok(TOKEN, "DIRECTUS_TOKEN must be set (static token for local admin)");

const PG = { host: "localhost", port: "54322", user: "postgres", db: "postgres", pass: "postgres" };
const TMP = mkdtempSync(join(tmpdir(), "perm-apply-"));

// --- helpers ---------------------------------------------------------------
function sql(query) {
  return execFileSync("psql", ["-h", PG.host, "-p", PG.port, "-U", PG.user, "-d", PG.db, "-tAqc", query],
    { env: { ...process.env, PGPASSWORD: PG.pass }, encoding: "utf8" }).trim();
}
async function api(method, path, body) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}
// The apply script clears the Directus cache at start-of-run, so the direct-psql
// mutations these tests make are visible to its API reads without a harness-side
// flush — the same start-of-run clear runs in prod.
function runApply(files, { prune = false } = {}) {
  const args = [SCRIPT, ...files, ...(prune ? ["--prune"] : [])];
  try {
    const stdout = execFileSync("node", args, { env: { ...process.env, DIRECTUS_URL: URL, DIRECTUS_TOKEN: TOKEN }, encoding: "utf8" });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status ?? 1, stdout: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}
const realManifest = () => JSON.parse(readFileSync(MANIFEST, "utf8"));
// Fixture: real collections[] (managed-scope + meta preserved), no fields/relations, custom permissions.
function fixture(permissions, { extraFields = [] } = {}) {
  const m = realManifest();
  const f = { collections: m.collections, fields: extraFields, relations: [], permissions };
  const path = join(TMP, `fix-${Math.abs(hash(JSON.stringify(permissions) + JSON.stringify(extraFields)))}.json`);
  writeFileSync(path, JSON.stringify(f));
  return path;
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
const LEADER = "01da7040-5d25-4ad5-87d8-0d133eb92791";
const ADVISOR = "ff7cb7ab-c4ac-44c8-ad2c-74664ef06bd9";
const PUBLIC = "abf8a154-5b1c-4a46-ac9c-7300570f4f17";
// The 6 real Leader grants the manifest carries.
const LEADER_GRANTS = () => realManifest().permissions;
// managed business collections = manifest collections minus directus_*
const managedCollections = () => realManifest().collections.map(c => c.collection).filter(c => !c.startsWith("directus_"));

function permRows(policy, collection) {
  const cols = collection ? `AND collection='${collection}'` : "";
  return JSON.parse(sql(
    `SELECT coalesce(json_agg(json_build_object('id',id,'collection',collection,'action',action,'fields',fields) ORDER BY collection,action),'[]') ` +
    `FROM directus.directus_permissions WHERE policy='${policy}' ${cols};`));
}

// --- snapshot / restore ----------------------------------------------------
let snapshot;
before(() => {
  const cols = managedCollections().map(c => `'${c}'`).join(",");
  snapshot = sql(
    `SELECT coalesce(json_agg(row_to_json(p)),'[]') FROM directus.directus_permissions p ` +
    `WHERE collection IN (${cols}) AND policy IN ('${LEADER}','${ADVISOR}','${PUBLIC}');`);
});
function restore() {
  const cols = managedCollections().map(c => `'${c}'`).join(",");
  sql(`DELETE FROM directus.directus_permissions WHERE collection IN (${cols}) AND policy IN ('${LEADER}','${ADVISOR}','${PUBLIC}');`);
  // json_populate_recordset restores every column with its native type (fields is
  // a CSV text column, not jsonb) — faithful round-trip regardless of shape.
  const json = snapshot.replace(/'/g, "''");
  sql(`INSERT INTO directus.directus_permissions SELECT * FROM json_populate_recordset(NULL::directus.directus_permissions, '${json}');`);
}
after(() => { restore(); });

// --- tests -----------------------------------------------------------------

test("1. create path: deleted grants are recreated", async () => {
  sql(`DELETE FROM directus.directus_permissions WHERE policy='${LEADER}' AND collection IN ('account','address_entity');`);
  assert.equal(permRows(LEADER, "account").length + permRows(LEADER, "address_entity").length, 0);
  const r = runApply([fixture(LEADER_GRANTS())]);
  assert.equal(r.code, 0, r.stdout);
  const acct = permRows(LEADER, "account");
  assert.equal(acct.length, 5, "account CRUD+share");
  assert.equal(permRows(LEADER, "address_entity").length, 1);
  // Directus stores permission fields as a CSV text column → "*", not ["*"].
  assert.equal(acct.find(p => p.action === "read").fields, "*");
  restore();
});

test("2. update path: corrupted fields restored in place (PATCH, same id)", async () => {
  const before = permRows(LEADER, "account").find(p => p.action === "read");
  sql(`UPDATE directus.directus_permissions SET fields='id' WHERE id=${before.id};`);
  const r = runApply([fixture(LEADER_GRANTS())]);
  assert.equal(r.code, 0, r.stdout);
  const after = permRows(LEADER, "account").filter(p => p.action === "read");
  assert.equal(after.length, 1, "no duplicate row");
  assert.equal(after[0].id, before.id, "same row patched, not recreated");
  assert.equal(after[0].fields, "*", "fields restored");
  restore();
});

test("3. idempotency: second run creates no duplicates", async () => {
  assert.equal(runApply([fixture(LEADER_GRANTS())]).code, 0);
  const first = permRows(LEADER, "account").length;
  assert.equal(runApply([fixture(LEADER_GRANTS())]).code, 0);
  assert.equal(permRows(LEADER, "account").length, first, "count unchanged");
  restore();
});

test("4. duplicate guard: pre-existing dup on a tuple fails the run, no patch", async () => {
  const read = permRows(LEADER, "account").find(p => p.action === "read");
  sql(`INSERT INTO directus.directus_permissions (policy,collection,action,fields,permissions,validation) ` +
    `VALUES ('${LEADER}','account','read','["id"]'::jsonb,'{}'::jsonb,'{}'::jsonb);`);
  const r = runApply([fixture(LEADER_GRANTS())]);
  assert.notEqual(r.code, 0, "must fail on duplicate tuple");
  assert.match(r.stdout, /account:read|duplicate/i);
  restore();
});

test("5. preflight failure: bogus role aborts before any mutation", async () => {
  const snap = permRows(LEADER, "account");
  const bad = [{ role: "NoSuchRole", collection: "account", action: "read", fields: ["*"], permissions: {}, validation: {}, presets: null }];
  const r = runApply([fixture(bad)]);
  assert.notEqual(r.code, 0);
  assert.deepEqual(permRows(LEADER, "account"), snap, "no permission rows mutated");
  restore();
});

test("6. drift (Advisor): reported + non-zero by default, removed by --prune", async () => {
  sql(`INSERT INTO directus.directus_permissions (policy,collection,action,fields,permissions,validation) ` +
    `VALUES ('${ADVISOR}','account','read','["*"]'::jsonb,'{}'::jsonb,'{}'::jsonb);`);
  const r = runApply([fixture(LEADER_GRANTS())]);
  assert.notEqual(r.code, 0, "drift must fail the run");
  assert.match(r.stdout, /DRIFT.*Advisor.*account.*read/is);
  assert.equal(permRows(ADVISOR, "account").length, 1, "not deleted without --prune");
  const p = runApply([fixture(LEADER_GRANTS())], { prune: true });
  assert.equal(p.code, 0, p.stdout);
  assert.equal(permRows(ADVISOR, "account").length, 0, "pruned");
  restore();
});

test("7. drift (public policy, highest risk): reported + pruned", async () => {
  sql(`INSERT INTO directus.directus_permissions (policy,collection,action,fields,permissions,validation) ` +
    `VALUES ('${PUBLIC}','account','read','["*"]'::jsonb,'{}'::jsonb,'{}'::jsonb);`);
  const r = runApply([fixture(LEADER_GRANTS())]);
  assert.notEqual(r.code, 0);
  assert.match(r.stdout, /DRIFT.*account.*read/is);
  const p = runApply([fixture(LEADER_GRANTS())], { prune: true });
  assert.equal(p.code, 0, p.stdout);
  assert.equal(permRows(PUBLIC, "account").length, 0, "public grant pruned");
  restore();
});

test("8. drift on zero-grant declared collection (contact): reported", async () => {
  sql(`INSERT INTO directus.directus_permissions (policy,collection,action,fields,permissions,validation) ` +
    `VALUES ('${LEADER}','contact','read','["*"]'::jsonb,'{}'::jsonb,'{}'::jsonb);`);
  const r = runApply([fixture(LEADER_GRANTS())]);
  assert.notEqual(r.code, 0, "grant on a managed collection with no manifest entry is drift");
  assert.match(r.stdout, /DRIFT.*contact.*read/is);
  restore();
});

test("9. cross-cutting preflight: valid field change + bad permission → neither applied", async () => {
  const beforeNote = (await api("GET", "/fields/lead/name_first")).json.data.meta.note;
  const fieldEdit = [{ collection: "lead", field: "name_first", type: "text",
    schema: { name: "name_first", table: "lead", data_type: "text" },
    meta: { interface: "input", readonly: true, note: "PREFLIGHT_SHOULD_NOT_APPLY" } }];
  const bad = [{ role: "NoSuchRole", collection: "account", action: "read", fields: ["*"], permissions: {}, validation: {}, presets: null }];
  const permSnap = permRows(LEADER, "account");
  const r = runApply([fixture(bad, { extraFields: fieldEdit })]);
  assert.notEqual(r.code, 0);
  const afterNote = (await api("GET", "/fields/lead/name_first")).json.data.meta.note;
  assert.notEqual(afterNote, "PREFLIGHT_SHOULD_NOT_APPLY", "field change must NOT have applied");
  assert.deepEqual(permRows(LEADER, "account"), permSnap, "permissions untouched");
  // self-restore the field note in case a regression let the edit through
  await api("PATCH", "/fields/lead/name_first", { meta: { note: beforeNote } });
  restore();
});

test("10. non-regression: full manifest applies field meta (proves the metadata path still runs)", async () => {
  // account.code carries readonly:true in this manifest. Dirty it first so a
  // passing assert proves apply actually reapplied the meta, not that it was
  // already correct (tautology).
  await api("PATCH", "/fields/account/code", { meta: { readonly: false } });
  assert.equal((await api("GET", "/fields/account/code")).json.data.meta.readonly, false, "precondition dirtied");
  const r = runApply([MANIFEST]);
  assert.equal(r.code, 0, r.stdout);
  const f = (await api("GET", "/fields/account/code")).json;
  assert.equal(f.data.meta.readonly, true, "apply restored account.code readonly");
  restore();
});

test("11. round-trip: live Leader grants match the manifest", async () => {
  const r = runApply([fixture(LEADER_GRANTS())]);
  assert.equal(r.code, 0, r.stdout);
  const live = permRows(LEADER)
    .filter(p => ["account", "address_entity"].includes(p.collection))
    .map(p => `${p.collection}:${p.action}`).sort();
  const want = LEADER_GRANTS().map(g => `${g.collection}:${g.action}`).sort();
  assert.deepEqual(live, want);
  restore();
});
