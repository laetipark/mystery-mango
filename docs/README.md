# 문서 안내

| 문서 | 책임 |
| --- | --- |
| [루트 README](../README.md) | 준비·실행·테스트·환경 변수 |
| [운영 배포](deployment.md) | mystery.laetipark.me 서버·DNS·HTTPS·백업 |
| [계정 연결 설정](account-connections.md) | 기존 카카오 앱·Discord 봇 연결, 키 입력, 운영 전환 |
| [아키텍처](architecture.md) | 구성·DB 모델·동시성 선택과 한계 |
| [정책](policies.md) | 상태 전이·접근 권한·매칭·복구 |
| [작품 정의](scenarios.md) | JSON 구조·검증·샘플 작품 |
| [Discord](discord.md) | OAuth·봇 설치·권한·실통화 점검 |
| [검증 기록](verification.md) | 구현 상태와 실제 실행 결과 |

API 명세는 서버 `/api/openapi`와 저장된 `openapi.json`으로 제공한다. 타입은 이 명세에서 생성하고 차이를 검증한다.
