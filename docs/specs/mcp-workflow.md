# Spec: Directus MCP Workflow

**Status:** Draft — partially implemented
**Owner:** Platform Team
**Last updated:** 2026-05-02

> **Implementation note (2026-05-02):** This spec describes an MCP-driven workflow using `@directus/content-mcp`'s `apply`/`export` CLI tools. That CLI does not exist — `@directus/content-mcp@0.1.0` is an MCP server (stdio tools for AI agents), not a command-line apply/export tool. Today, manifests are applied via `directus/scripts/apply-manifests.mjs` (REST PATCH against a running Directus). The MCP-server workflow is still the intended endgame for interactive editing from Claude agents. The `mcp apply` / `mcp export` invocations below should be read as either (a) "run the apply script" or (b) "drive equivalent calls through the MCP server from a Claude session" — the round-trip and GitOps intent is unchanged.
**Related specs:**
[directus-supabase-adapter.md](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-supabase-adapter.md) ·
[directus-collection-manifest.md](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-collection-manifest.md) ·
[directus-permission-matrix.md](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-permission-matrix.md)
**Upstream:**
[`@directus/content-mcp`](https://www.npmjs.com/package/@directus/content-mcp) ·
[Directus MCP guide](https://directus.io/docs/guides/ai/mcp)

## 1. Purpose

Describe how the official `@directus/content-mcp` MCP server is used day-to-day to drive Directus configuration from committed JSON manifests — for both humans and Claude agents. Covers bootstrap, change workflows, agent workspaces, and the MCP-vs-UI split.

## 2. Prerequisites

- Directus **v11.12+** (the version that ships the MCP-compatible schema API).
- A Directus static token for an **Admin** role account (service account, not a real person). Stored as `DIRECTUS_TOKEN` in the submodule's env, **not** in `db-schema`.
- Node 20+ for running the MCP server via `npx`.

## 3. Where MCP config lives

Per the repo-separation contract ([directus-supabase-adapter.md §2](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-supabase-adapter.md)):

| Location | Contents |
|---|---|
| `db-schema/.mcp.json` | Supabase MCP only. Must **not** gain a Directus entry — keeps this repo's MCP surface small. |
| `apps-directus/.mcp.json` | Directus MCP entry. Lives next to the Directus container. |
| `db-schema/agents/directus-admin/.mcp.json` | Optional agent workspace that loads **both** Supabase + Directus MCPs for admins who need to cross the boundary. |

The staging copy of the Directus MCP config lives at `config/directus/_staging/.mcp.json` until the submodule absorbs it.

### Reference entry

```json
{
  "mcpServers": {
    "directus": {
      "command": "npx",
      "args": ["-y", "@directus/content-mcp@latest"],
      "env": {
        "DIRECTUS_URL": "https://directus.kironhitel.hu",
        "DIRECTUS_TOKEN": "${DIRECTUS_ADMIN_TOKEN}"
      }
    }
  }
}
```

Token secret style: start with plaintext in the submodule to match this repo's `.mcp.json` pattern. Rotate to `op run` once the submodule adds 1Password wiring.

## 4. Bootstrap sequence

From a clean checkout on a developer laptop:

```bash
# 1. Start local Supabase
docker compose up -d

# 2. Apply database migrations
./scripts/apply_migrations.sh dev

# 3. Start Directus (in the submodule)
cd directus && ./setup-directus.sh && cd -

# 4. Apply Directus collection manifests via MCP
#    (from inside an agent workspace or any MCP-capable client)
mcp apply config/directus/events-collections.json
mcp apply config/directus/public-core.json      # once drafted (this spec's sibling deliverable)
# ... etc

# 5. Round-trip sanity check
mcp export --schema public --schema events > /tmp/roundtrip.json
diff <(jq -S . config/directus/public-core.json) <(jq -S . /tmp/roundtrip.json)
```

`setup-directus.sh` must **not** seed `directus_users` beyond the single admin account (see [directus-supabase-adapter.md §5](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-supabase-adapter.md)).

## 5. Change workflow

Schema changes always start in SQL, never in Directus.

```
┌──────────────────────────────────────────────────────────────┐
│  1. Edit supabase/migrations/<schema>_<domain>.sql           │
│     (consolidated file, idempotent)                          │
│                                                              │
│  2. ./scripts/apply_migrations.sh dev                        │
│                                                              │
│  3. npm run schema:generate  (regen DBML)                    │
│                                                              │
│  4. MCP: sync collection schema from DB                      │
│     → pulls new columns into Directus                        │
│                                                              │
│  5. Hand-edit the relevant config/directus/*.json:           │
│     - add interface, display, translations for new fields    │
│     - update permissions per docs/specs/                     │
│       directus-permission-matrix.md                          │
│                                                              │
│  6. mcp apply config/directus/<file>.json                    │
│                                                              │
│  7. mcp export ... > /tmp/check.json                         │
│     diff should be empty                                     │
│                                                              │
│  8. Commit SQL + DBML + manifest together                    │
└──────────────────────────────────────────────────────────────┘
```

### Reverse direction (UI-first change)

If someone edits collection metadata in the Directus UI (should be rare, but happens for quick icon / translation fixes):

```bash
mcp export --schema public > /tmp/directus-public.json
# Compare manually, fold legitimate changes into config/directus/public-core.json,
# discard ad-hoc drift. Then re-apply to normalize.
mcp apply config/directus/public-core.json
```

CI's round-trip check is what forces this reconciliation — if the UI and JSON disagree, builds fail.

## 6. MCP operations by responsibility

### Owned by MCP (automate, commit JSON)

- Collection create/update/delete
- Field create/update/delete
- Relations
- Role permissions
- Flows (webhooks, hooks, actions)
- Translations

### UI-only (not in version control)

- Dashboards and insight panels
- Per-user bookmarks, filters, preferences
- File library contents
- `directus_activity` log (append-only, system-generated)

### Off-limits from MCP (edit SQL instead)

- Adding or removing columns, indexes, constraints
- RLS policies (belong in Supabase migrations)
- Triggers, functions
- Any `directus.*` system table structure

## 7. Agent workspaces

Per `agents/README.md`, this repo uses per-agent MCP workspaces to keep context small. For Directus work:

### `directus-admin` (proposed)

```
agents/directus-admin/
├── .mcp.json          # Supabase + Directus MCPs
├── CLAUDE.md          # Routing + common tasks
└── launch.sh
```

- Loads Supabase MCP (for schema checks + RLS validation) and Directus MCP.
- Used for: applying manifests, cross-checking RLS vs permissions, debugging flows.
- Not used for: ETL work, source-data exploration (use `data-migration` or `source-explorer` instead).

### `schema-dev` (existing)

Does not load Directus MCP. Schema-dev makes migrations and DBML; Directus sync happens in `directus-admin` after.

## 8. CI enforcement

Planned GitHub Actions job (lives in `apps-directus`, since it needs `DIRECTUS_URL`):

1. Spin up a scratch Directus container seeded from migrations.
2. `mcp apply` every `config/directus/*.json`.
3. `mcp export` the same scopes and diff against committed JSON.
4. Run `scripts/validate_directus_manifest.mjs` (lint rules from [directus-collection-manifest.md §7](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-collection-manifest.md)).
5. Run `scripts/validate_directus_permissions.mjs` (subset-of-RLS from [directus-permission-matrix.md §7](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-permission-matrix.md)).

Failure modes:
- Drift → author re-exports or re-applies, depending on which side is correct.
- Lint failure → author fixes the manifest.
- Subset-of-RLS failure → author either tightens the Directus permission or first widens the RLS policy via a new migration.

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `mcp apply` errors on unknown field | Column was added in Directus UI but no migration | Revert UI change, write migration, re-apply |
| Round-trip diff on `meta.sort` only | Manual drag-reorder in UI | Re-export and commit — sort order is data, not config |
| Permission denied applying schema | MCP token not Admin | Regenerate token as Admin role |
| `DB_SEARCH_PATH` not finding `events.*` | Directus started before events schema created | Restart Directus after migrations |
| Directus shows tables that shouldn't be visible (`appsheet.*`) | Directus discovered them during schema sync | Hide via `meta.hidden: true` in manifest; or remove from `DB_SEARCH_PATH` |

## 10. Acceptance criteria

- Bootstrap sequence (§4) runs end-to-end without manual UI intervention beyond admin login.
- Change workflow (§5) is followed for every schema-touching PR.
- CI (§8) green on `main` for at least one cycle before we call the workflow production-ready.
