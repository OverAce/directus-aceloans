# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Directus CMS configuration and custom extensions for the Kiron data warehouse. This is a **git submodule** of the parent [db-schema](https://github.com/KironPartner/db-schema) repo (origin: `OverAce/directus-aceloans`).

Directus connects to the Supabase PostgreSQL database as its data interface, running in Docker alongside a Redis cache.

## Launching Claude Code in this submodule

`.mcp.json` wires the Directus MCP server (HTTP transport against `http://localhost:8055/mcp`) and reads `DIRECTUS_TOKEN` from the env.

```bash
./launch.sh
```

`launch.sh` wraps `claude` with `op run --env-file=../agents/.env`, so 1Password resolves `DIRECTUS_URL` / `DIRECTUS_TOKEN` (canonical ref: `op://AI/Directus - AceLoans - API MCP/api key`) at child-process spawn time — nothing is cached on disk. Start Directus first (`docker compose -f docker-compose.yml -f docker-compose.mbp.yml up -d`) so `:8055/mcp` is reachable; the launcher warns if it isn't.

## Development Commands

```bash
# Build the Gravity Forms extension (run on host, not in Docker).
# Extension source lives on the gravity-forms-extension branch and is
# rebased onto main on merge — these commands assume that code is present.
cd extensions/operations/gravity-forms-operation
npm install
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Start Directus — sentinel staging (run from MBP via Docker context)
docker context use sentinel   # one-time; creates/selects the sentinel context
docker compose -f docker-compose.yml -f docker-compose.sentinel.yml up -d

# Stop
docker compose -f docker-compose.yml -f docker-compose.sentinel.yml down

# Start Directus — MBP-local dev (overlay TBD; see README "Compose layout").
# Until the overlay lands, run with the sentinel overlay against a local
# .env.staging copy, or compose ad-hoc with `--env-file`.
```

Directus runs on sentinel, accessible from MBP at `http://sentinel.local:8055` over LAN. Health check: `/server/health`.

## Architecture

### Docker Stack
- **Directus** v11.15.1 (port 8055) — headless CMS
- **Redis** 7-alpine — caching layer

Two-file Kestra-style compose layout:
- `docker-compose.yml` — portable base. No host port bindings, no host-specific volumes, no `host.docker.internal`. Just the `directus` and `directus-cache` services on the named `aceloans-directus` network with healthchecks and `restart: unless-stopped`.
- `docker-compose.sentinel.yml` — staging overlay. Adds `8055:8055`, `pull_policy: if_not_present`, the `uploads`/`extensions` bind mounts, and `env_file: .env.staging`.
- `docker-compose.mbp.yml` — MBP-local dev overlay (follow-up). Will restore `host.docker.internal:host-gateway` and `env_file: .env.local`.

Bring-up = `docker compose -f docker-compose.yml -f docker-compose.<target>.yml up -d`. Each environment owns its own `.env.<target>` file (gitignored; copy `.env.example`).

### Database Connection
**Sentinel staging:** cloud Supabase project `toyorzhdbqthqcnsdjgx`. Use a dedicated DB user with access to the `directus` schema (provisioning is a separate Supabase MCP task — do not reuse the `postgres` superuser).
- Host: `db.<project-ref>.supabase.co`
- Port: `5432` (direct connection, not pooler)
- SSL: `DB_SSL__REJECT_UNAUTHORIZED=false`
- `DB_SCHEMA=directus`, `DB_SEARCH_PATH=directus,public,extensions,events` — directus first so its system tables resolve at startup, then the rest of the exposed schemas.

**MBP-local dev:** PostgreSQL client connecting to the local Supabase instance:
- Host: `host.docker.internal` (Docker → macOS bridge; injected by the MBP overlay)
- Port: `54322` (Supabase local DB)
- Search path: same as staging.

### Extensions Directory Structure
Standard Directus extension layout with folders for each type:
- `extensions/operations/` — Flow operations (the only category with code today)
- `extensions/displays/`, `endpoints/`, `hooks/`, `interfaces/`, `layouts/`, `modules/`, `panels/`, `themes/` — empty scaffolding

### Gravity Forms Operation (`extensions/operations/gravity-forms-operation/`)

The only custom extension. A Directus Flow operation that integrates with WordPress Gravity Forms and GravityFlow REST APIs. (Currently lives on the `feature/gravity-forms-extension` branch; gets rebased onto `main` on merge.)

**Key files:**
- `src/api.ts` — Backend handler, routes to endpoint-specific action handlers
- `src/app.ts` — Frontend registration (id: `gravity-forms-operation`)
- `src/options.vue` — Vue 3 configuration UI with dynamic fields
- `src/gravity-forms.ts` — `GravityForms` client class (REST API via `/wp-json/gf/v2/`)
- `src/gravity-flow.ts` — `GravityFlow` client class (REST API via `/wp-json/gravityflow/v2/`)
- `src/endpoints/` — Action handlers for `forms`, `entries`, `notifications`, `workflows`
- `src/utils/oauth.ts` — OAuth 1.0a HMAC-SHA1 signature generation
- `src/utils/error-handling.ts` — HTTP error parsing
- `src/utils/retry.ts` — Exponential backoff retry logic (3 attempts, 1s/2s/4s)

**Request flow:** `api.ts handler` → picks client (`GravityForms` or `GravityFlow`) → selects endpoint action → calls `client.makeRequest()` with OAuth signing and retry.

**Build tooling:** Directus Extensions SDK (`directus-extension build`), TypeScript (strict mode, ES2019 target), Vue 3 for options UI.

**Code style** (aligned with upstream Directus conventions):
- TypeScript + ES modules (`import`/`export`); prefer `const` over `let`, avoid `var`.
- Test files named `*.test.ts`, placed next to the source file. Use Vitest (`describe`/`test`/`expect`) if/when tests are added.

### MCP Configuration
This submodule context is extension development only. `.mcp.json` declares a single MCP server — `directus` (HTTP transport against `http://localhost:8055/mcp`, `Authorization: Bearer ${DIRECTUS_TOKEN}`). The parent repo's external servers (supabase, gdrive, coda) are not configured here.

`.claude/settings.local.json` (gitignored, per-machine) pre-approves the `directus` server via `enabledMcpjsonServers` so it connects on launch without a trust prompt, and carries a permission allow-list for the Directus MCP tools and common extension-dev commands (read-only git, `npm` builds, `docker compose`, localhost health checks). Approvals are read at startup, so changes to it take effect on the next `./launch.sh`.

## Environment Setup

Copy `.env.example` to `.env.staging` (sentinel) or `.env.local` (MBP-local dev once that overlay lands). Env files use `KEY=value` format (not YAML colons). Key variables:
- `DB_CLIENT=pg`, `DB_HOST`, `DB_PORT`, `DB_SCHEMA`, `DB_SEARCH_PATH` — database connection
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Directus admin credentials
- `KEY` / `SECRET` — required Directus secrets (regenerate per environment)
- `PUBLIC_URL` — externally visible Directus URL (sentinel: `http://sentinel.local:8055`)
- `CACHE_ENABLED=true`, `CACHE_STORE=redis`, `REDIS_HOST=aceloans-directus-cache`
- Staging adds: `DB_SSL__REJECT_UNAUTHORIZED=false`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

1Password / `op run` injection is out of scope here; secrets via `.env.staging` only.

## Relationship to Parent Repo

This submodule lives at `directus/` in the parent db-schema project. The parent manages the database schema and migrations; this repo manages the Directus CMS layer and its extensions. Schema changes happen in the parent repo's `supabase/migrations/`, not here.
