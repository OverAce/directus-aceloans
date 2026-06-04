#!/usr/bin/env bash
# Launch Claude Code in the directus submodule with Directus MCP wired up.
#
# Resolves DIRECTUS_URL / DIRECTUS_TOKEN (and every other parent-repo MCP
# secret) from 1Password at child-process spawn time via `op run`. Keeps
# nothing in this shell or on disk.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../agents/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ env template not found at $ENV_FILE"
  echo "   Copy ../agents/.env.example → ../agents/.env in the parent repo."
  exit 1
fi

if ! command -v op >/dev/null 2>&1; then
  echo "❌ 1Password CLI 'op' not found in PATH"
  exit 1
fi

if ! op whoami >/dev/null 2>&1; then
  echo "🔐 1Password not signed in — prompting…"
  OP_SIGNIN_CMD="$(op signin)" || { echo "❌ 1Password sign-in failed"; exit 1; }
  eval "$OP_SIGNIN_CMD"
fi

# Local Supabase Postgres underpins Directus in MBP-local dev (the container
# connects to host.docker.internal:54322). Check it before Directus, since
# Directus can't serve its MCP without a reachable database. pg_isready when
# present (confirms Postgres is accepting connections), nc port probe
# otherwise. If neither is installed, skip the check rather than false-alarm.
DB_PORT=54322
if command -v pg_isready >/dev/null 2>&1; then
  db_reachable() { pg_isready -h localhost -p "$DB_PORT" -q; }
elif command -v nc >/dev/null 2>&1; then
  db_reachable() { nc -z -w2 localhost "$DB_PORT" >/dev/null 2>&1; }
else
  db_reachable() { return 0; }
fi
if ! db_reachable; then
  echo "⚠️  Local Supabase DB not reachable at localhost:$DB_PORT."
  # Tell "stack not started" apart from "started but DB crash-looping"
  # (e.g. Postgres can't write postmaster.pid on a full Docker disk) so the
  # remedy below is the right one. Empty status = no container / no docker.
  db_status=""
  if command -v docker >/dev/null 2>&1; then
    db_status="$(docker ps -a --filter 'name=supabase_db_' --format '{{.Status}}' 2>/dev/null | head -1)"
  fi
  case "$db_status" in
    Restarting*|*unhealthy*)
      echo "   The DB container is up but unhealthy ($db_status) — likely crash-looping."
      echo "   See why:  docker logs --tail 50 \$(docker ps -aqf name=supabase_db_)"
      echo "   Common cause is a full Docker disk; reclaim space, then:"
      echo "             docker restart \$(docker ps -aqf name=supabase_db_)"
      ;;
    *)
      echo "   Start it first (from the parent repo): supabase start"
      ;;
  esac
  echo "   Continuing — Directus can't connect to its database until it's up."
fi

if ! curl -sf -o /dev/null "http://localhost:8055/server/ping"; then
  echo "⚠️  Directus not reachable at http://localhost:8055."
  echo "   Start it first: docker compose -f docker-compose.yml -f docker-compose.mbp.yml up -d"
  echo "   Continuing — MCP calls will fail until it's up."
fi

cd "$SCRIPT_DIR"
exec op run --env-file="$ENV_FILE" --no-masking -- claude "$@"
