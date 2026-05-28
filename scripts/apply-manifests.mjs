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

const files = argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node apply-manifests.mjs <manifest.json> [...]");
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

for (const file of files) {
  console.log(`\n=== ${file} ===`);
  let manifest;
  try {
    const raw = await readFile(file, "utf8");
    manifest = JSON.parse(raw);
  } catch (err) {
    failures++;
    console.log(`FAIL     load ${file}: ${err.message}`);
    continue;
  }

  for (const c of manifest.collections ?? []) await applyCollection(c);
  for (const f of manifest.fields ?? []) await applyField(f);
  for (const r of manifest.relations ?? []) await applyRelation(r);
}

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
