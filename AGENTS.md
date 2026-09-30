# 작업 규칙

- 사용자 소통과 운영 문서는 한국어로 작성한다.
- 백엔드 업무·권한·매칭·게임 규칙은 Java에 둔다. 프런트나 Discord 봇에 별도 게임 규칙을 복제하지 않는다.
- 먼저 README와 docs/README.md, 변경 영역의 정책을 확인한다. 관련 없는 기존 변경을 되돌리지 않는다.
- DB는 PostgreSQL/Flyway가 기준이다. JPA ddl-auto를 update/create로 바꾸거나 H2로 무결성 검증을 대체하지 않는다.
- 모든 업무 변경은 Commands 트랜잭션 잠금 아래 처리한다. PostgreSQL 무결성 테스트를 함께 확인한다.
- 공개 DTO와 개인 자료를 분리한다. 원본 작품·JPA Entity를 응답에 반환하지 않는다.
- 환경 변수·공개 계약을 바꾸면 예제·문서·OpenAPI·생성 타입·관련 테스트를 함께 갱신한다.
- backend Gradle test/bootJar, frontend lint/build/test와 관련 E2E를 실행한다. 실제 환경이 없으면 미실행으로 기록한다.
- 외부 Discord 실통화를 mock 성공으로 대체해 완료 처리하지 않는다. 봇 토큰이나 실제 .env는 읽어 출력하거나 커밋하지 않는다.
- Windows 명령은 PowerShell과 npm.cmd를 우선한다. 운영 환경 변경·공개 배포는 별도 요청 범위를 확인한다.

