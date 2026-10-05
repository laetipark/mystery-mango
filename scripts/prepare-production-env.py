#!/usr/bin/env python3
"""비밀값을 출력하지 않고 최초 운영 환경 파일을 생성한다."""
from pathlib import Path
import os
import secrets
import stat

root = Path(__file__).resolve().parent.parent
destination = root / '.env.production.local'
if destination.exists():
    if destination.is_symlink() or stat.S_IMODE(destination.stat().st_mode) & 0o077:
        raise SystemExit('운영 환경 파일은 일반 파일, 권한 0600이어야 합니다.')
    current = destination.read_text()
    keys = {line.split('=', 1)[0] for line in current.splitlines()
            if line and not line.startswith('#') and '=' in line}
    defaults = {
        'KAKAO_CLIENT_ID': '',
        'KAKAO_CLIENT_SECRET': '',
        'KAKAO_REDIRECT_URI': 'https://mystery.laetipark.me/api/v1/auth/kakao/callback',
        'DISCORD_REDIRECT_URI': 'https://mystery.laetipark.me/api/v1/me/discord/callback',
    }
    missing = [(key, value) for key, value in defaults.items() if key not in keys]
    if missing:
        with destination.open('a') as output:
            output.write('\n# 계정 연결 설정: 기존 키와 비밀번호는 유지합니다.\n')
            for key, value in missing:
                output.write(f'{key}={value}\n')
        print('기존 비밀값을 유지하고 누락된 계정 연결 설정 항목을 추가했습니다.')
    else:
        print('기존 .env.production.local을 유지합니다.')
else:
    template = (root / '.env.production.example').read_text()
    content = template.replace('REPLACE_WITH_RANDOM_PRODUCTION_PASSWORD', secrets.token_hex(32))
    descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w') as output:
        output.write(content)
    print('.env.production.local 생성 완료 (권한 0600, 비밀번호 출력 안 함).')
