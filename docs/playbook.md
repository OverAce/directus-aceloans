# Directus ↔ Supabase Playbook

Single operational runbook for the Directus admin layer that sits on top of Supabase. Use this for first-time setup, day-to-day changes, going live, and troubleshooting. The four specs under `docs/specs/directus-*.md` are the design contracts; this is the operator's guide.

## 1. How the two repos connect

Two repositories collaborate. They have **distinct concerns** and **release independently**, but the manifest JSON in `db-schema` is what wires them together at apply time.

```
┌───────────────────────────────┐    ┌───────────────────────────────┐
│ db-schema (this repo)         │    │ directus-aceloans (submodule)     │
│                               │    │                               │
│ • supabase/migrations/        │    │ • docker-compose.yml          │
│ • dbml/                       │    │ • setup-directus.sh           │
│ • etl/ + transformer specs    │◄───┤ • .mcp.json (Directus entry)  │
│ • config/directus/*.json      │    │ • .github/workflows/          │
│   ← source of truth for       │    │ • Directus extensions/flows   │
│     Directus collection       │    │                               │
│     metadata                  │    │ Pinned in db-schema as        │
│ • docs/specs/directus-*.md    │    │   directus/ submodule         │
│   ← design contracts          │    │   (currently 94604ac)         │
│ • docs/specs/directus-*.md    │    │                               │
│ • config/directus/_staging/   │    │ Reads manifests from          │
│   ← drafts destined here →►   ├───►│   db-schema:config/directus/  │
└───────────────────────────────┘    └───────────────────────────────┘
```

**The contract:**

- `db-schema` is the source of truth for the database schema **and** for Directus collection/field/permission metadata (committed JSON manifests).
- `directus-aceloans` is the source of truth for the Directus runtime: the container, env, MCP config, setup scripts, GitHub Actions, and any Directus-side extensions or flows code.
- Manifests cross the boundary at apply time: the submodule's CI checks out `db-schema` at a pinned ref and applies `config/directus/*.json` to the live Directus.
- The `directus/` submodule is pinned in `db-schema`. Bumping the pin is a normal db-schema commit; the submodule develops its own history independently.

**Why this split?** Schema changes ship on Supabase's release cadence; Directus runtime changes ship on its own cadence; CI for each side is scoped tightly; and Directus engineers don't need to touch schema PRs to update Directus config.

## 2. First-time setup (fresh machine → Directus live)

Time: 30–60 min the first time, mostly waiting on container boots.

### Prerequisites

- Docker + Docker Compose v2
- `psql`, `node` (≥20), `npm`, `openssl`
- `supabase` CLI (optional but useful)
- 1Password CLI `op` if your team rotates secrets through it (not required for Phase 1)

### Steps

**1. Clone db-schema and initialize the submodule.**

```bash
git clone <db-schema-url> kiron-db
cd kiron-db
git submodule update --init --recursive
```

After this, `directus/` contains the `directus-aceloans` checkout pinned at the recorded commit.

**2. Bring up Supabase locally and apply migrations.**

```bash
docker compose up -d              # local Supabase stack
./scripts/apply_migrations.sh dev # applies supabase/migrations/*.sql
```

Verify: `psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT count(*) FROM public.user;"` should not error.

**3. (One-time only, if the submodule isn't yet stocked.)** Migrate the staging artifacts into the submodule.

If `directus/docker-compose.yml` already exists, skip this step. Otherwise, follow `config/directus/_staging/README.md` to copy each file to its destination in the submodule, commit on a branch in the submodule, and bump the pin in db-schema.

**4. Bring up Directus.**

```bash
cd directus
cp .env.example .env              # create local env from template (script reads .env, not .env.local)
./scripts/setup-directus.sh       # creates `directus` schema, generates KEY/SECRET, boots containers, waits for /server/health
cd -
```

The script intentionally does **not** seed business users into `directus_users`. The bootstrap admin (`admin@kiron.local` / `changeme123`) is the only seeded record. Change this password after first login.

**5. Apply collection manifests via the Directus MCP.**

Open an MCP-capable client (Claude Desktop, Claude Code, or the bare `npx @directus/content-mcp` CLI):

```bash
mcp apply config/directus/events-collections.json
mcp apply config/directus/public-core.json
# Future manifests: public-commissions.json, public-junctions.json, directus-flows.json
```

**6. Round-trip drift check.**

```bash
for f in config/directus/*.json; do
  mcp export --collection-list "$(jq -r '.collections[].collection' "$f" | tr '\n' ',')" \
    > "/tmp/$(basename "$f")"
  diff -u "$f" "/tmp/$(basename "$f")" || echo "DRIFT in $f"
done
```

Empty diff = success. Non-empty = either re-export (if live state is correct) or re-apply (if the manifest is correct). See [`docs/specs/directus-collection-manifest.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-collection-manifest.md) §5.

**7. Verify in the UI.**

- Open `http://localhost:8055`.
- Log in with the bootstrap admin.
- Confirm the seven `public.*` collections (`user`, `account`, `contact`, `lead`, `deal`, `loan`, `vendor`) appear in the navigation under group **Public CRM**.
- Confirm the five `events.*` collections appear under **Events**.
- Spot-check a status field — e.g. `lead.status_workflow` — for the color-coded labels and Hungarian translation.

**Done.** Phase 1 is live.

## 3. Day-to-day change workflow

Three change scenarios. Each is a numbered checklist; copy and paste.

### A. Schema change (DB-first — always start here)

Adding a column, changing a constraint, splitting a status enum — anything that touches the database.

```
1. Edit supabase/migrations/<schema>_<domain>.sql        (consolidated file)
2. ./scripts/apply_migrations.sh dev
3. npm run schema:generate                               (regen DBML)
4. mcp sync --from-db <collection>                       (pulls new columns into Directus)
5. Hand-edit config/directus/<file>.json:
     - add interface, display, translations for new fields
     - update permissions per [docs/specs/directus-permission-matrix.md](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-permission-matrix.md)
6. mcp apply config/directus/<file>.json
7. Round-trip check (step 6 from §2)
8. Commit SQL + JSON together — they move as a pair
```

### B. UI experiment that needs to be saved

You configured something in the Directus UI and want to commit it.

```
1. mcp export <collection-or-file> > /tmp/exported.json
2. Compare to existing config/directus/<file>.json
3. Fold legitimate changes into the manifest by hand (NOT a wholesale overwrite)
4. mcp apply config/directus/<file>.json                 (re-apply to normalize)
5. Round-trip check
6. Commit
```

If the UI change is a dashboard or insight panel, it's UI-only — no JSON to commit. See `docs/specs/directus-mcp-workflow.md` §6 for the MCP-vs-UI split.

### C. Permission change

```
1. Edit config/directus/<schema>-permissions.json        (file format per [directus-permission-matrix.md](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-permission-matrix.md))
2. Validate against RLS ceiling:
     node scripts/validate_directus_permissions.mjs <file>   (planned)
3. mcp apply
4. Verify by impersonating the role: Settings → Access Control → <Role> → "View as"
5. Round-trip check
6. Commit
```

If the underlying RLS policy needs to change, do that in `supabase/migrations/<schema>_rls.sql` first, then update Directus permissions to stay subset-of-RLS.

## 4. Going live (Phase 1 → Phase 2)

Phase 1 = Directus is up but `directus_users` is empty (just the bootstrap admin). Phase 2 = staff log in to Directus to do their work.

### Pre-cutover checklist

- [ ] Fresh `KEY` and `SECRET` generated for the production `.env` (`openssl rand -base64 32`).
- [ ] Bootstrap admin password rotated; admin recovery email set.
- [ ] TLS termination in front of `:8055` (reverse proxy or managed ingress).
- [ ] IP allowlist applied if the staff network is fixed.
- [ ] Every committed `config/directus/*.json` has been applied via MCP and round-trip is empty.
- [ ] The three submodule GitHub Actions are green (`lint-manifests`, `apply-on-deploy`, `round-trip-drift`).
- [ ] Permission matrix in [`docs/specs/directus-permission-matrix.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-permission-matrix.md) matches what's live; impersonate each role and confirm.
- [ ] Backup/restore drill against the `directus` schema specifically. Postgres-level `pg_dump -n directus` should restore cleanly to a fresh DB.

### Cutover sequence

1. Drain — pause webhook ingress (Gravity Forms, Zoho Bigin, n8n) so no inserts happen during backfill.
2. Backfill `directus_users` from `public.user` per [`docs/specs/directus-users-migration.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-users-migration.md) Phase 2. Map `role` column accordingly. The bidirectional sync flow (Phase 3) handles new users from this point on.
3. Apply Phase-2 permissions manifest (`config/directus/<schema>-permissions.json`) — switches everyone from "Admin or nothing" to scoped roles.
4. Smoke-test each role: log in as a known Consultant, confirm they see only their own leads; same for Manager, Partner, Affiliate.
5. Resume webhook ingress.
6. Announce.

### Rollback

If anything misbehaves within the first hour:

1. Re-pause webhook ingress.
2. Truncate `directus.directus_users` keeping only the bootstrap admin.
3. Re-apply the Phase-1 permissions manifest (Admin only).
4. Investigate from logs (`docker compose logs directus`, `events.activity_log`).
5. Fix and retry the cutover from step 1.

The `public.*` and `events.*` data is untouched by any of this — Directus only writes to `directus.*`.

## 5. Troubleshooting flow

Start with the symptom column. Each entry points to the diagnostic command and the likely fix.

### "Directus won't start"

| Symptom | Likely cause | Fix |
|---|---|---|
| `docker compose up` fails on `cache` | Redis port collision | `lsof -i :6379`; stop the other Redis or change the port mapping |
| `setup-directus.sh` fails at "verifying Supabase Postgres" | Supabase not running, or wrong port | `supabase status`; verify `:54322` is exposed |
| Directus container exits immediately | `KEY`/`SECRET` missing or unparseable | Re-run setup script — it regenerates them if defaults are present |
| `/server/health` never returns | Schema permission denied | `psql ... -c "GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA events TO postgres;"` |

### "Tables not visible in Directus"

| Symptom | Likely cause | Fix |
|---|---|---|
| Auto-discover shows nothing | Wrong `DB_SEARCH_PATH` | Check `.env.local`: `DB_SEARCH_PATH=array:directus,public,events` |
| Some tables missing | Manifest never applied | `mcp apply config/directus/<file>.json` |
| Collection visible but empty | RLS blocking — but Directus connects as superuser, so this is rare | Check `pg_stat_activity` for the connecting role; if not `postgres`, revisit `.env.local` |

### "MCP apply / export fails"

| Symptom | Likely cause | Fix |
|---|---|---|
| `Unauthorized` | Token invalid or revoked | Issue a new static token in Directus → Settings → Access Tokens; update `directus-aceloans/.mcp.json` |
| `Unsupported Directus version` | Server below 11.12 | Bump the image pin in the submodule's `docker-compose.yml`; re-deploy |
| `Validation failed` on a manifest | Lint rules violated | Run `node scripts/validate_directus_manifest.mjs <file>` (planned); see [`docs/specs/directus-collection-manifest.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-collection-manifest.md) §7 |

### "Round-trip diff is non-empty"

This is the canonical drift signal. Decision flow:

```
diff non-empty
   │
   ├─ live state is correct → re-export & commit
   │     mcp export ... > config/directus/<file>.json
   │     git commit
   │
   ├─ manifest is correct → re-apply
   │     mcp apply config/directus/<file>.json
   │     re-run round-trip; should be empty now
   │
   └─ both are wrong (rare) → fix manifest by hand,
         apply, verify, commit
```

If the drift is "Directus serialized a default that wasn't in the manifest," that's a Directus version artefact — re-export and accept the live state, ideally pinned to a known Directus version per [`docs/specs/directus-collection-manifest.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-collection-manifest.md) §8.

### "Round-trip CI failing nightly"

Means someone hand-edited Directus through the UI without exporting. Check the Directus activity log (`directus_activity` collection) for recent edits, identify the change, then run scenario **B** (UI experiment) above.

### "Consent bounce notifications missing"

This isn't a Directus problem; it's the `events.email` SES/SNS plumbing. See CLAUDE.md "Consent System Architecture" → "Email Bounce Handling".

## 6. Where to find each setting

| What you want to change | Lives in | Type |
|---|---|---|
| Database schema | `db-schema:supabase/migrations/<schema>_<domain>.sql` | SQL migration |
| Collection icon, color, display, translations | `db-schema:config/directus/<file>.json` | MCP-managed |
| Field interface, validation, FK, choices | `db-schema:config/directus/<file>.json` | MCP-managed |
| Role permissions | `db-schema:config/directus/<schema>-permissions.json` | MCP-managed |
| Flows (event hooks, automation) | `db-schema:config/directus/directus-flows.json` (planned) | MCP-managed |
| Dashboards, Insight panels | Directus UI | UI-only |
| File storage backend | `directus-aceloans:.env` (`STORAGE_*`) | env |
| SMTP / email | `directus-aceloans:.env` (`EMAIL_*`) | env |
| Bootstrap admin password | Directus UI / `directus-aceloans:.env` (`ADMIN_PASSWORD`) | env on first boot, UI thereafter |
| Container image version | `directus-aceloans:docker-compose.yml` | submodule commit + db-schema submodule pin bump |
| Submodule pin | `db-schema:.gitmodules` + commit | commit in db-schema |

## 7. Cross-references

In db-schema (cross-repo):

| Topic | Doc |
|---|---|
| One-page integration overview | [`docs/INTEGRATION-SUMMARY.md`](https://github.com/KironPartner/db-schema/blob/main/docs/INTEGRATION-SUMMARY.md) |
| Detailed integration reference | [`docs/directus-supabase-integration.md`](https://github.com/KironPartner/db-schema/blob/main/docs/directus-supabase-integration.md) |
| Schema separation contract | [`docs/specs/directus-supabase-adapter.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-supabase-adapter.md) |
| Manifest shape and lint rules | [`docs/specs/directus-collection-manifest.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-collection-manifest.md) |
| Permission matrix | [`docs/specs/directus-permission-matrix.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-permission-matrix.md) |
| `directus_users` lifecycle | [`docs/specs/directus-users-migration.md`](https://github.com/KironPartner/db-schema/blob/main/docs/specs/directus-users-migration.md) |
| Collection-level config UI walkthrough | [`docs/directus-configuration-guide.md`](https://github.com/KironPartner/db-schema/blob/main/docs/directus-configuration-guide.md) |
| Reference manifests | [`config/directus/events-collections.json`](https://github.com/KironPartner/db-schema/tree/main/config/directus), [`public-core.json`](https://github.com/KironPartner/db-schema/blob/main/config/directus/public-core.json) |
| External-mappings decision history | [`docs/ARCHITECTURAL_DECISIONS_TODO.md`](https://github.com/KironPartner/db-schema/blob/main/docs/ARCHITECTURAL_DECISIONS_TODO.md) (AD-6) |

In this repo (directus-aceloans):

| Topic | Doc |
|---|---|
| MCP operations spec | [`docs/specs/mcp-workflow.md`](specs/mcp-workflow.md) |
| Sentinel deployment | [`docs/specs/sentinel-deployment.md`](specs/sentinel-deployment.md) |
| Repo-boundary contract | [`docs/integration-from-db-schema.md`](integration-from-db-schema.md) |
