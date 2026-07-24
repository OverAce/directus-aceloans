#!/usr/bin/env node
// Apply one or more Directus collection manifests to a running Directus
// instance via the REST API. Manifests are the {collections, fields, relations}
// shape produced/consumed by the lint-manifests CI in db-schema.
//
// Usage:
//   DIRECTUS_URL=http://localhost:8055 DIRECTUS_TOKEN=xxx \
//     node apply-manifests.mjs file1.json [file2.json ...]
//
// Why this exists: docs/specs/directus-collection-manifest.md and the apply-on-deploy
// workflow originally expected `@directus/content-mcp` to expose a CLI like
// `mcp apply <file>`. That package is an MCP server, not a CLI — no apply subcommand.
// directus-template-cli works on a different file shape and bundles permissions/users/
// content. We just need to overlay AD-5 metadata onto already auto-discovered tables,
// so this script speaks the Directus REST API directly.

import { readFile } from "node:fs/promises";
import { argv, env, exit } from "node:process";

const URL = env.DIRECTUS_URL;
const TOKEN = env.DIRECTUS_TOKEN;

if (!URL || !TOKEN) {
  console.error("DIRECTUS_URL and DIRECTUS_TOKEN must be set");
  exit(2);
}

const rawArgs = argv.slice(2);
const PRUNE = rawArgs.includes("--prune");
const files = rawArgs.filter((a) => !a.startsWith("--"));
if (files.length === 0) {
  console.error("Usage: node apply-manifests.mjs [--prune] <manifest.json> [...]");
  exit(2);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

let failures = 0;

async function req(method, path, body) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json body */ }
  return { status: res.status, json, text };
}

// PATCH first; on 404 fall back to POST (unless `noCreate` is set, in which case
// a 404 is a hard failure). Returns "UPDATED" | "CREATED" | throws.
async function upsert({ patchPath, postPath, patchBody, postBody, noCreate }) {
  const patch = await req("PATCH", patchPath, patchBody);
  if (patch.status >= 200 && patch.status < 300) return "UPDATED";
  if (patch.status === 404) {
    if (noCreate) {
      throw new Error(
        `PATCH ${patchPath} -> 404 and create suppressed. ` +
          `Directus metadata is missing for this DB-backed object — ` +
          `restart Directus or re-introspect so it discovers the column, then re-run.`
      );
    }
    const post = await req("POST", postPath, postBody);
    if (post.status >= 200 && post.status < 300) return "CREATED";
    throw new Error(`POST ${postPath} -> ${post.status} ${post.text}`);
  }
  throw new Error(`PATCH ${patchPath} -> ${patch.status} ${patch.text}`);
}

// Strip fields that would trigger DDL on a Postgres-managed schema. Postgres
// migrations own the table shape; the manifest only overlays Directus UI metadata.
// `group` references a folder that may not exist; let users set folders via UI.
function safeMeta(meta) {
  if (!meta) return meta;
  const { group, ...rest } = meta;
  return rest;
}

async function applyCollection(c) {
  const meta = safeMeta(c.meta ?? {});
  const tag = `collection ${c.collection}`;
  try {
    const result = await upsert({
      patchPath: `/collections/${c.collection}`,
      postPath: `/collections`,
      patchBody: { meta },
      postBody: { collection: c.collection, meta, schema: null },
    });
    console.log(`${result.padEnd(8)} ${tag}`);
  } catch (err) {
    failures++;
    console.log(`FAIL     ${tag}: ${err.message}`);
  }
}

async function applyField(f) {
  const tag = `field ${f.collection}.${f.field}`;
  const isAlias = f.schema === null || f.schema === undefined;
  try {
    // For real (DB-backed) fields: only patch meta. Postgres owns the schema —
    // sending it back to Directus triggers ALTER TABLE attempts, which fail on
    // PKs ("drop not null"), columns referenced by views ("cannot alter type"),
    // or trip Directus's own internal checks.
    // For alias fields (o2m/m2m): pass schema: null and the type so Directus
    // can register the virtual relation.
    const meta = safeMeta(f.meta);
    const patchBody = isAlias
      ? { type: f.type, meta, schema: null }
      : { meta };
    const postBody = isAlias
      ? { field: f.field, type: f.type, meta, schema: null }
      : { field: f.field, type: f.type, meta };
    const result = await upsert({
      patchPath: `/fields/${f.collection}/${f.field}`,
      postPath: `/fields/${f.collection}`,
      patchBody,
      postBody,
      // For non-alias (DB-backed) fields, a 404 means Directus has no metadata
      // row for a column that Postgres owns. POSTing would ask Directus to
      // create the column — exactly the ALTER TABLE we're trying to avoid.
      // Surface it as a failure instead so the operator restarts Directus to
      // re-introspect.
      noCreate: !isAlias,
    });
    console.log(`${result.padEnd(8)} ${tag}${isAlias ? " (alias)" : ""}`);
  } catch (err) {
    failures++;
    const msg = err.message.length > 200 ? err.message.slice(0, 200) + "..." : err.message;
    console.log(`FAIL     ${tag}: ${msg}`);
  }
}

async function applyRelation(r) {
  const tag = `relation ${r.collection}.${r.field} -> ${r.related_collection ?? r.schema?.foreign_key_table ?? "?"}`;
  try {
    const body = {
      collection: r.collection,
      field: r.field,
      related_collection: r.related_collection,
      schema: r.schema,
      meta: r.meta,
    };
    const result = await upsert({
      patchPath: `/relations/${r.collection}/${r.field}`,
      postPath: `/relations`,
      patchBody: body,
      postBody: body,
    });
    console.log(`${result.padEnd(8)} ${tag}`);
  } catch (err) {
    failures++;
    console.log(`FAIL     ${tag}: ${err.message}`);
  }
}

// --- permissions -----------------------------------------------------------
// Directus 11 attaches permissions to a POLICY, not a role; roles link to
// policies via directus_access. The manifest's permissions[] are role-keyed, so
// each entry's role name is resolved to the role's single non-admin policy.

// GET that requires a 2xx and returns the `data` array. A failed read (500/403)
// must NOT be silently treated as "no rows" — that would let a broken /permissions
// read pass drift clean or make findPermission POST a duplicate.
async function getData(path) {
  const res = await req("GET", path);
  if (res.status < 200 || res.status >= 300) throw new Error(`GET ${path} -> ${res.status} ${res.text}`);
  return res.json?.data ?? [];
}

const policyByRole = new Map();
async function resolvePolicyForRole(role) {
  if (policyByRole.has(role)) return policyByRole.get(role);
  const roles = await getData(`/roles?filter[name][_eq]=${encodeURIComponent(role)}&fields=id&limit=2`);
  const roleId = roles[0]?.id;
  if (!roleId) throw new Error(`role "${role}" not found`);
  const access = await getData(`/access?filter[role][_eq]=${roleId}&fields=policy.id,policy.admin_access&limit=-1`);
  const policies = access.map((a) => a.policy).filter((p) => p && !p.admin_access);
  if (policies.length !== 1) {
    throw new Error(`role "${role}" maps to ${policies.length} non-admin policies; expected exactly 1`);
  }
  policyByRole.set(role, policies[0].id);
  return policies[0].id;
}

// Locate the (policy, collection, action) row. Returns {id} | null; throws on
// >1 — directus_permissions has no unique constraint on that tuple, so a
// pre-existing duplicate is refused rather than blindly patched. limit=2 is
// enough to distinguish 0 / 1 / many.
async function findPermission(policy, collection, action) {
  const rows = await getData(
    `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${encodeURIComponent(collection)}` +
    `&filter[action][_eq]=${action}&fields=id&limit=2`);
  if (rows.length > 1) throw new Error(`duplicate rows for ${collection}:${action} on policy ${policy} (${rows.length})`);
  return rows[0] ?? null;
}

async function applyPermission(p) {
  const tag = `permission ${p.role} ${p.collection}:${p.action}`;
  try {
    const body = {
      policy: p.policy, collection: p.collection, action: p.action,
      fields: p.fields ?? ["*"], permissions: p.permissions ?? {},
      validation: p.validation ?? {}, presets: p.presets ?? null,
    };
    const existing = await findPermission(p.policy, p.collection, p.action);
    let result;
    if (existing) {
      const patch = await req("PATCH", `/permissions/${existing.id}`, body);
      if (patch.status < 200 || patch.status >= 300) throw new Error(`PATCH -> ${patch.status} ${patch.text}`);
      result = "UPDATED";
    } else {
      const post = await req("POST", `/permissions`, body);
      if (post.status < 200 || post.status >= 300) throw new Error(`POST -> ${post.status} ${post.text}`);
      result = "CREATED";
    }
    if (!(await findPermission(p.policy, p.collection, p.action))) {
      throw new Error(`post-write verify found no row for ${p.collection}:${p.action}`);
    }
    console.log(`${result.padEnd(8)} ${tag}`);
  } catch (err) {
    failures++;
    console.log(`FAIL     ${tag}: ${err.message}`);
  }
}

// Resolve every permission entry to a policy and scan for pre-existing
// duplicates WITHOUT mutating, so a bad entry aborts before the first write.
async function preflightPermissions(manifests) {
  const resolved = [];
  const errors = [];
  const seen = new Map(); // resolved (policy|collection|action) -> source, to catch conflicting dup entries
  for (const { file, manifest } of manifests) {
    for (const p of manifest.permissions ?? []) {
      try {
        const policy = await resolvePolicyForRole(p.role);
        const key = `${policy}|${p.collection}|${p.action}`;
        if (seen.has(key)) {
          throw new Error(`duplicate manifest entry for ${p.collection}:${p.action} on ${p.role} (also in ${seen.get(key)})`);
        }
        seen.set(key, file);
        await findPermission(policy, p.collection, p.action); // throws on >1 pre-existing
        resolved.push({ ...p, policy });
      } catch (err) {
        errors.push(`${file}: permission ${p.role} ${p.collection}:${p.action}: ${err.message}`);
      }
    }
  }
  return { resolved, errors };
}

// Managed scope = collections declared across the manifests (minus directus_*
// system collections) x every non-admin policy (incl. the role-less public
// policy). Any grant in that scope not present in the manifests is drift:
// reported and failing by default, deleted only with --prune.
// `allowPrune` is false when earlier apply steps failed — never delete grants on
// top of a failed convergence.
async function driftCheck(manifests, resolved, allowPrune) {
  const managedCollections = new Set();
  for (const { manifest } of manifests)
    for (const c of manifest.collections ?? [])
      if (!c.collection.startsWith("directus_")) managedCollections.add(c.collection);
  const declared = new Set(resolved.map((p) => `${p.policy}|${p.collection}|${p.action}`));

  const policies = await getData(`/policies?filter[admin_access][_eq]=false&fields=id,name&limit=-1`);
  let drift = 0;
  for (const pol of policies) {
    for (const collection of managedCollections) {
      const rows = await getData(
        `/permissions?filter[policy][_eq]=${pol.id}&filter[collection][_eq]=${encodeURIComponent(collection)}&fields=id,collection,action&limit=-1`);
      for (const row of rows) {
        if (declared.has(`${pol.id}|${row.collection}|${row.action}`)) continue;
        drift++;
        if (allowPrune) {
          const del = await req("DELETE", `/permissions/${row.id}`);
          if (del.status < 200 || del.status >= 300) {
            failures++;
            console.log(`FAIL     prune ${pol.name} ${row.collection}:${row.action}: ${del.status}`);
          } else {
            console.log(`PRUNED   permission ${pol.name} ${row.collection}:${row.action}`);
          }
        } else {
          console.log(`DRIFT    permission ${pol.name} ${row.collection}:${row.action} (live, not in manifest)`);
        }
      }
    }
  }
  if (drift > 0 && !allowPrune) {
    failures++;
    console.log(`\n${drift} unmanaged grant(s) in managed scope — add to the manifest or re-run with --prune.`);
  }
}

// --- apply -----------------------------------------------------------------
// Load every manifest up front so preflight can validate all permissions before
// any mutation touches Directus.
const manifests = [];
for (const file of files) {
  try {
    manifests.push({ file, manifest: JSON.parse(await readFile(file, "utf8")) });
  } catch (err) {
    console.log(`FAIL     load ${file}: ${err.message}`);
    exit(2);
  }
}

// Clear the cache up front so preflight/drift reads reflect the current DB even
// if a prior out-of-band change (direct SQL, another process) left it stale.
// Preflight/drift correctness depends on this, so a failed clear is fatal.
const startClear = await req("POST", "/utils/cache/clear");
if (startClear.status < 200 || startClear.status >= 300) {
  console.error(`FAIL     cache clear at start -> ${startClear.status} ${startClear.text}; aborting (reads could be stale)`);
  exit(1);
}

// PREFLIGHT (no mutation): resolve role->policy for every permission and detect
// duplicate rows. Abort before the first write if anything is unresolvable.
const { resolved: resolvedPermissions, errors: preflightErrors } = await preflightPermissions(manifests);
if (preflightErrors.length > 0) {
  console.log(`\nPreflight failed — aborting before any change:`);
  for (const e of preflightErrors) console.log(`  ${e}`);
  exit(1);
}

// MUTATE: metadata first (existing, non-atomic continue-on-failure), then
// permissions, then the managed-scope drift check.
for (const { file, manifest } of manifests) {
  console.log(`\n=== ${file} ===`);
  for (const c of manifest.collections ?? []) await applyCollection(c);
  for (const f of manifest.fields ?? []) await applyField(f);
  for (const r of manifest.relations ?? []) await applyRelation(r);
}
for (const p of resolvedPermissions) await applyPermission(p);
// Never prune on top of a failed convergence — a metadata/permission failure
// means live state is unknown, so deleting "unmanaged" grants could be wrong.
if (PRUNE && failures > 0) {
  console.log(`\nSkipping --prune: ${failures} earlier failure(s) — resolve them and re-run.`);
}
await driftCheck(manifests, resolvedPermissions, PRUNE && failures === 0);

// Directus caches collection/field metadata in memory; PATCHes write to
// directus_collections/directus_fields but the cache isn't invalidated until
// schema changes or an explicit clear. Without this, GETs against the API
// keep returning stale meta even though Postgres has the new values.
console.log("\nClearing Directus schema cache...");
const clear = await req("POST", "/utils/cache/clear");
if (clear.status >= 200 && clear.status < 300) {
  console.log("Cache cleared.");
} else {
  console.log(`WARN: cache clear returned ${clear.status}: ${clear.text}`);
}

console.log(`\n${failures === 0 ? "All applied cleanly." : `${failures} failure(s).`}`);
exit(failures === 0 ? 0 : 1);
