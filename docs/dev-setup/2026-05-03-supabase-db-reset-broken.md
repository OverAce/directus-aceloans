# Known issue: `supabase db reset` is broken for this repo

**Surfaced:** 2026-05-03 during PR #40 (`feat/directus-readonly-denormalized`) smoke-test attempts.
**Status:** Tracked here; not blocking PR #40. Needs its own session.

## Symptom

`supabase db reset` from any worktree fails partway through replay:

```
Applying migration 2026021601_events_consent.sql...
Applying migration 2026021602_external_mappings.sql...
Applying migration 2026021603_lead_contact_refinements.sql...
Applying migration 2026021604_integration_views.sql...
ERROR: relation "lead" does not exist (SQLSTATE 42P01)
```

## Root cause

`supabase/migrations/2026021604_integration_views.sql` creates `v_lead_with_external_ids` referencing `public.lead`, but **no migration in `supabase/migrations/` creates `public.lead`** at all (verified via `grep -lE "CREATE TABLE\s+(IF NOT EXISTS\s+)?(public\.)?lead\s*\("` — zero matches in 140 migration files plus `seed.sql`).

`public.lead` (and presumably the rest of the foundational table set) is created from the DBML-generated schema, which lands in the local DB through a path that isn't `supabase db reset`. The CLI's reset only replays files under `supabase/migrations/`, so it operates on the assumption that base tables are already present — that assumption fails on a clean stack.

## Implication

- `supabase db reset` is not a viable bootstrap path on this repo right now.
- Local dev relies on the DBML-generated schema being applied first, then migrations on top.
- For PRs that need to exercise migration triggers locally on a fresh stack, you need either:
  - a working `seed.sql` / generated schema applied before reset, or
  - a "bootstrap then replay" script that does both, or
  - applying just the relevant migration(s) on top of an already-populated local DB via `psql -f`.

## What this blocked

Trigger half of the PR #40 smoke test. The four `lead.*` denormalized fields, `sync.refresh_lead_primary_applicant`, the two triggers on `contact` / `lead_contact`, and `sync.check_lead_denormalize_drift` — none could be exercised locally. Workaround for #40: trigger logic gets exercised on prod immediately after merge (prod has the base tables; PR migrations apply via MCP).

## Suggested next steps (own session)

1. Decide canonical local bootstrap: regenerate `supabase/seed.sql` from the DBML so `supabase db reset` works end-to-end, OR document the manual two-step (DBML → migrations) and stop pretending `db reset` is the entry point.
2. If keeping the two-step: add a guard at the top of `2026021604_integration_views.sql` (e.g. `DO $$ BEGIN IF to_regclass('public.lead') IS NULL THEN RAISE EXCEPTION 'Apply DBML-generated schema before this migration'; END IF; END $$;`) so the failure mode is explicit instead of "relation lead does not exist".
3. Audit which other view-creation migrations have the same assumption — `grep -l "CREATE\s\+\(OR REPLACE\s\+\)\?VIEW" supabase/migrations/*.sql` — they all need the same precondition.
