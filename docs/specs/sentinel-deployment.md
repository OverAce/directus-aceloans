# Directus Multi-Region Deployment (Vulcan + Sentinel)

**Status:** Compose refactor shipped (PR #4, 2026-04-30 → 2026-05-01). Sentinel bring-up + vulcan deployment pending.
**Last verified:** 2026-05-02

## Topology (current decision, 2026-05-02)

Two prod Directus instances against a single Supabase DB:

| Instance | Host | Deploy shape | Public URL | Role |
|---|---|---|---|---|
| **vulcan** | EU VPS | easypanel / Docker swarm | `https://data.kironhitel.hu` (Cloudflared tunnel) | EU primary, runs all Flows |
| **sentinel** | Mac mini | Docker Compose (this repo's pattern) | Tailscale FQDN (admin/ops only) | US mirror, Flows disabled |

**This was inverted from the 2026-05-01 decision.** Earlier drafts of this spec named sentinel as "the EU production Directus instance"; that's no longer correct. Vulcan is the EU-resident, public-facing instance; sentinel is a US-side mirror used for admin/ops with Tailscale-only access.

## Goal

Stand up both prod Directus instances against the shared Supabase prod project (`toyorzhdbqthqcnsdjgx`, `eu-central-1`). The compose layout for sentinel mirrors `kestra-kiron`'s base + overlay split (already shipped in PR #4). Vulcan's deployment is shaped by easypanel/swarm and lives outside the `apps-directus` compose tree — that compose file is owned by the easypanel project, not this repo.

MBP-local dev runs against local Supabase via the `docker-compose.mbp.yml` overlay.

Kestra and Directus stay separate stacks. Kestra is the **template** for the file split, not a dependency.

## Why

Today both `directus-local` and `directus-staging` services in `apps-directus/docker-compose.yml` unconditionally bind `8055:8055` and embed host-specific concerns (`host.docker.internal:host-gateway`, env_file paths). This makes the compose file non-portable and couples sentinel deployment to local-dev knobs. The Kestra repo (`~/Projects/Kiron/kestra-kiron/`) already proves the cleaner pattern: base file is portable; overlay file owns sentinel-specific port bindings, mounts, and pull policies.

## Pattern reference (Kestra, do not modify)

- `kestra-kiron/docker-compose.yml` — base, no host port bindings, `restart: unless-stopped`.
- `kestra-kiron/docker-compose.sentinel.yml` — overlay: `8080:8080`, `pull_policy: if_not_present`, `./flows` mount.
- Bring-up on sentinel: `docker compose -f docker-compose.yml -f docker-compose.sentinel.yml up -d`.

## Current state of apps-directus (verified 2026-04-30)

Repo lives as a git submodule at `db-kiron/directus/`. Remote: `OverAce/apps-directus`. Latest commit: `d67580c feat: refactor gravity forms operation and test setup`.

**Existing layout (`directus/docker-compose.yml`):**
- Single file, two services with `profiles: [local]` and `profiles: [staging]`.
- Image pinned to `directus/directus:11.15.1`. Redis cache: `redis:7-alpine` (service `directus-cache`).
- Both `directus-*` services bind `8055:8055`, mount `./uploads` and `./extensions:ro`, depend on `directus-cache`.
- `directus-local` adds `extra_hosts: - "host.docker.internal:host-gateway"` and `env_file: .env.local`.
- `directus-staging` uses `env_file: .env.staging`.
- Healthcheck: `wget -qO- http://localhost:8055/server/health`.
- Network: `aceloans-directus`.

**Already in place — leave alone:**
- `extensions/operations/gravity-forms-operation/` — built, tested, **do not touch**.
- `.env.example` (gitignored real `.env*`), `uploads/`, `extensions/`, `README.md`, `CLAUDE.md`.

**Stale claims to ignore from any older docs:**
- "apps-directus is sparse" — false.
- Image `11.12.0` — wrong, current is `11.15.1`. Do not downgrade.
- WIP path `db-kiron/.claude/worktrees/directus-etl-integration/...` — does not exist.
- Branch `claude/directus-etl-integration-ToLty` — does not exist locally. Closest branches: `directus-integration`, `archive/claude-directus-supabase-integration`.

## Phase 1 — compose refactor (shipped in PR #4)

> Historical: this is the deliverable for PR #4 (2026-04-30 → 2026-05-01),
> which split the apps-directus compose into base + sentinel + MBP overlays
> and renamed `.env.staging` → `.env.sentinel` in subsequent prep work.
> Naming below reflects the current `.env.sentinel` convention, not the
> original wording.

All work happened inside the `apps-directus` submodule (`db-kiron/directus/`).

### 1. `docker-compose.yml` (base, portable)
- One `directus` service (image `directus/directus:${DIRECTUS_VERSION:-11.15.1}`) replacing the old `directus-local` + `directus-staging` split.
- One `directus-cache` service (`redis:${REDIS_VERSION:-7-alpine}`) preserved as-is.
- **No host port mappings.** No `extra_hosts`. No host-specific volumes.
- Image versions interpolated via `${VAR}`; the base file does not hard-code an env file path. Overlays set `env_file`.
- Preserve Directus healthcheck and `restart: unless-stopped`.
- Preserve named network `aceloans-directus`.
- Drop all `profiles:` keys.

### 2. `docker-compose.sentinel.yml` (overlay)
- Adds `ports: - "8055:8055"` for Tailscale access from MBP.
- `pull_policy: if_not_present`.
- Mounts `./uploads:/directus/uploads` and `./extensions:/directus/extensions:ro`.
- `env_file: .env.sentinel`.

### 3. `.env.sentinel.example` (was `.env.example`)
- Required coverage: `DIRECTUS_VERSION`, `REDIS_VERSION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_SCHEMA`, `DB_SEARCH_PATH`, `DB_SSL__REJECT_UNAUTHORIZED`, `KEY`, `SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PUBLIC_URL`, redis vars, Supabase keys, optional Cloudinary + SES vars.

### 4. `.gitignore`
- Coverage of `.env`, `.env.*` (except `!.env.sentinel.example`), `uploads/*` (except `.gitkeep`), `extensions/*` (except gravity-forms-operation source), `.DS_Store`.

### 5. `README.md` — kestra-style rewrite
- Topology table (vulcan EU primary / sentinel US mirror).
- Quick Start with `docker --context sentinel compose ... --env-file .env.sentinel up -d`.
- Both work modes documented: remote-control from MBP and direct-on-host on sentinel.
- SSH preflight: `ssh sentinel 'which docker && docker version'`.
- Sentinel checkout path on the host: `/Volumes/Work/marcel/Projects/Kiron/apps-directus`.
- 1Password / `op run` out of scope; secrets via `.env.sentinel`.

### 6. `CLAUDE.md` — update
- "Development Commands" and "Docker Stack" sections reflect overlay model, not profiles.
- Topology callout (vulcan EU primary, sentinel US mirror, MBP-local dev).

### 7. `uploads/.gitkeep`, `extensions/.gitkeep`
- Both present.

## Decisions baked in

- **DB target = cloud Supabase prod project `toyorzhdbqthqcnsdjgx`** for both vulcan and sentinel. Don't run a local Supabase docker on either. Use the project's direct connection hostname/port + a dedicated `directus_app` DB user with access to the `directus` schema. (User creation is a separate Supabase MCP task.)
- **Schema isolation:** `DB_SCHEMA=directus`, `DB_SEARCH_PATH=directus,public,extensions,events` — directus first so its system tables resolve at startup.
- Image stays at `directus/directus:11.15.1`. **Do not downgrade.**
- No 1Password injection. `.env.sentinel` (sentinel) / easypanel env config (vulcan) only.
- No GitHub Actions / CI in apps-directus for the compose refactor (`apply-on-deploy.yml` was added later as a separate concern — see `apps-directus/.github/workflows/`).
- No `docker-compose.m2.yml` (renamed to `docker-compose.mbp.yml`).

## Multi-instance topology (vulcan EU primary + sentinel US mirror)

**Decision (2026-05-02, supersedes 2026-05-01):** vulcan is the **EU primary Directus instance** (easypanel/swarm on a VPS, Cloudflared tunnel at `https://data.kironhitel.hu`); sentinel is the **US mirror** (Mac mini, Docker Compose, Tailscale-only access for admin/ops). Both point at the same prod Supabase (`toyorzhdbqthqcnsdjgx`, `eu-central-1`). This is a standard Directus horizontal-scale pattern; Directus stores its own state in the DB so collections/branding/roles/permissions/users/flows are automatically shared.

### Required invariants for both instances

- **Shared `KEY` and `SECRET` env vars.** These sign session tokens and password-reset links. Different values across instances = sessions and reset flows break across hosts. Generate once, store in 1Password, copy to both env files (vulcan's easypanel env config + sentinel's `.env.sentinel`).
- **Same DB target.** Both instances use the `directus_app` scoped DB user against `db.toyorzhdbqthqcnsdjgx.supabase.co`. Schema state is shared by definition — Directus reads `directus_collections`, `directus_fields`, `directus_settings`, `directus_users`, `directus_permissions`, `directus_flows` from the DB on every request.
- **Same Cloudinary storage** — already configured in the legacy Proxmox env. Both instances read/write the same bucket so file uploads are coherent.
- **Per-instance `PUBLIC_URL`.**
  - vulcan: `https://data.kironhitel.hu` (Cloudflared tunnel, public-facing).
  - sentinel: a Tailscale FQDN under `*.robin-prometheus.ts.net` (admin/ops only, not public). Final hostname TBD.
  Email links and OAuth callbacks resolve to whichever instance generated them — so a password-reset email sent from sentinel will deep-link to sentinel's Tailscale URL, which is correct only if the recipient is on the tailnet. For end-user-facing email flows, route through vulcan.
- **Per-instance Redis.** Each instance runs its own `aceloans-directus-cache`. Cache divergence after writes (a few seconds) is acceptable.

### Flow ownership: vulcan (EU) only

**Vulcan runs all Directus Flows. Sentinel has Flows disabled.**

Why: Directus has no built-in leader election, so if both instances trigger the same `event` or `schedule` Flow, it fires twice. Disabling on one side is the simplest correct behavior. Vulcan owns Flows because it has the better DB latency (~5ms to `eu-central-1` vs sentinel's ~80–100ms cross-Atlantic) and is the public-facing instance for the events that drive most flows.

How to enforce on sentinel: TBD per Directus 11.15.1. Candidates:
- A hook extension on sentinel that no-ops the `flows.run` handler. Most explicit, fully under our control.
- A feature-flag env var like `FLOWS_EXEC_ALLOW_LIST=` (empty) — verify whether 11.15.1 honors this; some versions only gate which env vars Flows can read, not whether Flows execute at all.
- `DISABLE_FLOWS=true` — *not* a documented built-in. Treat as placeholder until verified.

Do **not** set `directus_flows.status='inactive'` on a per-instance basis — `directus_flows` is shared via the DB, so that would disable Flows globally including on vulcan.

Verification path: stand up sentinel with Flows disabled by whichever mechanism, trigger a known-Flow event (e.g. an item create), and confirm the Flow ran exactly once on vulcan.

### Latency budget

- Prod Supabase is in `eu-central-1`. **Vulcan** sees ~5ms DB RTT (in-region).
- **Sentinel** sees ~80–100ms DB RTT cross-Atlantic. Acceptable for admin UI use; not for high-throughput app traffic. If sentinel ends up serving more than admin/ops, evaluate a read replica or a regional Directus + cache strategy.

### Email transport

Email is sent by whichever instance handles the user request that triggers it (password reset, OAuth invite, etc.). Both instances must be able to reach AWS SES `eu-central-1`. Since the SES endpoint is internet-reachable, no extra wiring needed beyond the rotated SES credentials in each instance's env file. End-user-facing email flows should originate from vulcan (so the `From`/return path and any deep links resolve to the public URL).

## Out of scope / things NOT to do

- Do NOT run `docker compose up`. Structural/file-prep task only.
- Do NOT modify `db-kiron` outside the `directus/` submodule.
- Do NOT touch `extensions/operations/gravity-forms-operation/` or any other extension code.
- Do NOT delete existing services, env vars, healthchecks, or the named network without porting them.
- Do NOT commit `.env`, `.env.local`, or `.env.sentinel` with real secrets.
- Do NOT add Traefik, Caddy, monitoring, or other unrelated tooling for the compose refactor (apply-on-deploy CI is a separate, already-shipped concern).

## Phase 1 process (historical, completed)

PR #4 followed this sequence:

1. In the submodule: `cd db-kiron/directus`, confirm clean working tree, fetch latest, branch off `main`.
2. Read `kestra-kiron/docker-compose.yml` and `kestra-kiron/docker-compose.sentinel.yml` for pattern reference.
3. Read current `directus/docker-compose.yml` and `directus/CLAUDE.md`.
4. Create branch `feat/sentinel-staging-deployment` (kept its original name even after the topology flip).
5. Refactor compose into base + sentinel + MBP overlays; drop `profiles:` keys; consolidate `directus-local` + `directus-staging` into one base `directus` service.
6. Update `README.md` and `CLAUDE.md`.
7. Commit in focused chunks.
8. Open PR against `OverAce/apps-directus` `main`, merge fast-forward.
9. Bump parent submodule pointer in `db-kiron`.

## Phase 1 verification (passed, no container runs)

- `docker compose -f docker-compose.yml -f docker-compose.sentinel.yml --env-file .env.sentinel config` merges cleanly and shows `8055:8055` under `directus`.
- `docker compose -f docker-compose.yml config` (base only) merges cleanly with **no** host port bindings.
- `docker compose -f docker-compose.yml -f docker-compose.mbp.yml --env-file .env.local config` merges cleanly with `host.docker.internal:host-gateway`.
- Redis service still in merged config; `directus.depends_on` still references it.

## Phase 2 — sentinel bring-up (pending)

What's left before sentinel can come up:

1. **Provision `directus_app` DB user** on Supabase prod via MCP, granted access to the `directus` schema (and `usage` on supporting schemas in `DB_SEARCH_PATH`). Do not reuse the `postgres` superuser.
2. **Generate KEY/SECRET pair** to be shared with vulcan; store in 1Password.
3. **Decide sentinel's Tailscale FQDN** (`*.robin-prometheus.ts.net`); fill in `PUBLIC_URL` in `.env.sentinel`.
4. **Determine the Flow-disable mechanism** for Directus 11.15.1 (verify `FLOWS_EXEC_ALLOW_LIST` semantics, or write a hook extension that no-ops `flows.run` on sentinel only).
5. **Decide Cloudinary + SES credential rotation** scope: same legacy Proxmox credentials reused, or new ones provisioned for the new instances?
6. **Bring up sentinel** via `docker --context sentinel compose ... up -d` from MBP, verify `/server/health`, log in, confirm Flows are not firing on sentinel by triggering a known-Flow event and observing it run only on vulcan.

## Phase 3 — vulcan deployment (separate workstream)

Vulcan is deployed via easypanel/Docker swarm on a EU VPS, served via a Cloudflared tunnel at `https://data.kironhitel.hu`. The compose layout is owned by the easypanel project, not by this repo. The same Phase 2 prerequisites apply (DB user, KEY/SECRET, Cloudinary, SES) — vulcan's env config in easypanel must match sentinel's `.env.sentinel` for the shared invariants. Document vulcan's deployment in a separate spec when it lands.

## Follow-ups not yet scheduled

- 1Password / `op run` integration for secret injection into both instances.
- Read replica or regional Directus + cache strategy if sentinel ends up serving more than admin/ops.
