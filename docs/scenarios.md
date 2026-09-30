# 작품 JSON v1

작품은 서버 리소스에서 최초 적재하거나 관리자 화면에서 JSON을 등록한다. 화면에 내려가는 공개 정보는 별도 허용 목록 DTO이며 원본 정의를 반환하지 않는다.

필수 구조는 `schemaVersion`, `slug`, 공개 메타데이터, `playerCount`, `roles`, `phases`, `targets`, `clues`, `ballot`, `endings`, `rules`다. 실제 예시는 backend의 scenarios 리소스 3개가 기준이다. 공개 버전은 불변이며 편집은 새 초안 버전으로 등록한다.

- 역할: 고유 id, 공개 소개, secret, objective.text와 선언형 condition.
- 단계: 고유 id, kind, durationSeconds, actions, publicText, investigationLimit. 같은 kind의 단계가 여러 번 올 수 있다.
- 조사 대상: 고유 id, 이름, 조사 가능한 phaseIds, 지급할 clueIds.
- 단서: 고유 id, 제목·본문, PRIVATE/PUBLIC/PUBLIC_AND_WHISPER 공유 정책.
- 투표: 작품에 정의한 범인 역할, 변경·기권 허용, NO_ACCUSATION 동률 정책.
- 엔딩: 고유 id, 제목·본문·condition. 마지막 ALWAYS 엔딩이 모든 미해결 분기를 닫는다.
- 규칙: PHASE_STARTED/CLUE_PUBLISHED/BALLOT_CLOSED 발생 시 GRANT_CLUE/PUBLISH_MATERIAL/SET_FLAG만 실행한다.

조건은 ALWAYS, CULPRIT_IDENTIFIED, CLUE_PUBLIC, HAS_CLUE, FLAG, NOT, ALL, ANY만 허용한다. 참조 ID·종류·중복·개수·깊이를 검증한다. 효과가 트리거 이벤트를 다시 발행하지 않아 순환을 만들 수 없으며 원인+규칙 실행 이력과 실행 상한으로 재실행도 제한한다. JavaScript·SpEL·SQL 실행은 없다.

샘플 작품 3개는 직접 작성했으며 각 4역할·8단서·7단계·2엔딩을 포함한다. 작품 카드의 소요 시간은 플레이테스트로 보증한 시간이 아닌 추정값이다. Java 게임 엔진에는 특정 작품 이름·범인·단서 ID가 없다.

