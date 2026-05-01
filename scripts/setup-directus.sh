#!/usr/bin/env bash
# ============================================================================
# setup-directus.sh — local-dev bootstrap for the apps-directus stack
# ============================================================================
#
# Bootstraps the Directus stack on top of a running local Supabase. This
# script is intended for M2-local development; sentinel staging does NOT use
# this script — see ../README.md "Sentinel deployment".
#
# Prerequisites:
#   - Supabase running locally (`supabase start` from the parent db-schema
#     repo) on port 54322
#   - Docker + Docker Compose v2 available
#   - .env.local in the submodule root (copy .env.example) populated with
#     KEY, SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
#
# What it does:
#   1. Verify Docker and the local Supabase database are reachable.
#   2. Create the `directus` Postgres schema if missing (idempotent).
#   3. Generate KEY/SECRET in .env.local if still default placeholders.
#   4. Start the Directus container via docker compose.
#   5. Wait for /server/health to return ok.
#
# What it intentionally does NOT do:
#   - Auto-seed directus_users beyond the admin account. Phase 1 of the
#     directus_users migration spec (in the parent db-schema repo) requires
#     directus_users to stay empty until activation.
#   - Create any non-`directus` Postgres schema.
# ============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error()   { echo -e "${RED}\xE2\x9D\x8C $1${NC}" >&2; }
print_success() { echo -e "${GREEN}\xE2\x9C\x85 $1${NC}"; }
print_warning() { echo -e "${YELLOW}\xE2\x9A\xA0\xEF\xB8\x8F  $1${NC}"; }
print_info()    { echo -e "\xE2\x84\xB9\xEF\xB8\x8F  $1"; }

ENV_FILE=".env.local"
COMPOSE_BASE="docker-compose.yml"
COMPOSE_OVERLAY="${COMPOSE_OVERLAY:-docker-compose.m2.yml}"

# ---------------------------------------------------------------------------
# Step 1: Prerequisites
# ---------------------------------------------------------------------------
echo "Step 1: Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { print_error "Docker not installed."; exit 1; }
print_success "Docker installed"

if ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose v2 not available. Install Docker Desktop or 'docker compose' plugin."
    exit 1
fi
print_success "Docker Compose v2 available"

if [ ! -f "$COMPOSE_OVERLAY" ]; then
    print_warning "$COMPOSE_OVERLAY not found. The M2-local overlay is a follow-up task."
    print_info  "Set COMPOSE_OVERLAY to a different overlay file, or create it before re-running."
    exit 1
fi

# ---------------------------------------------------------------------------
# Step 2: Verify Supabase database is reachable
# ---------------------------------------------------------------------------
echo ""
echo "Step 2: Verifying Supabase database..."

DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
if ! psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    print_error "Cannot connect to Supabase at localhost:54322."
    print_info  "Run: supabase start  (from the db-schema repo)"
    exit 1
fi
print_success "Connected to Supabase"

# ---------------------------------------------------------------------------
# Step 3: Create directus schema (idempotent)
# ---------------------------------------------------------------------------
echo ""
echo "Step 3: Ensuring 'directus' schema exists..."

psql "$DB_URL" <<'SQL' >/dev/null
CREATE SCHEMA IF NOT EXISTS directus;
GRANT ALL ON SCHEMA directus TO postgres;
SQL
print_success "directus schema present"

# ---------------------------------------------------------------------------
# Step 4: Verify and patch .env.local
# ---------------------------------------------------------------------------
echo ""
echo "Step 4: Checking $ENV_FILE..."

if [ ! -f "$ENV_FILE" ]; then
    print_error "$ENV_FILE not found in $(pwd). Copy .env.example and fill in values."
    exit 1
fi

if grep -q "replace-with-unique-key" "$ENV_FILE"; then
    print_warning "KEY/SECRET still default. Generating secure values..."
    KEY=$(openssl rand -base64 32)
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|KEY=replace-with-unique-key.*|KEY=$KEY|" "$ENV_FILE"
        sed -i '' "s|SECRET=replace-with-unique-secret.*|SECRET=$SECRET|" "$ENV_FILE"
    else
        sed -i "s|KEY=replace-with-unique-key.*|KEY=$KEY|" "$ENV_FILE"
        sed -i "s|SECRET=replace-with-unique-secret.*|SECRET=$SECRET|" "$ENV_FILE"
    fi
    print_success "KEY and SECRET generated"
fi

# ---------------------------------------------------------------------------
# Step 5: Start Directus
# ---------------------------------------------------------------------------
echo ""
echo "Step 5: Starting Directus..."
docker compose -f "$COMPOSE_BASE" -f "$COMPOSE_OVERLAY" up -d
print_success "Containers started"

# ---------------------------------------------------------------------------
# Step 6: Wait for /server/health
# ---------------------------------------------------------------------------
echo ""
echo "Step 6: Waiting for Directus to be ready..."

for i in $(seq 1 30); do
    if curl -fsS http://localhost:8055/server/health 2>/dev/null | grep -q '"status":"ok"'; then
        print_success "Directus is ready"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

if ! curl -fsS http://localhost:8055/server/health 2>/dev/null | grep -q '"status":"ok"'; then
    print_error "Directus did not become healthy within 60s."
    print_info  "Logs: docker compose -f $COMPOSE_BASE -f $COMPOSE_OVERLAY logs directus"
    exit 1
fi

# ---------------------------------------------------------------------------
# Step 7: Summary
# ---------------------------------------------------------------------------
cat <<EOF

=========================================
Directus is up.
=========================================

  Directus Admin:  http://localhost:8055
  Supabase Studio: http://localhost:54323
  Supabase API:    http://localhost:54321

Next steps:
  1. Sign in with ADMIN_EMAIL/ADMIN_PASSWORD from $ENV_FILE.
  2. Apply manifests from the parent db-schema repo:
       npx @directus/content-mcp apply <db-schema>/config/directus/events-collections.json
       npx @directus/content-mcp apply <db-schema>/config/directus/public-core.json
  3. Round-trip check:
       npx @directus/content-mcp export > /tmp/exported.json
       diff <db-schema>/config/directus/public-core.json /tmp/exported.json
     Expected output: empty.
  4. Phase 1 of directus_users (see parent db-schema's
     docs/specs/directus-users-migration.md) keeps directus_users empty
     beyond admin until explicit activation.

Logs: docker compose -f $COMPOSE_BASE -f $COMPOSE_OVERLAY logs -f directus
Stop: docker compose -f $COMPOSE_BASE -f $COMPOSE_OVERLAY down
EOF
