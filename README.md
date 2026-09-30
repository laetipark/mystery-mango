# Mystery Mango · 미스터리 망고

Java 서버를 통해 4명이 작품을 고르거나 자동 매칭하고, 역할별 자료·조사·밀담·투표·엔딩까지 진행하는 한국어 머더미스터리 플랫폼입니다. 음성은 전용 Discord 서버와 관리 봇에 맡기며 게임 데이터는 웹에 보관합니다.

## 실행

Docker Desktop의 Linux 엔진과 Docker Compose가 필요합니다. 전체 실행에는 호스트 JDK나 Node.js가 필요하지 않습니다.

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

Linux/macOS에서는 첫 줄 대신 `cp .env.example .env`를 사용합니다. [앱 열기](http://localhost:8080), [OpenAPI](http://localhost:8080/api/openapi), [Swagger UI](http://localhost:8080/api/docs).

최초 실행은 공식 이미지와 의존성을 내려받고 Flyway가 빈 DB를 구성합니다. 직접 작성한 작품 3개는 자동 등록됩니다. 상태 확인은 `docker compose ps`, 로그는 `docker compose logs backend`를 사용합니다. `docker compose down`은 DB 볼륨을 보존합니다.

기본 `dev` 프로필에서는 다음 개발 계정을 생성합니다. 일반 회원가입도 동작합니다.

| 계정 | 비밀번호 | 권한 |
| --- | --- | --- |
| `player1@example.test` ~ `player8@example.test` | `MangoDev!2026` | 일반 사용자 |
| `admin@example.test` | `MangoDev!2026` | 작품 등록·검증·공개, 신고 조회 |

수동으로 4인 플레이를 확인하려면 서로 독립된 브라우저 프로필 4개에서 각각 로그인합니다. 작품 선택 → 모집방 생성·참가 → 전원 준비 → 방장 시작 순서로 진행합니다. 같은 브라우저 프로필의 일반 탭은 로그인 상태를 공유합니다. 자동 매칭도 실제 독립 계정 4개가 필요합니다.

개발 계정은 `dev`/`e2e` 프로필에서만 생성합니다. 배포 환경에서는 `SPRING_PROFILES_ACTIVE=prod`, 새로운 DB 비밀번호, HTTPS와 `COOKIE_SECURE=true`, 정확한 `APP_ORIGINS`를 사용합니다. 이미 개발 계정이 생성된 DB를 운영 DB로 재사용하지 않습니다. 최초 운영 관리자는 신뢰된 운영자가 DB의 기존 사용자 `admin` 속성으로 지정합니다.

## 화면 개발

Node.js 22.22.0과 npm을 사용합니다. Windows에서는 실행 정책 충돌을 피하려고 `npm.cmd`를 사용할 수 있습니다.

```powershell
docker compose up --build -d db backend
npm.cmd --prefix frontend ci
npm.cmd run dev:web
```

[개발 화면](http://127.0.0.1:5173)은 `/api`·`/ws`를 백엔드 `http://127.0.0.1:8081`로 전달합니다. `VITE_API_PROXY_TARGET`으로 대상 주소를 바꿀 수 있습니다. Java 코드를 바꾸면 `docker compose up --build -d backend`로 다시 빌드합니다.

JDK 21이 있는 경우 PostgreSQL만 Compose에서 실행하고 `backend` 폴더에서 `./gradlew.bat bootRun` 또는 `./gradlew bootRun`을 사용할 수 있습니다. 로컬 백엔드 기본 포트는 8080이므로 `PORT=8081` 환경 변수를 지정하거나 프런트의 프록시 대상도 맞춥니다. Gradle은 전역 설치 없이 Wrapper를 사용합니다.

## 검증

JDK 21과 Docker가 준비된 환경에서:

```powershell
cd backend
.\gradlew.bat test bootJar
cd ..
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend test
```

통합 테스트는 실제 PostgreSQL 17.11을 사용합니다. 기본은 Testcontainers이며 Docker가 없다고 테스트를 건너뛰지 않습니다. 별도의 **폐기 가능한 테스트 DB**가 있으면 `TEST_DATABASE_URL`, `TEST_DATABASE_USER`, `TEST_DATABASE_PASSWORD`를 지정할 수 있습니다. 테스트는 테스트 데이터를 생성·변경하므로 운영 DB를 지정하지 않습니다.

브라우저 테스트에는 실행 중인 서버와 Chromium이 필요합니다. `.env`에서 `SPRING_PROFILES_ACTIVE=e2e`, `GAME_PHASE_SECONDS=12`, `MATCH_VOTE_SECONDS=8`을 설정하고 서버를 다시 시작합니다.

```powershell
npm.cmd --prefix frontend exec -- playwright install chromium
npm.cmd --prefix frontend run test:e2e
```

Playwright가 개발 화면을 실행하고 독립 로그인 컨텍스트 4개로 게임과 매칭을 검사합니다. 테스트 뒤 일반 플레이에는 `GAME_PHASE_SECONDS=0`, `MATCH_VOTE_SECONDS=60`, `SPRING_PROFILES_ACTIVE=dev`로 복원합니다. [검증 기록과 남은 한계](docs/verification.md)를 확인하세요.

## 계약과 설정

OpenAPI는 실행 중인 Java API의 `/api/openapi`에서 제공합니다. 프런트 계약 타입 갱신은 `npm --prefix frontend run generate:api`, 차이 검사는 `npm --prefix frontend run check:api`로 수행합니다. `API_SCHEMA_URL`로 명세 URL을 바꿀 수 있습니다.

| 설정 | 기본값·역할 |
| --- | --- |
| `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` | JDBC 연결; Compose가 내부 DB 주소를 주입 |
| `SPRING_PROFILES_ACTIVE` | `dev`; 개발 계정 생성은 dev/e2e만 |
| `VOICE_PROVIDER` | `disabled`; 설정 완료 시 `discord` |
| `GAME_PHASE_SECONDS` | `0`: 작품 정의 사용, 양수: 검증용 단계 시간 |
| `MATCH_ACCEPT_SECONDS`, `MATCH_VOTE_SECONDS` | 30초, 60초 |
| `DISCONNECT_GRACE_SECONDS` | 120초 |
| `ABANDON_SECONDS`, `EMPTY_GAME_ABORT_SECONDS` | 300초, 1800초 |
| `APP_ORIGINS`, `COOKIE_SECURE` | 허용 웹 출처·HTTPS 쿠키 정책 |

Discord가 미설정이면 텍스트 플레이가 정상 동작하며 음성 모집은 비활성화됩니다. 봇과 OAuth 설정, 서버 최소 권한, 실제 통화 점검은 [Discord 안내](docs/discord.md)를 따릅니다. API 키·봇 토큰·운영 비밀번호는 커밋하지 않습니다.

## 구성과 고정 버전

- 백엔드: Java 21, Spring Boot 4.1.1, Gradle 8.14.4, PostgreSQL 17.11, springdoc 3.1.1, JDA 6.7.0. Spring 계열·Flyway·JUnit·Testcontainers는 Boot BOM을 따릅니다.
- 프런트: React 19.2.5, TypeScript 5.9.3, Vite 8.0.8, SCSS Modules, TanStack Query, npm lockfile.
- Docker 기본 이미지 5종은 공식 레지스트리 digest로 고정했습니다. Gradle 배포 ZIP의 SHA-256도 검증합니다.
- `backend/`: 모듈형 Java 모놀리스, 마이그레이션, 서버 전용 작품 정의, 테스트.
- `frontend/`: 실제 API를 사용하는 웹 화면과 브라우저 테스트.
- `infra/`: 정적 프런트 빌드와 동일 출처 Nginx 프록시.
- `docs/`: 데이터 모델, 권한·복구 정책, 작품 형식, Discord, 검증 결과.

[문서 안내](docs/README.md) · [아키텍처와 ERD](docs/architecture.md) · [게임·권한 정책](docs/policies.md) · [작품 형식](docs/scenarios.md)
