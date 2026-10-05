# 구현 상태와 검증 기록

작성 기준: 2026-09-27. 최종 테스트 실행 결과를 아래 표에 기록한다.

| 영역 | 구현 | 검증 상태 |
| --- | --- | --- |
| 인증·작품·공개/초대 모집방 | 구현 | PostgreSQL·브라우저 검증 |
| 역할·조사·공유·대화·밀담·투표·엔딩·기록 | 구현 | PostgreSQL 게임 통합 8개 통과 |
| 자동 매칭·차단·노출·취소 경합 | 구현 | PostgreSQL 매칭 통합 10개 통과 |
| 초대 링크 해시 저장·재시도 권한 | 구현 | PostgreSQL 초대 통합 6개 통과 |
| HTTP·STOMP 보안·실제 API 계약 | 구현 | HTTP 통합 8개 통과 |
| 재접속·단계 복구·중단·탈퇴 권한 회수 | 구현 | 게임 통합, 실제 JVM 강제 종료/재시작 통과 |
| Discord 계정 연결·권한/채널 동기화 | 구현 | mock/단위 테스트, 실제 Discord 미검증 |
| Docker 전체 실행 | 구성 완료 | Compose 설정 검사 통과; 이 PC Docker Desktop 내부 소켓 오류로 컨테이너 미실행 |
| 공개 배포 | 범위 외 | 미실행 |

## 실제 환경

Java Microsoft OpenJDK 21.0.12.1, Gradle 8.14.4, 공식 EDB PostgreSQL 17.11 Windows 바이너리, Node22.22.0, Chromium을 사용했다. Docker 실행 실패 후 프로젝트 내부의 별도 PostgreSQL을 loopback 포트에서 실행해 실제 SQL·트랜잭션을 검증했다. H2나 메모리 DB로 대체하지 않았다.

PostgreSQL 외부 DB 경로는 Testcontainers와 같은 스키마/서비스 테스트를 실행하지만, Testcontainers의 컨테이너 기동 경로 자체를 통과했다고 뜻하지 않는다. Docker 실패 로그와 실제 DB 성공 결과를 구분한다.

## 실행 결과

- 백엔드 `gradlew test bootJar`: **65개 통과, 실패·오류 0**. 인증/본문 제한 5, 규칙/작품 6, 게임 8, 매칭 10, 초대 6, HTTP/계약 8, 실시간 7, Discord 모의 검증 15개다. HTML 결과는 `backend/build/reports/tests/test/index.html`에 생성된다. 비로그인 API 문서 접근, 잘못된 UUID·없는 경로·필수 헤더 누락의 4xx 응답도 확인했다.
- 실제 HTTP 응답을 게시된 OpenAPI의 필수 필드·타입·null 허용·추가 필드 제한과 비교한다. 개인 자료, 게임 전체 단계, 공개 작품, 모집방, 활동, 기록을 포함한다. 이 검사는 모든 가능한 작품/응답 조합의 완전한 검증을 뜻하지 않는다.
- 실제 JVM 강제 종료 검증: 35.027초 동안 서버가 없는 뒤 재시작했다. 기존 4개 세션/CSRF·역할·조사 단서를 복원했고, 단계 행은 2→3, 순번은 1→2로 한 번만 증가했다. 다음 단계는 정상 30초이며 조회 시 29.727초가 남았다. 검증 후 전용 JVM과 8082 포트는 정리했다.
- `scripts/verify-restart.mjs`로 재현한다. `JAVA_EXECUTABLE`, `PG_BIN`, `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`를 환경에 맞춘다. 로컬의 `mystery_mango_restart` 전용 DB만 허용하며 증거는 `.tools/verify-restart-result.json`에 남긴다.
- 프런트 기본 npm 10의 실제 `npm ci --offline`, TypeScript/Vite 빌드, ESLint, 단위 테스트 **3개**가 통과했다. 공통 세션·재연결 보완 후 Playwright 최종 전체 **4개 통과(2.2분)**. HTML 결과는 `frontend/playwright-report/index.html`에 생성된다. OpenAPI 타입 생성/차이 검사도 통과했다.
- 공개 작품 응답에서 정답/개인 비밀 필드가 제외되는지 검사한다. 빌드된 프런트 번들과 실행 서버 로그를 샘플의 실제 개인 비밀·단서 본문과 비교해 일치하는 본문이 0건임을 확인했다. WebSocket 실제 수신 이벤트는 허용된 메타데이터 필드 5개만 포함함을 검사한다.

GitHub Actions 설정을 추가했으나 이 작업에서 원격 리포지토리로 게시하거나 Actions 실행을 요청하지는 않았다. 로컬 통과와 원격 CI 실행은 구분한다.

Playwright에서 독립 쿠키 세션 4개의 가입→모집방→준비→역할→조사→투표→엔딩·기록, 자동 매칭→수락→작품 투표→확정 방, 외부인의 비밀 API 직접 접근 거부, 초대 링크 생성·교체·기존 링크 거부를 검사했다. 데스크톱과 모바일 화면은 가로 overflow와 JS 오류도 확인했다.

추가한 게임 회귀 검사는 8.5초 실제 offline 상태·실패한 브라우저 HTTP 요청·온라인 복귀 후 snapshot/역할/놓친 메시지/새 메시지/실시간 표시를 확인한다. Tab/Enter로 준비와 시작을 조작했고, 같은 세션을 API에서 로그아웃한 후 로그인 화면으로 전환되고 개인 패널이 사라지는지 검사했다. 이 흐름에서 pageerror는 0건이었다.

## 남은 외부 검증

실제 Discord 전용 서버·OAuth 앱·봇 토큰이 없으므로 계정 연결 실환경, 4인 실제 통화, 밀담 청취 분리, 강제 퇴장·재입장 거부, 마이크 거부, 재접속, 봇 권한 회수·호출 제한 실환경 검증은 하지 않았다. 이 검증 전 MVP-B 전체 완료로 보지 않는다.

현재 단일 서버의 보수적 DB 잠금과 FIFO 탐색 제한은 대규모 동시 사용자 환경에 대한 확장성 보장이 아니다. 운영 부하·보안 진단·음성 품질은 별도 검증이 필요하다.

## 2026-10-01 배포 준비 검증

백엔드는 공식 PostgreSQL 17.11 소스의 SHA-256을 검증하고 프로젝트 `.tools` 내부에 빌드한 전용 인스턴스에서 `test bootJar`를 실행했다. **65개 통과, 실패·오류·건너뜀 0개**다. 운영 DB를 사용하지 않았으며 E2E 종료 후 테스트 Java·PostgreSQL을 정상 종료했다. Docker/Testcontainers 기동 경로는 이 검증에 포함하지 않았다.

운영 Compose 병합 검사는 DB/API 호스트 포트 없음, 프런트 loopback 3211만 노출, 개발 DB와 별도 볼륨, `prod` 프로필, HTTPS 쿠키, 정확한 도메인 Origin, 재시작 정책을 확인했다. Nginx 설정 3종은 임시 로컬 포트·임시 인증서로 문법 검사를 통과했고, 배포 셸 문법과 Git diff 공백 검사도 통과했다. 실제 관리자 권한 적용·운영 Docker 실행·공인 HTTPS 발급은 아직 실행하지 않았다.

Docker Hub에서 고정한 이미지 5종의 digest가 존재함을 `docker manifest inspect`로 확인했다. 이미지 빌드·컨테이너 기동 성공을 의미하지는 않는다.

Linux, Node.js 24.14.1, npm 11.11.0에서 프런트를 다시 검증했다. 고정된 의존성과 잠금 파일로 `npm ci --offline`, ESLint, TypeScript/Vite 빌드, Vitest 단위 테스트 **3개**가 통과했다. 빌드된 공개 자산 3개와 E2E 백엔드 로그 1개를 작품의 개인 자료·단서·엔딩 본문 42개와 비교했으며 일치하는 본문은 0개였다.

설치 시 발견된 npm 취약 의존성 6개(높음 4개, 중간 2개)는 같은 메이저의 최소 수정판으로 갱신했다. `npm audit --json` 재검사 결과는 **0개**다. 실제 공격 가능성의 평가나 모든 보안 문제의 부재를 뜻하지 않는다.

| 의존성 | 이전 → 수정 | 공식 수정 근거 |
| --- | --- | --- |
| Axios | 1.15.0 → 1.18.0 | [Axios 보안 공지](https://github.com/axios/axios/security/advisories/GHSA-mmx7-hfxf-jppx) |
| React Router DOM/React Router | 7.14.0 → 7.18.2 | [React Router 보안 공지](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2) |
| Vite | 8.0.8 → 8.0.16 | [Vite 보안 공지](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff) |
| Vitest/@vitest/mocker | 4.1.0 → 4.1.11 | [Vitest 보안 공지](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9) |

프로덕션은 정적 SPA를 제공하므로 개발 서버·React Router SSR/RSC·Axios Node HTTP 어댑터 관련 공지가 모두 같은 방식으로 적용되지는 않는다. 수정판은 기존 Node.js 22.22 환경 요구와 호환되며 애플리케이션 API와 게임 규칙은 변경하지 않았다.

새로 구성한 PostgreSQL 17.11 전용 `mystery_mango_e2e` DB와 `e2e` 프로필의 loopback 백엔드에서 Chromium 브라우저 테스트 **4개가 2.0분에 모두 통과**했다. 4인 게임 전체 진행, 네트워크 단절 복구, 키보드 조작, 자동 매칭, 개인 자료 접근 거부, 초대 링크 교체를 검사했다. 운영 DB는 사용하지 않았다. 같은 Java 서버의 `/api/openapi`와 `src/common/api.generated.ts` 차이 검사도 통과했다. HTML 보고서는 `frontend/playwright-report/index.html`에 생성된다.

## 2026-10-01 실제 운영 배포 확인

이후 사용자가 `sudo bash scripts/deploy-production.sh`를 실행했고, 제공된 로그에서 운영 이미지 빌드 성공과 PostgreSQL/API/프런트 컨테이너 3개의 healthy 상태를 확인했다. 도메인 전용 Nginx 설정과 Let's Encrypt 인증서가 적용됐다. Nginx의 기존 리스너 옵션 관련 경고는 있었으나 전체 문법 검사와 reload는 성공했다.

- 운영 HTTPS `/healthz`: `UP`, HTTP는 같은 도메인 HTTPS로 301 전환한다.
- 인증서 검증을 생략하지 않고 `mystery.laetipark.me` SAN과 Let's Encrypt 발급을 확인했다. 만료는 2026-12-29 23:27 KST다.
- Chromium에서 실제 HTTPS 도메인을 loopback에 연결해 홈·작품 목록·모집방·로그인·회원가입 5개 경로가 모두 HTTP 200인지 확인했다. 공개 작품 3개, CSRF API 200, 익명 개인 활동 API 401을 확인했다.
- 세션 쿠키는 Secure/HttpOnly/SameSite=Lax다. 데스크톱 1440px와 모바일 390px에서 가로 넘침이 없었고, JavaScript 오류·실패 요청은 0개였다. 운영 계정 생성·로그인·4인 실제 게임은 이 스모크 검사에 포함하지 않았다.
- [독립 외부망 HTTPS 확인](https://check-host.net/check-report/4e45bd80kf88): 핀란드 Helsinki, 인도네시아 Jakarta, 미국 Miami에서 `/healthz`를 요청해 모두 HTTP 200을 받았다. 서버 자신의 공인 주소로 접속하는 경로의 시간 초과와 외부망 접속 결과를 구분했다.
- `docker`와 `certbot.timer`는 enabled다. 갱신 hook은 root 소유·0755로 설치됐으며 저장소의 hook과 동일하다. 갱신 dry-run과 실제 DB 복구 훈련은 수행하지 않았다.
- Discord는 `voiceProvider=disabled`, `voiceConfigured=false`다. 음성 연동·실제 통화는 미검증이다.

브라우저 확인 결과와 화면은 `.tools/deployment-check/browser-smoke.json`, `home-desktop.png`, `home-mobile.png`에 보관했다. 앞선 배포 준비 단계의 Docker 미실행 상태는 본 운영 배포 확인으로 갱신한다.

## 2026-10-01 카카오 로그인 변경 검증

운영 가입·로그인을 카카오 OAuth로 전환하는 변경을 구현했다. 개발·E2E 프로필의 이메일 인증은 유지하며, 운영 프로필에서는 직접 이메일 가입·로그인을 차단한다. 카카오 사용자 ID로 계정을 식별하고 이메일 자동 병합이나 카카오 토큰 저장은 하지 않는다. 기존 이메일 계정과 게임 기록은 보존되지만 카카오 계정으로 자동 이전되지 않는다.

- 별도 PostgreSQL 17.11 DB에서 `test bootJar`: **80개 통과, 실패·오류·건너뜀 0개**. 기존 65개에 카카오 HTTP/DB 8개, 보안 6개, 운영 인증 정책 1개를 추가했다. 세션에 묶인 일회용 state·만료·재사용·동시 요청, 새 세션/CSRF 발급, 외부 리다이렉트 거부, 잘못된 카카오 ID, 외부 응답 크기와 시간 제한 등을 검증했다.
- 프런트 ESLint·TypeScript/Vite 빌드·단위 테스트 **26개**, OpenAPI 생성 타입 차이 검사 모두 통과했다. Playwright 전체 **13개 통과**: 실제 로컬 API를 사용하는 기존 게임 회귀 4개와 모의 인증 응답을 사용하는 카카오 화면 검사 9개다.
- 데스크톱 1440px·모바일 390px에서 카카오 전용 가입·로그인 화면을 확인했다. 화면은 `.tools/kakao-verification/login-desktop.png`, `login-mobile.png`에 보관했다.
- 새 공개 프런트 자산 3개와 E2E 서버 로그 1개를 작품의 개인 자료·단서·엔딩 본문 42개와 비교했으며 일치하는 본문은 0개였다. 테스트 Java·PostgreSQL은 종료했다.
- 호스트·컨테이너 Nginx 콜백 경로의 접근·오류 로그 보호를 구성했다. 임시 인증서와 이중 프록시에서 정상 요청 로그는 남고 카카오·Discord 콜백의 코드/state 표식은 남지 않음을 확인했다. 기존 공개 서버에서는 Compose 교체 전에 호스트 Nginx 보호 설정을 적용한다.
- 셸 문법·Nginx 문법·운영 환경 파일 사전 검사를 통과했다. 실제 비밀값은 출력하지 않았고 환경 파일은 Git과 Docker 빌드 컨텍스트에서 제외했다. 사용자가 입력한 연동 항목은 기존 DB 설정을 보존하며 실제 배포 파일 `.env.production.local`에 반영했다. Discord 모드는 `disabled`를 유지했다.

위 결과는 새 버전의 로컬 검증이다. 이후 운영 배포 결과는 다음 절에 구분해 기록한다. 외부 서비스 설정은 [연결 설정 안내](account-connections.md)를 따른다.

## 2026-10-01 카카오 버전 운영 배포 확인

사용자가 운영 DB 백업·배포 명령 완료를 알렸고, 약 01:05 KST에 운영 서버의 새 버전을 확인했다. 교체 중 일시적인 502 응답은 이후 정상화됐다. 이어 사용자가 실제 카카오 로그인 성공을 확인했다. 이 사용자 확인은 자동 테스트의 모의 OAuth 결과와 구분한다.

- 인증서를 검증하는 HTTPS 연결에서 `/healthz`는 `UP`, `/login`은 200이다. 공인 주소의 NAT hairpin 문제를 피하기 위해 실제 도메인/SNI를 유지한 loopback 경로로 검사했다.
- `/api/v1/auth/providers`는 `kakaoConfigured=true`, `localLoginEnabled=false`다. 기존 이메일 가입·로그인 API는 유효한 CSRF가 있는 익명 요청에도 거부됐다.
- 실제 운영 API가 공식 Kakao 인증 주소와 정확한 운영 콜백을 생성했다. 별도 익명 테스트 세션에서 CSRF 없는 인증 시작은 403, 정상 시작은 200, 취소 콜백은 취소 안내로 302, 같은 state 재사용은 만료 안내로 302임을 확인했다. 이 검사는 Kakao 외부 서버로 토큰을 요청하지 않았으며 테스트 세션은 로그아웃했다.
- 운영 세션 쿠키는 Secure·HttpOnly·SameSite=Lax다. `/login`이 제공하는 JS/CSS의 SHA-256이 로컬에서 검증한 빌드와 일치했다.
- 실제 호스트 Nginx 파일에 Kakao·Discord 콜백의 접근·오류 로그 보호가 적용됐다. HTTP는 HTTPS로 전환되고 앱 포트 3211은 loopback에만 열려 있다. Docker·Nginx·Certbot 타이머는 active·enabled 상태다.
- 서버 검사 증거는 `.tools/kakao-deployment-check/server-smoke.json`에 기록했다. 비밀값·세션·인가 코드·state는 기록하지 않았다.

브라우저 도구의 URL 정책으로 운영 탭 자동 검사는 차단돼 수행하지 않았다. 운영 브라우저 렌더링의 자동 재검증과 로그아웃 후 재로그인·동일 계정 유지 검사는 별도 미확인이다. 실제 카카오 로그인 성공은 사용자가 확인했다. Docker 소켓·백업 경로의 관리자 권한이 없어 컨테이너 상세 상태와 백업 파일은 직접 확인하지 않았다. Discord는 `disabled` 상태이며 실제 계정 연결·음성 통화는 미검증이다.

### 후속 확인: KOE205 보고

이후 사용자가 카카오 인증 화면에서 `KOE205` 오류를 보고했다. 앞선 사용자 성공 보고만으로 현재 외부 인증이 정상이라고 판단하지 않고 재점검했다. 공식 오류 문서와 서버 코드에서 미설정 동의항목 오류 및 `scope=profile_nickname` 요청을 확인했다. 실제 운영 키에 해당하는 카카오 앱에서 닉네임을 선택 동의로 설정하고 로그인을 새로 시작하도록 안내한 뒤, 사용자가 **로그인 성공**을 다시 확인했다. 이 후속 오류는 해결 상태이며, 서버 코드·운영 환경 파일 변경과 재배포는 하지 않았다. 성공 확인은 사용자의 직접 시험 결과다.

## 2026-10-01 Discord 운영 설정 점검

사용자의 확인 요청에 따라 저장된 봇 토큰으로 공식 Discord REST API를 읽기 전용 호출했다. 원본 응답·토큰·Client Secret은 출력하거나 기록하지 않았다. 메시지 전송, Gateway 연결, 채널 생성, 권한 변경, 운영 활성화는 수행하지 않았다.

- 운영 `/api/v1/meta`와 배포 환경 파일의 제공자는 `disabled`다. 필수 설정값은 모두 있고 ID 형식과 서버 쪽 콜백 주소는 올바르다.
- 현재 앱·봇 계정 조회가 HTTP 200이고, 봇 토큰은 유효하며 설정한 Client ID와 같은 애플리케이션이다. 지정한 서버 조회와 봇 멤버 조회도 200으로 설치를 확인했다.
- Discord 애플리케이션의 `redirect_uris`에 필수 운영 콜백 `https://mystery.laetipark.me/api/v1/me/discord/callback`이 **없다**. Developer Portal의 OAuth2 Redirects에 등록해야 한다.
- `DISCORD_CATEGORY_ID`는 해당 서버의 **일반 음성 채널(type=2)**을 가리켰다. 앱은 **카테고리(type=4)**를 요구한다. 그 채널의 상위 “음성 채널” 카테고리가 존재함을 확인했으므로 해당 카테고리 ID를 사용하거나 별도 전용 카테고리를 정해야 한다.
- 봇에 Administrator가 부여되어 있다. 필요한 권한 비트는 충족되지만 최소 권한 구성은 아니다. 현재 구현이 요구하는 권한 마스크는 `321981969`이며 [권한 안내](account-connections.md)에 따라 서버·카테고리 양쪽에서 확인한다.

증거는 `.tools/discord-deployment-check/rest-diagnostics.json`에 비밀값 없이 보관했다. 이 최초 결과는 **봇 토큰·서버 접근 검증**이며, 당시 위 설정 오류 때문에 연동 준비 완료로 판정하지 않았다. OAuth Client Secret의 유효성, 실제 사용자 계정 연결, Gateway 준비 상태와 4인 음성·밀담 분리는 아직 검증하지 않았다.

사용자의 설정 수정 완료 이후 약 01:14 KST 재확인에서 운영 OAuth 콜백 등록, 카테고리 type=4, 설정 서버 소속, 앱 ID 일치가 모두 통과했다. `.tools/discord-deployment-check/config-recheck.json`에 결과를 보관했다. 배포 환경 파일과 실행 중인 운영 API는 여전히 `VOICE_PROVIDER=disabled`이므로 사이트에서 Discord 계정 연결·음성 기능은 아직 활성화되지 않았다. 활성화 배포 후에는 실제 사용자 OAuth와 Gateway 준비 상태를 별도로 확인해야 한다.

## 2026-10-01 Discord 서버 소유자 참가 허용

이후 운영 `/api/v1/meta`에서 `voiceProvider=discord`, `voiceConfigured=true`를 확인했다. 사용자가 마이페이지의 `PRIVILEGED_ACCOUNT` 상태를 알려 기존 관리 권한 계정 참가 제한이 적용되고 있음을 확인했다. 사용자의 명시적 요청에 따라 **현재 서버 소유자만** 그 제한의 예외로 허용한다. 소유자가 아닌 관리자·채널 관리·권한 관리·멤버 이동 권한 계정의 제한과 가입 심사 미완료 거부는 유지한다.

소유자는 Discord 권한상 모든 음성 채널에 접근할 수 있으므로 마이페이지와 운영 안내에 이 한계를 명시했다. 참가 제한 사유도 한국어로 표시한다. 프런트 ESLint·TypeScript/Vite 빌드·단위 테스트 **26개**가 통과했다. 프런트는 정적 안내 문구만 변경했으므로 기존 E2E를 다시 실행하지 않았다.

별도 PostgreSQL 17.11 DB에서 백엔드 `test bootJar`가 **89개 통과, 실패·오류·건너뜀 0개**로 완료됐다. 추가한 9개 테스트는 실제 `eligibility` 메서드를 모의 JDA 응답으로 호출해 소유자 허용, 비소유자 관리 권한 거부, 가입 심사 미완료 거부, 일반 참가자 허용, 봇 미준비 거부를 검사한다. 실제 Discord 통화 검증을 의미하지 않는다. DTO·DB 스키마·일반 참가자의 기존 권한 검사 흐름은 변경하지 않았다.

사용자의 재배포 후 **서버 소유자 계정으로 참가 성공**을 직접 확인받았다. 약 01:24 KST 운영 HTTPS `/healthz`는 `UP`, 음성 제공자는 `discord`, `voiceConfigured=true`이고 JS/CSS가 검증한 새 빌드와 일치했다. `.tools/discord-deployment-check/owner-deployment.json`에 결과를 기록했다. 소유자 참가 성공과 실제 4인 통화·밀담 청취 분리의 검증은 구분하며 후자는 아직 미검증이다.

## 2026-10-01 1인·2인 샘플 추가 검증

직접 작성한 「열두 시의 보관함」(1인·텍스트·15분)과 「눈 내린 역의 마지막 소포」(2인·텍스트/Discord·20분)를 추가했다. 1인용은 혼자 자료를 조사하고 판단을 정리하는 연습이고, 2인용은 서로 다른 개인 단서를 합치는 협력형이다. 기존 4인용 작품 세 개는 수정하지 않았다. 시간은 실제 장기 플레이테스트로 보증한 값이 아닌 단계 시간 합계 기반의 추정값이다.

- 작품 검증은 1~4명의 정원과 같은 수의 역할을 요구한다. 방 입장·시작·안내와 Discord 전체방의 정원을 작품의 실제 인원에 맞췄다. 자동 매칭은 4인용 작품만 사용한다.
- 목록 API와 화면에 `playerCount` 필터를 추가하고 공개 카드에 인원을 표시했다. 1인 샘플의 텍스트 전용 설정은 서버와 프런트 양쪽에서 적용한다.
- 새 JSON의 ID 참조·조사 한도·단서 도달성·개인 목표·시간 합계를 확인했다. 단서 공개 부분집합과 지목 결과를 조합한 160가지 경우에서 엔딩이 항상 결정되고 모든 엔딩에 도달할 수 있음을 정적으로 검증했다.
- 별도 PostgreSQL 17.11 DB에서 `test bootJar`: **98개 통과, 실패·오류·건너뜀 0개**. 새 HTTP 통합 검증은 인원 필터의 총계·페이지 경계, 공개 자료의 비밀 제외, 정원·준비·개인 자료 격리, 단서 확보·공개, 솔로 지목·기권과 2인 합의·동률, 종료·활동 해제·플레이 이력을 포함한다. 소수 인원 작품의 자동 매칭 제외와 최종 후보 검사도 확인했다.
- 기존 JAR로 작품 3개를 적재한 격리 DB에 새 JAR를 기동한 결과 5개로 늘었고, 기존 세 작품의 ID와 버전 ID는 유지됐다. 운영 DB는 이 테스트에 사용하지 않았다.

- 프런트 ESLint·TypeScript/Vite 빌드·단위 테스트 **26개**, 실행 중인 Java API와 OpenAPI 생성 타입 일치 검사를 통과했다. 인원 필터 계약도 저장된 명세와 생성 타입에 반영했다.
- 로컬 브라우저에서 5개 작품 카드, 1인 필터, 3인 작품이 없을 때의 안내를 확인했다. 데스크톱 1440px·모바일 390px에서 배치와 가로 넘침을 확인했고 화면은 `.tools/small-party-verification/catalog-desktop.png`, `catalog-solo-mobile.png`, `catalog-empty-three-mobile.png`에 보관했다.
- 공개 배포 자산·격리 서버 로그 4개를 전체 5개 작품의 비공개 본문 62개와 대조해 일치 0건을 확인했다. `git diff --check`도 통과했다.

- 관련 Playwright **15개를 검증했다**. 기존 게임·인증 13개는 첫 실행에서 통과했고, 신규 두 테스트는 엔딩 열람 뒤 `COMPLETED`까지 기다리도록 테스트를 보정한 재실행에서 모두 통과했다(1인 51.6초, 2인 53.3초). 인원 필터 → 방 만들기 → 정원·준비 확인 → 역할별 비밀 격리 → 조사·공유 → 투표 → 개인 목표 달성·엔딩 → 완료 기록 저장을 검사했다. 첫 보고서는 `.tools/small-party-verification/playwright-initial-report/index.html`, 신규 두 테스트의 최종 보고서는 `frontend/playwright-report/index.html`에 보관했다. 이 대기 보정으로 앱 코드를 변경하지 않았다.

격리 테스트 DB 두 개와 Java·PostgreSQL 프로세스는 검증 후 정리했다. 2인 실제 Discord 통화는 별도로 검증하지 않았다.

사용자가 백업·배포 명령 실행을 알린 뒤 컨테이너 교체 완료를 기다려 약 **01:50 KST**에 새 운영 버전을 확인했다. 인증서를 검증하는 HTTPS loopback 연결에서 `/healthz`는 `UP`이고 공개 작품이 5개로 늘었다. 기존 세 작품의 ID·버전 ID·인원·제목은 배포 전 기록과 같았으며, 인원 필터의 결과는 1인 1개·2인 1개·3인 0개·4인 3개였다. 새 두 작품의 상세 정보·역할 수·지원 모드와 비밀 필드 제외를 확인했고, 운영 JS/CSS의 SHA-256은 로컬 검증 빌드와 일치했다. 카카오 로그인 설정과 Discord 제공자도 활성 상태를 유지했다. 증거는 `.tools/small-party-verification/production-deployment.json`에 보관했다. 운영 브라우저 자동 재검증·실제 2인 Discord 통화와 관리자 권한이 필요한 백업 파일 직접 검사는 수행하지 않았다.

## 2026-10-05 커밋·푸시 전 검증

카카오 로그인, Discord 서버 소유자 참가 허용, 1인·2인 샘플, 운영 설정을 포함한 변경사항 전체를 커밋하기 전에 다시 검증했다. Java 21.0.12.1, Node.js 24.14.1, npm 11.11.0과 기존에 빌드한 PostgreSQL 17.11을 사용했다.

- 새로운 loopback PostgreSQL 인스턴스에 단위·통합 검증용 DB와 E2E용 DB를 별도로 생성했다. 백엔드 `bash gradlew --offline --no-daemon test bootJar --rerun-tasks`: **98개 통과, 실패·오류·건너뜀 0개**, JAR 빌드 성공이다. Docker 소켓 접근 권한이 없어 Testcontainers의 컨테이너 기동 경로는 이번 검증에 포함하지 않았다.
- 프런트 ESLint·TypeScript/Vite 빌드·Vitest 단위 테스트 **26개**가 통과했다. 저장된 OpenAPI와 격리 Java 서버의 OpenAPI를 각각 사용한 생성 타입 차이 검사도 통과했다.
- 격리 API·프런트 서버에서 Chromium Playwright 전체 **15개가 한 번의 실행으로 통과(3.9분)**했다. 실제 로컬 API를 사용하는 4인 게임·복구·매칭·권한·초대 및 1인·2인 게임 검사 6개와 모의 인증 응답을 사용하는 카카오 화면 검사 9개다.
- 공개 프런트 자산 3개와 격리 서버 로그 1개를 전체 작품의 비공개 본문 62개와 대조했으며 일치 0건이다. 변경 파일에서 실제 환경 파일의 포함 여부와 비밀키·토큰 형식을 점검했고 노출을 발견하지 못했다.
- 운영 예제 환경 파일을 지정한 Compose 병합 설정 검사, 배포·백업·갱신 hook의 셸 문법 검사와 `git diff --check`가 통과했다.

증거는 `.tools/push-verification/`의 로그·OpenAPI·`result.json`, 백엔드 HTML 테스트 보고서, 프런트 Playwright 보고서에 보관한다. 검증 후 격리 Java·프런트·PostgreSQL 프로세스를 종료했다. 실제 카카오 외부 인증과 Discord 통화, 운영 배포는 이번 검증에서 실행하지 않았다.
