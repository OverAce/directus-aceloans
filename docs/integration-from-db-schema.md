# Integration with the parent `db-schema` repo

This submodule (`apps-directus`) is the canonical home for Directus runtime,
container config, and Directus-side CI. The parent
[`db-schema`](https://github.com/KironPartner/db-schema) repo owns the
Postgres schema, migrations, and Directus collection manifests.

This document records the repo-boundary contract and the integration points
the two repos share. It was ported from `config/directus/_staging/README.md`
on `db-schema`'s `directus-integration` branch when those staging files were
absorbed into the submodule.

## Repo-boundary contract

| Concern                                            | Repo                                                    |
| -------------------------------------------------- | ------------------------------------------------------- |
| Supabase schema, migrations, DBML                  | `db-schema`                                             |
| ETL transformer framework                          | `db-schema`                                             |
| Directus collection manifests (JSON)               | `db-schema` &mdash; `config/directus/*.json`            |
| **Directus container, MCP config, Directus CI**    | **`apps-directus` (this repo)**                         |
| Directus Flows, extensions, hooks                  | `apps-directus`                                         |

## What lives where in this submodule

| File                                              | Purpose                                                  |
| ------------------------------------------------- | -------------------------------------------------------- |
| `docker-compose.yml`                              | Portable base (no host ports, no host-specific mounts).  |
| `docker-compose.sentinel.yml`                     | Staging overlay for the sentinel host.                   |
| `docker-compose.mbp.yml`                          | MBP-local dev overlay (follow-up; not yet present).      |
| `scripts/setup-directus.sh`                       | Local-dev bootstrap: schema + KEY/SECRET + bring-up.     |
| `extensions/operations/gravity-forms-operation/`  | Custom Directus Flow operation (lives on its own branch; rebased onto `main` on merge). |
| `.env.example`                                    | Template for `.env.staging` / `.env.local`.              |

## What does NOT move into this submodule

- **`config/directus/*.json` (the manifests)** &mdash; these stay in
  `db-schema`. The submodule fetches them at apply-time. Manifest
  authorship is a `db-schema` concern because it's tied to the Supabase
  schema, which lives there.
- **`config/directus/README.md`** &mdash; describes the manifests for
  `db-schema` authors; stays in `db-schema`.

## Working across the boundary

When applying manifests against a running Directus instance from this
submodule:

```bash
# From the parent db-schema repo root, using the submodule's running Directus
cd ../   # or wherever db-schema is checked out
npx @directus/content-mcp apply config/directus/events-collections.json
npx @directus/content-mcp apply config/directus/public-core.json
```

Round-trip check (must produce zero diff):

```bash
npx @directus/content-mcp export > /tmp/exported.json
diff config/directus/public-core.json /tmp/exported.json
```

## Cross-references in `db-schema`

The following specs live in the parent repo and govern this integration. Paths are
relative to the `db-schema` repo root:

- `docs/directus-playbook.md` &mdash; operator's runbook (first-time setup, day-to-day, going live, troubleshooting)
- `docs/specs/directus-supabase-adapter.md` &mdash; adapter spec
- `docs/specs/directus-collection-manifest.md` &mdash; manifest spec (round-trip integrity)
- `docs/specs/directus-permission-matrix.md` &mdash; permission matrix
- `docs/specs/directus-mcp-workflow.md` &mdash; MCP workflow
- `docs/specs/directus-users-migration.md` &mdash; `directus_users` lifecycle (Phase 1 keeps it empty until activation)
- `docs/specs/directus-sentinel-deployment.md` &mdash; sentinel staging deployment (this PR)

## Migration provenance

- Source: `db-schema` repo, `directus-integration` branch, commit `ed8bb436`
  (`docs(directus): add public-core manifest, _staging tree, port PR #4 docs`).
- Files moved: `_staging/setup-directus.sh` &rarr; `scripts/setup-directus.sh`,
  `_staging/README.md` &rarr; `docs/integration-from-db-schema.md` (this file).
- Files NOT moved (intentionally): `_staging/docker-compose.yml` (would
  downgrade to 11.12.0; this submodule's base is pinned to 11.15.1) and
  `_staging/github-actions/*.yml` (CI is out of scope for the sentinel
  deployment task &mdash; revisit when sentinel is live).
- The `_staging/` directory in `db-schema` will be cleaned up when
  `directus-integration` merges.
