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
  eval "$(op signin)" || { echo "❌ 1Password sign-in failed"; exit 1; }
fi

if ! curl -sf -o /dev/null "http://localhost:8055/server/ping"; then
  echo "⚠️  Directus not reachable at http://localhost:8055."
  echo "   Start it first: docker compose -f docker-compose.yml -f docker-compose.mbp.yml up -d"
  echo "   Continuing — MCP calls will fail until it's up."
fi

cd "$SCRIPT_DIR"
exec op run --env-file="$ENV_FILE" --no-masking -- claude "$@"
