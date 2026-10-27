![Mystery Mango — 추리와 보드게임을 만들고 함께 플레이하는 공간](../docs/images/readme-banner.png)

# Mystery Mango · 프런트엔드

작품을 찾고 함께 플레이하는 화면부터 나만의 게임을 만드는 스튜디오까지 담당하는 React 애플리케이션입니다. 프로젝트 소개와 화면은 [루트 README](../README.md), 기능별 정책과 운영 안내는 [문서 허브](../docs/README.md)에서 확인할 수 있습니다.

[프로젝트 소개](../README.md) · [화면과 Figma](../docs/screens.md) · [문서 허브](../docs/README.md) · [제작 화면 안내](../docs/studio-ui.md) · [운영 배포](../docs/deployment.md) · [검증 기록](../docs/verification.md)

## 목차

[프로그램 소개](#프로그램-소개) · [프로젝트 구성](#프로젝트-구성) · [활용 기술 스택](#기술-스택) · [환경 설정 및 실행](#실행) · [URL 규칙](#url과-api-규칙) · [API 문서](#-api-문서) · [배포 문서](#-배포-문서) · [화면과 동작 정책](#화면과-동작-정책) · [검증](#검증) · [관련 문서](#관련-문서)

<a id="프로그램-소개"></a>

## 🥭 프로그램 소개

플레이어는 작품 탐색·모집방·매칭·게임·플레이 기록으로 이어지는 화면을 이용합니다. 창작자는 템플릿을 고르고 카드·게임판·이야기를 편집한 뒤 시험과 공개 검수를 진행합니다. 게임 규칙과 자료 열람 권한은 Java 서버가 판단하며 프런트는 허용된 응답을 표시합니다.

<a id="프로젝트-구성"></a>

## 📁 프로젝트 구성

| 경로 | 역할 |
| --- | --- |
| [`src/App.tsx`](src/App.tsx) | 화면 경로·로그인·관리자 접근과 공통 레이아웃 |
| [`src/pages/`](src/pages/) | 홈·인증·탐색·모집·게임·계정 화면 |
| [`src/studio/`](src/studio/) | 템플릿·제작 작업실·시험·검수 화면 |
| [`src/components/`](src/components/) | 공통 UI·아이콘·게임 그림 |
| [`src/hooks/`](src/hooks/) · [`src/services/`](src/services/) | 명령·이벤트 처리와 API 통신 |
| [`src/common/`](src/common/) · [`src/styles/`](src/styles/) | 공통 계약 타입과 사이트 스타일 |
| [`public/fonts/`](public/fonts/) | 자체 호스팅 글꼴과 라이선스 |
| [`e2e/`](e2e/) · [`scripts/`](scripts/) | 브라우저 검증과 API 타입 생성 도구 |

익숙한 저장소 관례에 맞춰 SCSS Modules, 기능별 pages/hooks/services, `~/` 경로 별칭, 엄격한 TypeScript, 작은 AGENTS 진입점과 집중 테스트를 사용합니다. 빌드 결과물 `dist/`, 의존성, 테스트 캡처를 소스처럼 수정하지 마세요.

<a id="기술-스택"></a>

## 🛠️ 활용 기술 스택

![React 19.2.5](https://img.shields.io/badge/React-19.2.5-149ECA?style=for-the-badge&logo=react&logoColor=white)
![TypeScript 5.9.3](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite 8.0.16](https://img.shields.io/badge/Vite-8.0.16-646CFF?style=for-the-badge&logo=vite&logoColor=white)

![SCSS Modules](https://img.shields.io/badge/SCSS-Modules-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![Konva 10.2.0](https://img.shields.io/badge/Konva-10.2.0-0D83CD?style=for-the-badge)
![Playwright 1.58.2](https://img.shields.io/badge/Playwright-1.58.2-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

React 19.2.5 · TypeScript 5.9.3 · Vite 8.0.16. npm과 package-lock.json으로 설치를 재현합니다. Node.js 22.12 이상이 필요합니다. 이 저장소에서 확인한 로컬 런타임은 Node 22.22입니다.

### 글꼴과 스타일

화면 글꼴은 `public/fonts/`에 포함한 Pretendard v1.3.9를 같은 출처에서 불러옵니다. 가변 굵기와 `font-display: swap`을 사용하며 원본 라이선스를 동봉합니다. 상세 출처는 [글꼴 안내](public/fonts/README.md)를 확인하세요. 작가가 작성한 캔버스·카드의 기존 글꼴 지정은 유지합니다. 스튜디오 홈, 편집 상단, 편집 패널의 시각 스타일은 각각 `studio-home.module.scss`, `editor-chrome.module.scss`, `workspace-polish.module.scss`에서 관리합니다.

사이트와 스튜디오의 로고, 브라우저 파비콘은 [망고 탐정 이미지](public/images/mango-detective.png)를 공유합니다. 투명 배경과 정사각 비율을 유지하며, 생성 출처와 교체 기준은 [이미지 문서](../docs/images/README.md#사이트-로고)에 기록합니다.

<a id="실행"></a>

## ⚙️ 환경 설정 및 실행

`frontend/` 폴더에서 실행합니다. 전체 구성과 백엔드 실행은 [루트 README](../README.md)를 따릅니다.

```powershell
npm.cmd ci
npm.cmd run dev
```

Java 서버를 먼저 `localhost:8081`에서 실행하세요. Vite는 `/api`·`/swagger-ui`·`/ws`를 같은 출처 프록시로 전달합니다. 서버 주소를 바꾸려면 실행 전 `VITE_API_PROXY_TARGET` 환경변수를 설정합니다. 운영 환경도 `/api`·`/ws`와 SPA가 같은 출처여야 하며 WebSocket upgrade를 전달해야 합니다. 루트 실행 절차는 상위 README를 확인하세요.

<a id="url과-api-규칙"></a>

## 🔗 URL 규칙

### 화면 주소

| 경로 | 화면과 접근 범위 |
| --- | --- |
| `/` | 공개 홈페이지 |
| `/scenarios` · `/scenarios/:id` | 공개 작품 탐색과 작품 소개 |
| `/rooms` · `/rooms/:id` | 공개 모집 목록과 로그인 후 참가 권한을 확인하는 대기실 |
| `/login` · `/register` | 서버의 인증 제공자 설정을 따르는 로그인·가입 |
| `/match` · `/games/:id` | 로그인 후 매칭과 실제 참가자의 게임 화면 |
| `/account` | 로그인한 사용자의 플레이 기록·Discord 연결·차단·신고 |
| `/studio` · `/studio/:id` · `/studio/sandboxes/:id` | 제작 목록·소유 작품 편집·권한이 있는 시험 화면 |
| `/admin` · `/admin/reviews/:id` | 관리자 전용 작품·신고·검수 화면 |

## 🔌 API 문서

### API 계약과 생성 타입

Java API의 OpenAPI에서 타입을 생성하려면 서버 실행 후 `npm.cmd run generate:api`를 사용합니다. `npm.cmd run check:api`는 파일을 수정하지 않고 서버 명세와 생성된 타입의 차이를 검증합니다. 기본 주소는 `http://localhost:8081/api/openapi`이며 `API_SCHEMA_URL`로 변경할 수 있습니다. `src/common/api.generated.ts`는 직접 편집하지 않습니다.

## 🚀 배포 문서

| 문서 | 확인할 내용 |
| --- | --- |
| [운영 배포](../docs/deployment.md) | 동일 출처 프록시·HTTPS·배포·백업 |
| [계정 연결 설정](../docs/account-connections.md) | 운영 카카오 로그인·Discord 연결 |
| [검증 기록](../docs/verification.md) | 실제 실행 결과와 운영 반영 여부 |

<a id="화면과-동작-정책"></a>

## 📐 화면과 동작 정책

### 작품 탐색·모집·매칭

작품 카드의 인원과 대기실의 정원은 서버 응답을 표시합니다. 작품 목록의 인원 필터는 서버가 페이지를 나누기 전에 적용하며, 방의 대화 방식도 작품이 허용한 모드만 선택할 수 있습니다. 머더미스터리 자동 매칭은 기존 4인 후보 투표를 유지하며, 보드게임은 공개 버전·2~4인 정원·대화 방식이 같은 참가자를 연결합니다. 1인 게임은 직접 방을 만듭니다.

### 제작 작업실

제작 작업실은 자유 테이블 배치, 머더미스터리 이야기 흐름, 자동 규칙 게임 디자인으로 나뉩니다. 여섯 유형의 기본 템플릿과 빈 템플릿을 고르고 제목 입력창에서 작품을 만듭니다. 빈 템플릿 여부와 초기 내용은 Java가 결정하며 자동 게임의 규칙은 유지됩니다. 카드 앞뒷면과 장면은 같은 초안 변경 경로로 저장합니다. 1,200px 이상은 구성·작업·속성 3열, 801~1,199px은 작업 화면과 선택한 보조 패널의 2열, 800px 이하는 패널 전환과 문구·색상·이미지 수정 중심입니다. 세로형 카드는 화면의 폭과 높이에 맞춰 가운데 표시합니다.

### 로그인

로그인 화면은 `/api/v1/auth/providers`의 설정을 따라 카카오 로그인과 이메일 폼을 표시합니다. `localLoginEnabled=false`이면 가입·로그인 모두 카카오 버튼만 제공하며, 처음 로그인한 사용자의 가입은 서버가 처리합니다. 카카오 인증 시작은 CSRF를 포함한 명령 요청을 사용하고 공식 HTTPS 인증 주소만 열며 취소·만료·실패를 한국어로 안내합니다. 이메일이 없는 계정도 서재를 이용할 수 있습니다.

### 개인 자료와 연결 복구

프런트는 서버가 허용한 개인 자료와 현재 보이는 카드 면만 표시합니다. 참가자의 게임 비밀 정보를 localStorage에 저장하지 않습니다. 작가가 직접 편집하는 초안은 저장 실패에 대비해 해당 브라우저의 복구 사본으로 보존합니다. 변경 명령은 서버에서 받은 CSRF 토큰과 멱등성 키를 전송하며, 실패한 동일 명령을 재시도할 때 키를 유지합니다. STOMP `/user/queue/events`는 캐시 무효화 신호로만 사용하고, 15초 주기·화면 복귀·연결 복구 시 최신 권한별 상태를 다시 가져옵니다. 보호 API에서 세션 만료 응답을 받으면 개인 캐시를 비우고 실시간 연결을 닫으며 로그인 화면으로 이동합니다. 초대 토큰은 브라우저 난수로 만들고 새로고침 후 원문을 복원하지 않습니다.

### Discord 음성

Discord 미설정 시 텍스트 게임을 이용합니다. 계정 연결과 봇 설정이 있어도 실제 4인 음성, 방 분리, 퇴장과 재입장 차단은 실제 Discord 환경에서 따로 검증해야 합니다. 웹은 마이크를 직접 제어하거나 음성 연결 성공을 가장하지 않습니다.

<a id="검증"></a>

## 🧪 검증

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

### 실제 API를 사용하는 플랫폼 검증

플랫폼 E2E는 실제 Java 서버와 PostgreSQL을 사용합니다. 서버를 e2e 프로필, 짧은 단계 시간(`GAME_PHASE_SECONDS`)으로 실행한 뒤 사용하세요. 각 테스트는 새 계정을 생성하고 필요한 인원만큼 독립된 BrowserContext를 만듭니다. 6개 흐름에서 1·2·4인 작품의 역할 배정·비밀 격리·조사·투표·엔딩, 인원 필터와 정원에 맞춘 시작, 조사 멱등성·새로고침/8.5초 네트워크 단절 복구, Tab/Enter 준비와 게임 시작, 4인 자동 매칭, 비참가자 접근 거부, 초대 토큰 교체, API 로그아웃 후 개인 화면 제거를 검증합니다. `E2E_BASE_URL`이 없으면 개발 프런트 서버를 자동 실행합니다. 외부 서버를 검증할 때는 해당 주소를 지정하세요. 테스트는 실제 DB에 개발 계정과 플레이 기록을 남기므로 전용 개발 DB에서 실행합니다.

### 제작 작업실과 반응형 검증

`e2e/studio-workspace.spec.ts`는 카드 제작→덱 연결→배치→저장→시험 복귀와 역할 자료·단서 연결을, `e2e/studio-blank.spec.ts`는 빈 작품 생성·첫 구성물 추가·미완성 검증·자동 게임 시험과 패널 겹침 방지를 검사합니다. `e2e/responsive.spec.ts`는 다섯 화면 폭의 공개 탐색과 모바일 메뉴를, `e2e/play-layout.spec.ts`는 실제 게임판과 자료·대화·점수판의 모바일 배치를 검사합니다. 상세 계약은 [제작 작업실 안내](../docs/studio-ui.md)를 확인하세요.

### 카카오 로그인 화면 검증

카카오 버튼은 [공식 디자인 가이드](https://developers.kakao.com/docs/ko/kakaologin/design-guide)에 따라 [공식 리소스](https://developers.kakao.com/tool/resource/login)의 한국어 완성형 이미지를 사용합니다. `e2e/auth.spec.ts`는 API 응답과 외부 페이지 이동을 가로채 화면 상태·CSRF·주소 검증을 확인하는 UI 테스트입니다. 이 테스트의 통과는 실제 카카오 계정 인증이나 외부 콜백 성공을 검증했다는 뜻이 아닙니다.

<a id="관련-문서"></a>

## 📚 관련 문서

| 문서 | 확인할 내용 |
| --- | --- |
| [프로젝트 README](../README.md) | 서비스 소개·전체 실행·환경 변수 |
| [화면과 Figma 문서](../docs/screens.md) | 화면 이미지·프로토타입·갱신 기준 |
| [문서 허브](../docs/README.md) | 기능별 안내와 설계·운영 문서 |
| [제작 스튜디오](../docs/studio.md) | 초안·파일·시험·버전·검수 계약 |
| [제작 화면과 반응형](../docs/studio-ui.md) | 작업실 구성·카드 디자인·PC와 모바일 동작 |
| [게임·권한 정책](../docs/policies.md) | 모집·매칭·개인 자료·게임 복구 |
| [아키텍처](../docs/architecture.md) | Java 서버·PostgreSQL·실시간 알림의 경계 |
| [저장된 OpenAPI](../docs/openapi.json) | API 요청·응답 명세 |
| [운영 배포](../docs/deployment.md) | 동일 출처 프록시·HTTPS·배포·백업 |
| [검증 기록](../docs/verification.md) | 실제 실행 결과와 외부 검증 범위 |
