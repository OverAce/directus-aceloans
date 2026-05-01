# Directus Configuration for Kiron Data Applications

This repository contains the Directus configuration and setup for the Kiron data applications.

## Overview

Directus is used as a headless CMS and API platform for managing data in the Kiron ecosystem.

## Quick Start

1. Copy `.env.example` to `.env.staging` and fill in real values.
2. Create (or switch to) a Docker context pointing at sentinel — see [Sentinel deployment](#sentinel-deployment) below.
3. Run the sentinel compose command from your MBP using that context.
4. Access Directus over LAN at `http://sentinel.local:8055` (adjust hostname if different).

M2-local development is not documented yet; that workflow depends on the follow-up `docker-compose.m2.yml` overlay.

## Structure

- `docker-compose.yml` — portable base (no host port bindings, no host-specific mounts)
- `docker-compose.sentinel.yml` — staging overlay for the sentinel host
- `extensions/` — custom Directus extensions
- `uploads/` — file uploads storage

## Compose layout

This repo follows a Kestra-style two-file compose layout (see `kestra-kiron`):
the base `docker-compose.yml` is portable and gets composed with a per-target
overlay at deploy time. The previous `--profile local/staging` layout has been
removed; an M2-local dev overlay (`docker-compose.m2.yml`) is a follow-up task.

## Sentinel deployment

Sentinel is the staging host. Deployment is driven **from your MBP** via a
Docker context — you do not need to SSH into sentinel and run commands there.

### One-time context setup (MBP)

```bash
# Create a Docker context that targets sentinel over SSH
docker context create sentinel --docker "host=ssh://sentinel.local"
```

Adjust the host if your sentinel's hostname or IP differs.

### Bring-up (MBP)

```bash
git pull
cp .env.example .env.staging   # first time only; fill in real values
docker --context sentinel compose -f docker-compose.yml -f docker-compose.sentinel.yml up -d
```

Or set the context as active for the session:

```bash
docker context use sentinel
docker compose -f docker-compose.yml -f docker-compose.sentinel.yml up -d
```

LAN access from MBP: `http://sentinel.local:8055` (adjust hostname if different).

### Database target

Sentinel connects to the cloud Supabase prod project
`toyorzhdbqthqcnsdjgx`. Do **not** run a local Supabase docker on sentinel.

Before first bring-up, provision a dedicated DB user with access to the
`directus` schema (separate Supabase MCP task — not part of this compose
refactor). The sentinel's `.env.staging` should reference that user, not the
shared `postgres` superuser.

### Secrets

Secrets live in `.env.staging` only. 1Password / `op run` integration is out
of scope for this layout; treat `.env.staging` as the source of truth on your
MBP (gitignored).

## Configuration

The main configuration is handled through environment variables. See
`.env.example` for the full required and optional set.

## Development

This repository is a submodule of the main [db-schema](https://github.com/KironPartner/db-schema) project.
