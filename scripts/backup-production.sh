#!/usr/bin/env bash
# 운영 DB를 삭제하지 않는 수동 백업. 복구 절차는 docs/deployment.md 참고.
set -euo pipefail
umask 077
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
destination=${1:-/var/backups/mystery-mango}
install -d -m 0700 "$destination"
backup="$destination/mystery-mango-$(date -u +%Y%m%dT%H%M%SZ).dump"
temporary=$(mktemp "$destination/.mystery-mango.XXXXXXXX")
trap 'rm -f -- "$temporary"' EXIT
bash "$root/scripts/compose-production.sh" exec -T db \
    sh -c 'pg_dump -U "$POSTGRES_USER" -d mystery_mango -Fc' > "$temporary"
bash "$root/scripts/compose-production.sh" exec -T db pg_restore --list < "$temporary" >/dev/null
mv -- "$temporary" "$backup"
echo "백업 생성 완료: $backup"
