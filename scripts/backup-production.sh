#!/usr/bin/env bash
# DB와 작가 자산을 같은 정지 시점에 백업합니다. 실행 중 서비스는 완료/실패 시 복구합니다.
set -euo pipefail
umask 077
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
destination=${1:-/var/backups/mystery-mango}
install -d -m 0700 "$destination"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup="$destination/mystery-mango-$stamp"
temporary=$(mktemp -d "$destination/.mystery-mango.XXXXXXXX")
was_running=$(bash "$root/scripts/compose-production.sh" ps --status running -q backend)
restart=false
cleanup() {
    local result=$?
    trap - EXIT
    if [ "$restart" = true ]; then
        if ! bash "$root/scripts/compose-production.sh" start backend >/dev/null; then
            echo '백업 후 백엔드 재시작에 실패했습니다. 운영 상태를 확인하세요.' >&2
            result=1
        fi
    fi
    rm -rf -- "$temporary"
    exit "$result"
}
trap cleanup EXIT
if [ -n "$was_running" ]; then
    restart=true
    bash "$root/scripts/compose-production.sh" stop backend >/dev/null
fi
bash "$root/scripts/compose-production.sh" exec -T db \
    sh -c 'pg_dump -U "$POSTGRES_USER" -d mystery_mango -Fc' > "$temporary/database.dump"
bash "$root/scripts/compose-production.sh" exec -T db pg_restore --list < "$temporary/database.dump" >/dev/null
# 첫 도입 시 기존 앱 이미지로 빈 자산 볼륨을 생성하면 root 소유가 될 수 있다.
# 존재하는 볼륨만 읽기 전용으로 백업하고 새 볼륨 생성은 새 앱 이미지에 맡긴다.
db_container=$(bash "$root/scripts/compose-production.sh" ps -q db)
if [ -z "$db_container" ]; then echo '운영 DB 컨테이너를 확인할 수 없습니다.' >&2; exit 1; fi
project=$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$db_container")
if [ -z "$project" ]; then echo '운영 프로젝트를 확인할 수 없습니다.' >&2; exit 1; fi
asset_volume="${project}_author-assets"
volumes=$(docker volume ls --format '{{.Name}}')
if grep -Fxq -- "$asset_volume" <<< "$volumes"; then
    db_image=$(docker inspect --format '{{.Image}}' "$db_container")
    docker run --rm --network none --read-only \
        --mount "type=volume,src=$asset_volume,dst=/backup,readonly" \
        --entrypoint tar "$db_image" -C /backup -czf - . > "$temporary/assets.tar.gz"
    echo '기존 작가 파일 볼륨 포함' > "$temporary/asset-volume-status.txt"
else
    mkdir "$temporary/empty-assets"
    tar -C "$temporary/empty-assets" -czf "$temporary/assets.tar.gz" .
    rmdir "$temporary/empty-assets"
    echo '작가 파일 기능 첫 도입: 기존 자산 볼륨 없음' > "$temporary/asset-volume-status.txt"
fi
tar -tzf "$temporary/assets.tar.gz" >/dev/null
(cd "$temporary" && sha256sum database.dump assets.tar.gz > SHA256SUMS)
mv -- "$temporary" "$backup"
echo "DB·자산 백업 생성 완료: $backup"
