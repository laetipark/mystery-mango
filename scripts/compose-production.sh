#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
if [[ ! -f "$root/.env.production.local" ]]; then
    echo '먼저 python3 scripts/prepare-production-env.py를 실행하세요.' >&2
    exit 1
fi
exec docker compose --project-directory "$root" \
    --env-file "$root/.env.production.local" \
    -f "$root/compose.yml" -f "$root/compose.production.yml" "$@"
