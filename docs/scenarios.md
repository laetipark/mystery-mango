# 작품 JSON v1

일반 작가는 [제작 스튜디오](studio.md)에서 작품을 만들고 검수 승인을 받아 공개한다. 소유자가 없는 기존 시스템 작품은 서버 리소스 또는 관리자 JSON 등록 경로로 관리한다. 화면에 내려가는 공개 정보는 별도 허용 목록 DTO이며 원본 정의를 반환하지 않는다.

필수 구조는 `schemaVersion`, `slug`, 공개 메타데이터, `playerCount`, `roles`, `phases`, `targets`, `clues`, `ballot`, `endings`, `rules`다. 머더미스터리 예시는 backend의 scenarios 리소스 5개가 기준이다. 공개 버전은 불변이며 편집은 새 초안 버전으로 등록한다. `playerCount`는 1~4명이고 역할 수와 같아야 한다. 이 제약은 머더미스터리에 적용한다. 보드게임은 `gameType`, `engineId`, `supportedPlayerCounts`를 사용하고 역할·범인 투표가 필요하지 않다.

공개 목록 API `/api/v1/scenarios`는 선택적 `playerCount` 필터(1~4)를 지원한다. 예를 들어 `?playerCount=1`은 1인을 지원하는 작품을 반환하고, 생략하면 모든 인원을 반환한다. `gameType=MURDER_MYSTERY|TABLETOP|YACHT|GOMOKU|REVERSI|CHECKERS` 필터도 지원한다. 장르·난이도·시간 조건과 함께 적용할 수 있으며 페이지의 `total`은 필터 적용 후의 작품 수다.

- 역할: 고유 id, 공개 소개, secret, objective.text와 선언형 condition.
- 단계: 고유 id, kind, durationSeconds, actions, publicText, investigationLimit. 같은 kind의 단계가 여러 번 올 수 있다.
- 조사 대상: 고유 id, 이름, 조사 가능한 phaseIds, 지급할 clueIds.
- 단서: 고유 id, 제목·본문, PRIVATE/PUBLIC/PUBLIC_AND_WHISPER 공유 정책.
- 투표: 작품에 정의한 범인 역할, 변경·기권 허용, NO_ACCUSATION 동률 정책.
- 엔딩: 고유 id, 제목·본문·condition. 마지막 ALWAYS 엔딩이 모든 미해결 분기를 닫는다.
- 규칙: PHASE_STARTED/CLUE_PUBLISHED/BALLOT_CLOSED 발생 시 GRANT_CLUE/PUBLISH_MATERIAL/SET_FLAG만 실행한다.

조건은 ALWAYS, CULPRIT_IDENTIFIED, CLUE_PUBLIC, HAS_CLUE, FLAG, NOT, ALL, ANY만 허용한다. 참조 ID·종류·중복·개수·깊이를 검증한다. 효과가 트리거 이벤트를 다시 발행하지 않아 순환을 만들 수 없으며 원인+규칙 실행 이력과 실행 상한으로 재실행도 제한한다. JavaScript·SpEL·SQL 실행은 없다.

머더미스터리 샘플 5개와 보드게임 샘플 5개는 직접 작성했다. 고전 게임의 형식과 규칙은 [클래식 보드게임 안내](classic-games.md)를 참고한다. 작품 카드의 소요 시간은 플레이테스트로 보증한 시간이 아닌 추정값이다. Java 게임 엔진에는 특정 작품 이름·범인·단서 ID가 없다.

| 작품 | 인원 | 예상 시간 | 지원 방식 |
| --- | --- | --- | --- |
| 열두 시의 보관함 | 1명 | 15분 | 텍스트 |
| 눈 내린 역의 마지막 소포 | 2명 | 20분 | 텍스트·Discord |
| 폐관 후의 미술관 | 4명 | 45분 | 텍스트·Discord |
| 심야 열차의 마지막 승객 | 4명 | 45분 | 텍스트·Discord |
| 비 내리는 별장 | 4명 | 45분 | 텍스트·Discord |

1인용은 단서를 읽고 정리하는 추리 연습이며 본인 지목과 기권으로 판단을 표현한다. 통화나 밀담 없이 텍스트로 진행한다. 2인용은 서로 다른 정보를 합쳐 진실을 밝히는 협력형이며, 투표가 동률이면 기존 규칙대로 아무도 지목하지 않는다. 소수 인원 작품도 읽기 → 조사 → 추리 정리/대화 → 투표 → 엔딩까지 기존 서버 엔진으로 진행한다.

기존 4인용 세 작품은 각 4역할·8단서·7단계·2엔딩으로 유지한다. 서버 시작 시 새 slug만 추가하므로 업데이트가 기존 작품의 공개 버전이나 진행 중인 게임을 덮어쓰지 않는다.

## 카드 디자인 계약

자유 테이블의 구성물은 `tabletop.objects`, 덱과 덱 안의 카드는 `tabletop.decks[].cards`에 저장한다. 선택 항목인 `presentation.cardLayouts`는 실제 구성물에 연결할 정적인 시각 디자인이다. 장면의 `presentation.scenes`와 함께 보존하며, 카드 디자인을 추가해도 게임 엔진이나 판정 규칙은 바뀌지 않는다.

| 필드 | 저장 내용·연결 |
| --- | --- |
| `presentation.cardLayouts[]` | `id`, `name`, `width`, `height`, `front`, `back` |
| `front`, `back` | `background`와 `nodes` 배열. 빈 배열도 유효한 면이다. |
| `nodes[]` | `id`, `kind`, `x`, `y`, `width`, `height`, `rotation`; 선택적인 `fill`, 편집 상태 `locked`·`hidden` |
| `kind: TEXT` | `text`와 `fontSize` 필수. 빈 문자열은 허용한다. |
| `kind: IMAGE` | 업로드한 이미지의 `assetId` 필수 |
| `kind: RECT`, `ELLIPSE` | 사각형·타원. 좌표·크기·회전·색상으로 표현한다. |
| `tabletop.objects[].layoutId` | `kind: CARD`인 공용 카드의 앞뒷면 디자인 |
| `tabletop.decks[].cards[].layoutId` | 덱 카드의 앞면 디자인 |
| `tabletop.decks[].backLayoutId` | 덱 전체와 뽑은 카드에 적용할 공통 뒷면 디자인의 `back` |

`layoutId`·`backLayoutId`가 없거나 `null`·빈 문자열이면 해당 면은 기존 이미지·문구 표현을 사용한다. 덱에서 뽑을 때 앞면 연결과 덱의 공통 뒷면 연결을 보존하며 크기는 120×170으로 생성한다. 개별 카드의 `back`은 덱의 공통 뒷면을 대신하지 않는다. 디자인을 지정한 면은 기존 `name`·`text`·`assetId`·`backAssetId`를 표시하지 않으며, 지정한 디자인의 `nodes: []`도 이 규칙을 따른다. 존재하지 않는 디자인 연결은 완전 검증에서 오류로 반환한다.

카드 디자인은 최대 100개, 각 면의 요소는 최대 200개이며 장면과 카드 디자인을 합친 전체 요소는 최대 2,000개다. 디자인과 요소의 ID는 영문·숫자·밑줄·하이픈 1~100자이며 디자인 목록 안, 각 면의 요소 목록 안에서 각각 중복될 수 없다. 디자인 이름은 1~200자다. 논리 크기와 요소 크기는 1~4,096, 좌표는 −16,384~16,384, 회전은 −36,000~36,000도, 글자 크기는 6~240이다. 텍스트는 최대 20,000자이고 색상은 `#RRGGBB` 또는 `#RRGGBBAA`다. `MATERIAL`, 자료 연결 필드, 스크립트와 임의 메타데이터는 카드 요소 계약에 포함하지 않는다.

편집 문서의 허용 필드만 저장한다. 미완성 구조의 초안 저장과 시험·검수용 완전 검증은 별도이며, 업로드 자산의 소유권 검사는 저장 때도 적용한다. 고정할 때 카드 디자인과 모든 자산 참조를 함께 보관하고 이후 초안 수정으로 변경하지 않는다.

실행 응답은 공용 카드의 공개 상태와 손패 소유 좌석에 맞는 `objects[].faceDesign`, 덱의 `decks[].backDesign`만 선택적으로 포함한다. 면 DTO는 `{width, height, background, nodes}`이며 요소에는 종류별 시각 필드만 들어간다. 편집용 요소 ID·잠금·숨김·레이아웃 연결과 반대 면·전체 레이아웃 목록은 반환하지 않는다. 실행 중 구성물을 조작하는 `objects[].id`는 유지한다. 연결이 없는 면에는 `faceDesign`·`backDesign`을 생략하며, 기존 자산 필드는 없거나 `null`일 수 있다. [작업실 JSON 예제](studio-ui.md#카드-레이아웃-json-예제)와 OpenAPI의 `CardFaceDesign`을 함께 참고한다.
