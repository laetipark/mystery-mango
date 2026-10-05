# mystery.laetipark.me 운영 배포

대상 서버: `/home/laeti/mystery-mango`, Ubuntu 24.04, 기존 호스트 Nginx.
DNS 원본 IPv4는 2026-10-01 확인 기준 `220.86.36.83`이다.

## 구성

- 호스트 Nginx 443 → `127.0.0.1:3211`의 프런트 Nginx → Java 21 API → PostgreSQL 17.11.
- DB와 Java API는 Docker 내부 네트워크에만 열고, 호스트에는 프런트 loopback 포트만 연다.
- `compose.production.yml`은 개발 구성을 덮어쓰는 운영 설정이다. Docker Compose 2.24.4 이상이 필요하다.
- 프로젝트 이름은 `mystery-mango-prod`, DB 볼륨은 `mystery-mango-prod_postgres-data`다. 개발용 볼륨과 분리된다.
- 운영 프로필 `prod`, HTTPS 쿠키, 허용 Origin `https://mystery.laetipark.me`, 실제 작품 진행 시간으로 고정한다. 개발 계정은 생성하지 않는다.
- 컨테이너 자동 재시작과 Docker 부팅 자동 시작을 사용한다. 로그는 컨테이너별 10MB × 3개로 제한한다.
- API 컨테이너를 교체하면 프런트 Nginx도 재시작해 Docker 내부 IP를 다시 확인한다. 현재 단일 서버 배포에는 짧은 서비스 중단이 발생할 수 있다.
- 실제 비밀번호는 Git에서 제외되는 `.env.production.local`에 권한 0600으로 보관한다. 내용을 로그·대화·커밋에 출력하지 않는다.
- 운영 인증은 카카오 로그인만 제공한다. `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`이 없는 상태의 앱 재배포는 배포 스크립트가 차단한다. 카카오 앱의 로그인 활성화·콜백 등록도 완료해야 한다.
- Discord는 기본 비활성화다. 텍스트 게임은 가능하며, 음성은 [Discord 설정과 실제 통화 검증](discord.md)이 추가로 필요하다.

## 최초 설치

Cloudflare의 `laetipark.me` → DNS → Records에서 다음 레코드를 생성한다.

| 종류 | 이름 | 값 | 프록시 | TTL |
|---|---|---|---|---|
| A | mystery | 220.86.36.83 | DNS only | Auto |

처음에는 DNS only로 인증서를 발급하고 HTTPS를 확인한다. 이 서비스의 IPv6 연결을 구성하지 않았으므로 `mystery` AAAA 레코드는 추가하지 않는다. 원본 IP가 바뀌면 A 레코드도 갱신해야 한다.

```bash
cd /home/laeti/mystery-mango
python3 scripts/prepare-production-env.py
# 기존 카카오 앱의 REST API 키·Client Secret 입력
nano .env.production.local
sudo bash scripts/deploy-production.sh
```

스크립트는 환경 검사 → 이미지 빌드 → DB/API/프런트 기동 및 건강 검사 → 도메인 전용 Nginx 설정 → Let's Encrypt 발급 → HTTPS 적용 순서로 실행한다. 기존 ACME 계정을 사용하며, 선택이나 동의가 필요하면 Certbot이 터미널에서 안내한다. sudo 비밀번호는 터미널에 직접 입력한다.

인증서 발급 전에는 ACME 경로만 공개하고 나머지 HTTP 요청에는 503을 반환한다. Nginx 문법 검사나 reload 실패 시 직전 도메인 설정을 복원한다. 기존 도메인 설정은 수정하지 않는다. 같은 도메인에 수동 관리 설정이 있으면 덮어쓰지 않고 중단한다.

DNS 준비 전 컨테이너만 시작하려면 `sudo bash scripts/deploy-production.sh app`, 이후 HTTPS만 설정하려면 `sudo bash scripts/deploy-production.sh https`를 실행한다. 실패 후에도 운영 DB 볼륨은 보존되며 같은 명령으로 재시도할 수 있다.

## 운영 확인

카카오 로그인 전환 또는 Discord 연결에는 [계정 연결 설정](account-connections.md)을 먼저 수행한다. `prepare-production-env.py`는 기존 비밀값을 유지하면서 누락된 연결 설정 항목만 추가한다. 이번 전환은 DB 마이그레이션과 Nginx 콜백 로그 설정도 포함하므로 DB 백업 후 전체 배포 명령을 사용한다. 운영 DB의 기존 이메일 계정과 기록은 보존되지만 카카오 계정으로 자동 연결하지 않는다. 기존 계정의 기록 이전이 필요하면 전환 전에 별도 계정 연결 절차를 마련해야 한다.

OAuth 콜백의 인가 코드와 `state`가 요청 URL에 포함되므로 호스트와 컨테이너 Nginx 모두 해당 콜백의 액세스·프록시 오류 로그를 끈다. 일반 API의 추적 ID·안전한 서버 오류 기록은 유지한다.

기존 HTTPS 사이트를 갱신할 때는 새 컨테이너를 시작하기 전에 호스트 Nginx 설정을 먼저 검사·적용한다. 이 순서는 `app` 단계에도 적용해 전환 중 콜백 URL이 예전 프록시 로그에 기록되는 구간을 방지한다.

```bash
sudo bash scripts/compose-production.sh ps
curl --fail --resolve mystery.laetipark.me:443:127.0.0.1 https://mystery.laetipark.me/healthz
curl --fail --resolve mystery.laetipark.me:443:127.0.0.1 https://mystery.laetipark.me/api/v1/meta
sudo bash scripts/compose-production.sh logs --tail 100 backend
sudo certbot renew --cert-name mystery.laetipark.me --dry-run
```

로그에 실제 비밀 자료가 없는지 주의한다. `docker compose config`는 환경 비밀값을 펼치므로 `config --quiet`만 공유한다. 인증서는 기존 `certbot.timer`가 갱신하며 전용 deploy hook이 Nginx를 다시 읽힌다.

브라우저에서 회원가입·로그인·작품 목록·모집방·실시간 연결을 확인한다. HTTPS의 세션 쿠키는 Secure/HttpOnly/SameSite=Lax여야 한다. 최초 관리자는 본인이 회원가입한 뒤 운영자가 그 계정만 DB에서 승격해야 한다. 이메일을 추정해 관리자 권한을 부여하거나 기본 관리자 비밀번호를 생성하지 않는다.

Cloudflare 프록시를 나중에 활성화할 경우 SSL 모드는 Full (strict)가 필요하다. 기존 다른 서비스에 영향을 줄 수 있는 존 전체 SSL 설정은 무작정 바꾸지 않는다. 프록시가 켜지면 현재 구성의 인증 시도 제한은 Cloudflare 연결 IP 단위이므로, 실제 사용자 IP 처리를 위해 Cloudflare 공식 IP 대역만 신뢰하는 Nginx real_ip 구성을 별도로 검토한다. 현재 검증 대상은 DNS only다.

## 업데이트·백업·중단

업데이트 전에 수동 백업을 만든다. 백업의 외부 저장·자동화·복구 훈련은 아직 구성하지 않았다.

```bash
sudo bash scripts/backup-production.sh
# 코드를 검토하고 가져온 뒤 재빌드
sudo bash scripts/deploy-production.sh app
# 데이터 보존하며 중단
sudo bash scripts/compose-production.sh stop
```

`down --volumes`, `docker volume rm`을 운영에서 실행하지 않는다. Flyway 스키마 변경 뒤에는 이전 앱 버전으로 단순 되돌리기가 불가능할 수 있으므로 해당 변경과 백업 복구를 함께 검토한다. 설정 변경 시 `.env.production.local`은 보존한다.

백업 검증은 `pg_restore --list`까지 자동으로 수행한다. 실제 복구는 먼저 독립 PostgreSQL 17 DB에 덤프를 복원하고 로그인·작품·게임 데이터를 확인한다. 운영 복구가 필요하면 앱을 중지하고 현재 DB도 별도 백업한 뒤 명시적으로 선택한 덤프를 복원한다. 운영 DB를 자동 삭제하는 복구 명령은 제공하지 않는다.

## 배포 검증 상태

2026-10-01 최초 운영 배포와 외부 HTTPS 접속 검증을 완료했다. 사용자 실행 로그에서 DB/API/프런트 컨테이너의 healthy 상태를 확인했고, 운영 서버의 `/healthz`는 `UP`이다. [외부 3개 지점 확인 결과](https://check-host.net/check-report/4e45bd80kf88)는 모두 HTTP 200이다. 아래 화면·외부망 결과는 최초 배포 버전에서 확인한 내용이다.

홈·작품 목록·모집방·로그인·회원가입 화면의 HTTPS 응답, 작품 3개, 익명 사용자의 개인 활동 API 접근 거부, Secure/HttpOnly/SameSite=Lax 쿠키를 확인했다. 데스크톱·모바일에서 가로 넘침과 JavaScript 오류가 없었다. 이 확인에서는 운영 계정을 새로 만들거나 실제 운영 게임을 진행하지 않았다. 4인 게임 테스트는 분리한 E2E DB에서 수행한 결과다.

Docker와 Certbot 타이머의 부팅 자동 시작이 활성화돼 있고 인증서 갱신 후 Nginx를 다시 읽히는 hook이 설치됐다. 현재 인증서는 2026-12-29 23:27 KST까지 유효하다. Certbot 갱신 dry-run과 실제 백업 복구 훈련은 별도 미실행이다. Discord는 비활성화 상태다.

이후 카카오 로그인 버전도 운영 반영했다. 약 01:05 KST에 새 로그인 제공자 API, 이메일 인증 차단, 카카오 인증 시작·취소·state 재사용 차단과 보안 쿠키를 확인했다. 운영 JS/CSS는 검증한 빌드와 일치하며 호스트 Nginx 콜백 로그 보호도 적용됐다. 사용자가 실제 카카오 로그인 성공을 확인했다. 이번 운영 탭의 자동 브라우저 검사는 도구 URL 정책으로 수행하지 못했고, Discord 실제 연결·통화와 카카오 재로그인 검증은 별도 남아 있다.

후속 `KOE205` 보고는 카카오 앱의 닉네임 동의항목 설정을 안내한 뒤 사용자가 로그인 성공을 재확인해 해결했다. 서버는 `profile_nickname`을 요청하므로 운영 키의 앱에 닉네임 선택 동의를 유지한다. 이 조치에는 서버 코드 변경이나 재배포가 필요하지 않았다. 같은 오류가 재발하면 [오류 해결 절차](account-connections.md#koe205-오류가-표시될-때)를 따른다.

이후 Discord 콜백·카테고리를 바로잡고 운영 제공자를 `discord`로 활성화했다. 서버 소유자 참가 허용 변경도 재배포했으며 사용자가 소유자 계정의 참가 성공을 확인했다. 약 01:24 KST 서버 건강 상태와 배포 JS/CSS 일치를 확인했다. 실제 4인 통화·밀담 청취 분리는 별도 미검증이다.

개발·E2E 계정이 있는 검증 DB는 운영 볼륨으로 옮기지 않는다. 자세한 증거와 검증 범위는 [검증 기록](verification.md)을 참고한다.
