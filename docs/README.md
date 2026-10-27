![Mystery Mango — 추리와 보드게임을 만들고 함께 플레이하는 공간](images/readme-banner.png)

# Mystery Mango · 문서 허브

프로젝트 소개와 화면은 [루트 README](../README.md)에서, 기능별 계약과 운영 절차는 이 문서 허브에서 확인하세요. 플레이·창작 흐름부터 데이터 모델과 실제 검증 기록까지 목적에 맞게 찾아볼 수 있습니다.

[프로젝트 소개](../README.md) · [주요 화면과 Figma](screens.md) · [프런트엔드 안내](../frontend/README.md) · [제작 스튜디오](studio.md) · [운영 배포](deployment.md) · [검증 기록](verification.md)

## 목차

[시작하기](#시작하기) · [문서 목록](#문서-목록) · [API와 공개 계약](#api와-공개-계약) · [구현과 검증 확인](#구현과-검증-확인)

<a id="시작하기"></a>

## 🧭 시작하기

| 하고 싶은 일 | 먼저 읽을 문서 | 이어서 확인할 내용 |
| --- | --- | --- |
| 프로젝트를 이해하고 실행하기 | [루트 README](../README.md) | 준비·실행·테스트·환경 변수 |
| 실제 화면과 이용 흐름 보기 | [화면과 Figma 문서](screens.md) | 홈·매칭·제작·공개 준비와 클릭 프로토타입 |
| 웹 화면 개발하기 | [프런트엔드 안내](../frontend/README.md) | 구성·화면 주소·API 타입·브라우저 검증 |
| 나만의 작품 만들기 | [제작 스튜디오](studio.md) | [작업실과 반응형 화면](studio-ui.md) · [작품 형식](scenarios.md) |
| 게임 진행과 권한 이해하기 | [상태 전이와 권한](policies.md) | [아키텍처와 데이터 모델](architecture.md) · [고전 게임 규칙](classic-games.md) |
| 카카오·Discord 연결하기 | [계정 연결 설정](account-connections.md) | [Discord OAuth·봇·실통화 점검](discord.md) |
| 운영 서버 관리하기 | [운영 배포](deployment.md) | HTTPS·백업과 [실제 검증 기록](verification.md) |

<a id="문서-목록"></a>

## 📚 문서 목록

| 문서 | 책임 |
| --- | --- |
| [루트 README](../README.md) | 준비·실행·테스트·환경 변수 |
| [화면과 Figma 문서](screens.md) | 주요 화면·프로토타입·이미지 기준과 갱신 |
| [운영 배포](deployment.md) | mystery.laetipark.me 서버·DNS·HTTPS·백업 |
| [계정 연결 설정](account-connections.md) | 기존 카카오 앱·Discord 봇 연결, 키 입력, 운영 전환 |
| [아키텍처](architecture.md) | 구성·DB 모델·동시성 선택과 한계 |
| [정책](policies.md) | 상태 전이·접근 권한·매칭·복구 |
| [제작 스튜디오](studio.md) | 초안·캔버스·게임 유형·시험·검수·파일 권한 |
| [제작 화면과 반응형](studio-ui.md) | 참고 UI·통합 작업실·카드 디자인·PC와 모바일 구성 |
| [클래식 보드게임](classic-games.md) | 자유 오목·리버시·체커의 채택 규칙과 자료 제작 기준 |
| [작품 정의](scenarios.md) | JSON 구조·검증·샘플 작품 |
| [Discord](discord.md) | OAuth·봇 설치·권한·실통화 점검 |
| [검증 기록](verification.md) | 구현 상태와 실제 실행 결과 |

<a id="api와-공개-계약"></a>

## 🔌 API와 공개 계약

API 명세는 서버 `/api/openapi`와 저장된 `openapi.json`으로 제공한다. 타입은 이 명세에서 생성하고 차이를 검증한다.

| 자료 | 역할 |
| --- | --- |
| [저장된 OpenAPI](openapi.json) | API 요청·응답의 공개 명세 |
| [프런트 생성 타입](../frontend/src/common/api.generated.ts) | OpenAPI에서 생성한 TypeScript 계약 |
| [프런트엔드 안내](../frontend/README.md#api-계약과-생성-타입) | 타입 생성·차이 검사 명령과 개발 서버 주소 |
| [작품 정의](scenarios.md) | 작품 JSON 구조·검증·예제 |

<a id="구현과-검증-확인"></a>

## 🧪 구현과 검증 확인

현재 구현과 실제 실행 결과, 로컬 작업과 운영 반영 여부는 [검증 기록](verification.md)에서 구분해 확인합니다. 게임·자료 접근의 기준은 [정책](policies.md), 서버와 데이터 처리의 책임은 [아키텍처](architecture.md)를 따릅니다.
