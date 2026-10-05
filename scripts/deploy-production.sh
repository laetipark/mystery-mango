#!/usr/bin/env bash
# mystery.laetipark.me 전용. 기존 다른 사이트의 설정은 수정하지 않습니다.
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
stage=${1:-all}
domain=mystery.laetipark.me
site="/etc/nginx/sites-available/$domain"
enabled="/etc/nginx/sites-enabled/$domain"

if [[ $EUID -ne 0 ]]; then
    echo "관리자 권한이 필요합니다: sudo bash $root/scripts/deploy-production.sh $stage" >&2
    exit 1
fi
case "$stage" in all|app|https) ;; *) echo '사용법: deploy-production.sh [all|app|https]' >&2; exit 1 ;; esac
for program in docker nginx certbot curl python3 openssl; do command -v "$program" >/dev/null; done

# 운영 파일을 셸 코드로 실행하지 않고 필요한 값만 확인합니다.
python3 - "$root/.env.production.local" "$stage" <<'PY'
from pathlib import Path
import stat, sys
p = Path(sys.argv[1])
if not p.is_file() or p.is_symlink():
    raise SystemExit('정상 .env.production.local 파일이 필요합니다.')
if stat.S_IMODE(p.stat().st_mode) & 0o077:
    raise SystemExit('운영 환경 파일 권한을 chmod 600으로 설정하세요.')
values = dict(line.split('=', 1) for line in p.read_text().splitlines()
              if line and not line.startswith('#') and '=' in line)
password = values.get('DATABASE_PASSWORD', '')
if len(password) < 32 or password in {'REPLACE_WITH_RANDOM_PRODUCTION_PASSWORD', 'mango_local_only'}:
    raise SystemExit('충분한 길이의 무작위 운영 DB 비밀번호가 필요합니다.')
if sys.argv[2] != 'https':
    for name in ('KAKAO_CLIENT_ID', 'KAKAO_CLIENT_SECRET'):
        value = values.get(name, '').strip().strip('\"\'')
        if not value or value.startswith(('REPLACE_', 'YOUR_', '<')):
            raise SystemExit(f'{name}를 먼저 입력하세요. 카카오 미설정 상태에서 운영 로그인이 중단되지 않도록 배포를 중지했습니다. docs/account-connections.md 참고.')
print('운영 환경 파일 검사 통과 (비밀값 출력 안 함).')
PY
bash "$root/scripts/compose-production.sh" config --quiet

install_site() {
    local source=$1 previous='' had_link=false
    if [[ -e "$site" || -L "$site" ]]; then
        if [[ -L "$site" ]] || ! head -n 1 "$site" | grep -qx '# Managed by Mystery Mango deployment.'; then
            echo "수동 관리 설정이 있어 덮어쓰지 않습니다: $site" >&2
            return 1
        fi
        install -d -m 0700 /var/backups/mystery-mango/nginx
        previous=$(mktemp /var/backups/mystery-mango/nginx/site.XXXXXXXX)
        cp -p -- "$site" "$previous"
    fi
    if [[ -e "$enabled" || -L "$enabled" ]]; then
        if [[ ! -L "$enabled" ]] || [[ $(readlink "$enabled") != "$site" ]]; then
            echo "기존 활성화 경로를 확인하세요: $enabled" >&2
            return 1
        fi
        had_link=true
    fi
    install -m 0644 "$source" "$site"
    if [[ "$had_link" == false ]]; then ln -s "$site" "$enabled"; fi
    if nginx -t && systemctl reload nginx; then return 0; fi
    echo 'Nginx 적용 실패. 직전 설정으로 복구합니다.' >&2
    if [[ -n "$previous" ]]; then cp -p -- "$previous" "$site"; else rm -f -- "$site"; fi
    if [[ "$had_link" == false ]]; then rm -f -- "$enabled"; fi
    nginx -t && systemctl reload nginx
    return 1
}

if [[ "$stage" == all || "$stage" == app ]]; then
    # 이미 공개된 사이트는 새 OAuth 경로를 열기 전에 외부 프록시의 로그 보호부터 적용합니다.
    # app 단계로 재배포하더라도 기존 도메인의 안전한 프록시 설정을 먼저 갱신합니다.
    if [[ -f "$site" && -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
        install_site "$root/infra/$domain.conf"
    fi
    systemctl enable --now docker
    bash "$root/scripts/compose-production.sh" up --build -d --wait --wait-timeout 240
    curl --fail --silent --show-error http://127.0.0.1:3211/healthz
    echo
    bash "$root/scripts/compose-production.sh" ps
fi

if [[ "$stage" == all || "$stage" == https ]]; then
    curl --fail --silent --show-error http://127.0.0.1:3211/healthz >/dev/null
    if ! getent ahostsv4 "$domain" >/dev/null; then
        echo "$domain DNS A 레코드를 먼저 설정하세요. 앱은 loopback에서 실행 중입니다." >&2
        exit 1
    fi
    install -d -m 0755 /var/www/certbot/.well-known/acme-challenge
    # 인증서 발급 실패 시에도 앱의 비보안 HTTP 로그인을 열지 않습니다.
    if [[ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
        install_site "$root/infra/$domain.http.conf"
    fi
    # 기존 ACME 계정을 재사용합니다. 계정이 여러 개면 Certbot이 선택을 요청합니다.
    certbot certonly --webroot --webroot-path /var/www/certbot \
        --cert-name "$domain" -d "$domain" --keep-until-expiring
    install_site "$root/infra/$domain.conf"
    install -d -m 0755 /etc/letsencrypt/renewal-hooks/deploy
    install -m 0755 "$root/infra/certbot-renew-hook.sh" \
        /etc/letsencrypt/renewal-hooks/deploy/50-mystery-mango-nginx
    systemctl enable --now certbot.timer
    curl --fail --silent --show-error --resolve "$domain:443:127.0.0.1" "https://$domain/healthz"
    echo
    echo "배포 완료: https://$domain"
fi
