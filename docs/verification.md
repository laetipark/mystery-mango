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
