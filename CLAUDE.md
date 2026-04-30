# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Directus CMS configuration and custom extensions for the Kiron data warehouse. This is a **git submodule** of the parent [db-schema](https://github.com/KironPartner/db-schema) repo (origin: `OverAce/apps-directus`).

Directus connects to the Supabase PostgreSQL database as its data interface, running in Docker alongside a Redis cache.

## Development Commands

```bash
# Build the Gravity Forms extension (run on host, not in Docker)
cd extensions/operations/gravity-forms-operation
npm install
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Start Directus — local dev (requires Supabase running: supabase start)
docker compose --profile local up -d

# Start Directus — staging hybrid (remote Supabase DB)
docker compose --profile staging up -d

# Stop
docker compose --profile local down
```

Directus runs at `http://localhost:8055`. Health check: `http://localhost:8055/server/health`.

## Architecture

### Docker Stack
- **Directus** v11.15.1 (port 8055) - headless CMS
- **Redis** 7-alpine - caching layer
- Two profiles via `docker compose --profile <name>`:
  - `local` — connects to local Supabase DB, uses `.env.local`
  - `staging` — connects to remote Supabase DB with SSL, uses `.env.staging`
- Config: `docker-compose.yml` + `.env.local` or `.env.staging` (copy from `.env.example`)

### Database Connection
**Local profile:** PostgreSQL client connecting to the local Supabase instance:
- Host: `host.docker.internal` (Docker → macOS bridge)
- Port: `54322` (Supabase local DB)
- Search path: `directus,public,extensions`

**Staging profile:** Remote Supabase PostgreSQL:
- Host: `db.<project-ref>.supabase.co`
- Port: `5432` (direct connection, not pooler)
- SSL: `DB_SSL__REJECT_UNAUTHORIZED=false`

### Extensions Directory Structure
Standard Directus extension layout with folders for each type:
- `extensions/operations/` - Flow operations (the only one with code)
- `extensions/displays/`, `endpoints/`, `hooks/`, `interfaces/`, `layouts/`, `modules/`, `panels/`, `themes/` - empty scaffolding

### Gravity Forms Operation (`extensions/operations/gravity-forms-operation/`)

The only custom extension. A Directus Flow operation that integrates with WordPress Gravity Forms and GravityFlow REST APIs.

**Key files:**
- `src/api.ts` - Backend handler, routes to endpoint-specific action handlers
- `src/app.ts` - Frontend registration (id: `gravity-forms-operation`)
- `src/options.vue` - Vue 3 configuration UI with dynamic fields
- `src/gravity-forms.ts` - `GravityForms` client class (REST API via `/wp-json/gf/v2/`)
- `src/gravity-flow.ts` - `GravityFlow` client class (REST API via `/wp-json/gravityflow/v2/`)
- `src/endpoints/` - Action handlers for `forms`, `entries`, `notifications`, `workflows`
- `src/utils/oauth.ts` - OAuth 1.0a HMAC-SHA1 signature generation
- `src/utils/error-handling.ts` - HTTP error parsing
- `src/utils/retry.ts` - Exponential backoff retry logic (3 attempts, 1s/2s/4s)

**Request flow:** `api.ts handler` → picks client (`GravityForms` or `GravityFlow`) → selects endpoint action → calls `client.makeRequest()` with OAuth signing and retry.

**Build tooling:** Directus Extensions SDK (`directus-extension build`), TypeScript (strict mode, ES2019 target), Vue 3 for options UI.

### MCP Configuration
All external MCP servers (supabase, gdrive, coda) are disabled in `.claude/settings.local.json`. This submodule context is extension development only.

## Environment Setup

Copy `.env.example` to `.env.local` (local dev) or `.env.staging` (staging hybrid). Env files use `KEY=value` format (not YAML colons). Key variables:
- `DB_CLIENT=pg`, `DB_HOST`, `DB_PORT` - database connection
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - Directus admin credentials
- `CACHE_ENABLED=true`, `CACHE_STORE=redis`, `REDIS_HOST=directus-cache`
- Staging adds: `DB_SSL__REJECT_UNAUTHORIZED=false`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Relationship to Parent Repo

This submodule lives at `directus/` in the parent db-schema project. The parent manages the database schema and migrations; this repo manages the Directus CMS layer and its extensions. Schema changes happen in the parent repo's `supabase/migrations/`, not here.
