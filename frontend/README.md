# 미스터리 망고 프런트엔드

React 19.2.5 · TypeScript 5.9.3 · Vite 8.0.8. npm과 package-lock.json으로 설치를 재현합니다. Node.js 22.12 이상이 필요합니다. 이 저장소에서 확인한 로컬 런타임은 Node 22.22입니다.

```powershell
npm.cmd ci
npm.cmd run dev
```

Java 서버를 먼저 `localhost:8081`에서 실행하세요. Vite는 `/api`·`/swagger-ui`·`/ws`를 같은 출처 프록시로 전달합니다. 서버 주소를 바꾸려면 실행 전 `VITE_API_PROXY_TARGET` 환경변수를 설정합니다. 운영 환경도 `/api`·`/ws`와 SPA가 같은 출처여야 하며 WebSocket upgrade를 전달해야 합니다. 루트 실행 절차는 상위 README를 확인하세요.

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Java API의 OpenAPI에서 타입을 생성하려면 서버 실행 후 `npm.cmd run generate:api`를 사용합니다. `npm.cmd run check:api`는 파일을 수정하지 않고 서버 명세와 생성된 타입의 차이를 검증합니다. 기본 주소는 `http://localhost:8081/api/openapi`이며 `API_SCHEMA_URL`로 변경할 수 있습니다. `src/common/api.generated.ts`는 직접 편집하지 않습니다.

E2E는 실제 Java 서버와 PostgreSQL을 사용합니다. 서버를 e2e 프로필, 짧은 단계 시간(`GAME_PHASE_SECONDS`)으로 실행한 뒤 사용하세요. 각 테스트는 새 계정을 생성하고 각각 독립된 3~5개 BrowserContext를 만듭니다. 4개 시나리오에서 역할 배정·비밀 격리·조사 멱등성·새로고침/8.5초 네트워크 단절 복구·투표·엔딩, Tab/Enter 준비와 게임 시작, 자동 매칭, 비참가자 접근 거부, 초대 토큰 생성/교체/이전 링크 거부, API 로그아웃 후 개인 화면 제거를 검증합니다. `E2E_BASE_URL`이 없으면 개발 프런트 서버를 자동 실행합니다. 외부 서버를 검증할 때는 해당 주소를 지정하세요. 테스트는 실제 DB에 개발 계정과 플레이 기록을 남기므로 전용 개발 DB에서 실행합니다.

프런트는 서버가 허용한 개인 자료만 표시합니다. 비밀 정보를 localStorage에 저장하지 않습니다. 변경 명령은 서버에서 받은 CSRF 토큰과 멱등성 키를 전송하며, 실패한 동일 명령을 재시도할 때 키를 유지합니다. STOMP `/user/queue/events`는 캐시 무효화 신호로만 사용하고, 15초 주기·화면 복귀·연결 복구 시 최신 권한별 상태를 다시 가져옵니다. 보호 API에서 세션 만료 응답을 받으면 개인 캐시를 비우고 실시간 연결을 닫으며 로그인 화면으로 이동합니다. 초대 토큰은 브라우저 난수로 만들고 새로고침 후 원문을 복원하지 않습니다.

Discord 미설정 시 텍스트 게임을 이용합니다. 계정 연결과 봇 설정이 있어도 실제 4인 음성, 방 분리, 퇴장과 재입장 차단은 실제 Discord 환경에서 따로 검증해야 합니다. 웹은 마이크를 직접 제어하거나 음성 연결 성공을 가장하지 않습니다.

익숙한 저장소 관례에 맞춰 SCSS Modules, 기능별 pages/hooks/services, `~/` 경로 별칭, 엄격한 TypeScript, 작은 AGENTS 진입점과 집중 테스트를 사용합니다. 빌드 결과물 `dist/`, 의존성, 테스트 캡처를 소스처럼 수정하지 마세요.
