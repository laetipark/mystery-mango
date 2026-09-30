# Discord 음성 연동

웹은 매칭·역할·개인 자료·단서·텍스트 대화·투표·게임 상태를 관리하고 Discord는 통화를 담당한다. Java 서버에 JDA 봇 어댑터를 포함하며 별도 Node.js 봇 서버를 사용하지 않는다. 봇은 음성에 접속하거나 음성을 수신·녹음하지 않고, 메시지와 DM도 보내지 않는다.

## 실행 상태와 검증 범위

- 기본값 `VOICE_PROVIDER=disabled`: JDA를 생성하지 않고 OAuth/Discord HTTP 요청도 하지 않는다. Discord 설정 없이 텍스트 게임 전체를 실행할 수 있다.
- `discord` 설정이 갖춰져야 봇이 Gateway에 연결한다. 구성값 존재, 봇 연결, 사용자 계정 연결, 서버 참가 자격은 서로 다른 상태다.
- 단위 테스트의 가짜 제공자는 권한 전환 순서와 실패 처리를 검사한다. **실제 Discord 서버의 권한 반영이나 실제 다인 통화를 검증했다는 뜻이 아니다.**
- 현재 실제 계정·봇 토큰·서버 및 4인 통화 검증은 제공되지 않았다. 전체 음성 완료 판정은 아래 실환경 체크리스트를 통과한 뒤에만 할 수 있다.

## 운영자가 준비하는 설정

이 구현은 Discord 애플리케이션/봇/서버를 자동으로 만들거나 봇을 설치하지 않는다. 다음 값을 이미 설치된 전용 서버 환경에서 설정한다. 비밀값은 서버 환경 변수에만 두고 `VITE_` 변수, 소스 코드, URL, 로그에 넣지 않는다.

| 변수 | 의미 |
|---|---|
| `VOICE_PROVIDER` | `disabled` 또는 `discord` |
| `DISCORD_CLIENT_ID` | Discord 애플리케이션 ID |
| `DISCORD_CLIENT_SECRET` | 서버 전용 OAuth client secret |
| `DISCORD_BOT_TOKEN` | 같은 애플리케이션 봇의 토큰 |
| `DISCORD_GUILD_ID` | 서비스가 관리하는 전용 Discord 서버 ID |
| `DISCORD_CATEGORY_ID` | 앱 전용 음성 채널 카테고리 ID |
| `DISCORD_REDIRECT_URI` | 등록된 OAuth 콜백 주소와 정확히 같은 주소 |

로컬 Vite를 사용할 때 콜백 예시는 `http://localhost:5173/api/v1/me/discord/callback`이다. 프록시를 통해 Java 서버로 전달하며 성공 후 같은 출처의 `/account?discord=linked`로 돌아간다. 배포 시에는 `https://서비스도메인/api/v1/me/discord/callback`을 사용한다. 콜백은 로그인 세션이 유지되어야 하며 무작위 1회용 `state`를 검증한다. HTTPS 또는 로컬 localhost/127.0.0.1 HTTP만 구성값으로 허용한다.

봇에는 `GUILD_VOICE_STATES` intent만 요청한다. 메시지 내용/사용자 presence/전체 멤버 목록용 특권 intent는 요청하지 않는다. 봇 역할에는 서버 수준에서 채널 보기·관리, 권한 관리, 음성 연결/발언/음성 감지/멤버 이동 권한을 부여하고 전용 카테고리에서도 거부하지 않는다. Discord는 봇이 조정하는 허용/거부 비트에 대한 권한도 검사하므로 메시지 보내기·기록 읽기·비디오·초대 생성 비트를 참가자에게 거부할 권한도 봇 역할에 둬야 한다. 실제 코드에서 이러한 메시지·비디오·초대 기능은 사용하지 않는다. `ADMINISTRATOR`는 필요하지 않다.

일반 참가자에게 서버 소유자·관리자·채널 관리·권한 관리·음성 멤버 이동 권한을 주지 않는다. 이 권한이 있는 계정은 음성 참가 자격 확인에서 거부한다. 서버 소유자의 운영 계정으로 플레이하지 말고 일반 참가자 계정을 사용한다. 앱은 전용 카테고리에서 `mm-` 접두사와 게임 UUID로 만든 채널만 관리한다. 작품명, 역할명, 단서 내용은 채널 이름이나 Discord metadata로 보내지 않는다.

## 참가 흐름과 API

1. 서비스에 로그인한 후 마이페이지에서 Discord 계정을 연결한다. OAuth scope는 `identify`뿐이며 이메일이나 친구 목록을 요청하지 않는다. OAuth 토큰은 계정 ID 확인에만 사용하고 DB에 저장하지 않는다.
2. 사용자가 전용 Discord 서버에 직접 참가한다. 서버의 가입 심사가 있다면 완료해야 한다. 앱이 임의로 서버에 가입시키지 않는다.
3. 연결 계정이 일반 참가자 권한을 가진 서버 멤버인지 확인한다. Discord 사용자 ID는 서비스 사용자와 1:1로 연결되며 DB UNIQUE 제약으로 중복 연결을 차단한다.
4. Discord 모드 게임이 시작되면 비공개 전체방을 만들고 참가자에게만 접근을 부여한다. 최초 입장은 화면의 Discord 링크를 눌러 직접 해야 한다. 봇은 통화하지 않는 사용자를 강제로 통화에 접속시키지 못한다.
5. 웹에서 밀담을 수락하면 봇이 권한과 통화 중 참가자의 위치를 조정한다. 마이크, 기기 선택, 음소거, 권한 거부 안내는 Discord에서 사용한다. 웹은 마지막 서버 확인 시점의 연결 상태를 표시한다.

| API | 응답/용도 |
|---|---|
| `GET /api/v1/me/discord` | `provider, configured, botReady, linked, discordUserId, displayName, eligible, reason` |
| `POST /api/v1/me/discord/link` | `{authorizeUrl}`. 로그인 및 CSRF 필수, OAuth 진입용 요청 |
| `GET /api/v1/me/discord/callback` | 로그인 사용자/세션/만료/1회용 state 검증 후 연결, 마이페이지로 이동 |
| `DELETE /api/v1/me/discord` | `{unlinked:true}`, Idempotency-Key 필수 |
| `GET /api/v1/games/{id}/voice-state` | `provider, configured, status, connected, channelUrl, channelKind, message` |
| `POST /api/v1/games/{id}/voice-join` | `{requested:true}`, Idempotency-Key 필수. 동기화 요청의 접수이며 통화 성공 응답이 아님 |

`status`는 `DISABLED`, `PENDING`, `READY`, `ERROR`, `CLEANED` 중 하나다. `READY`는 권한 전환 확인 완료이고 실제 통화 접속 여부는 `connected`로 따로 표시한다. `READY`인데 사용자가 아직 Discord에 입장하지 않았다면 `connected=false`가 맞는 상태다. `channelKind`는 `MAIN` 또는 `WHISPER`다. 미설정·실패·전환 중에는 성공 링크를 임의로 만들지 않는다.

계정 연결 변경/해제는 활성 대기열·모집방·게임이 없고, 과거 게임 음성 정리가 끝난 경우에만 가능하다. 이는 Discord 계정 ID가 진행 중인 게임의 권한 대상으로 바뀌는 것을 막는다. 서비스 계정 탈퇴 정책은 별도로 정해야 한다.

## 권한 전환, 실패와 재시작

`discord_voice_session`은 동기화 상태/의도 해시/재시도 시각을, `discord_voice_channel`은 외부 채널 ID를, `discord_voice_member`는 마지막 확인 상태를 보관한다. 최신 참가자·밀담·단계는 항상 PostgreSQL 게임 테이블에서 계산한다.

DB 트랜잭션에서 의도를 저장하고 게임을 일시정지한 뒤 트랜잭션을 끝낸다. 이후 전용 단일 worker가 외부 요청을 수행한다. Discord 네트워크 요청 중에는 게임 DB 잠금을 유지하지 않는다. 전환 완료 후 새 트랜잭션에서 최신 게임 의도와 일치하는지 다시 확인하고, 일치할 때만 게임을 재개한다. 단계 타이머는 일시정지 길이만큼 보정된다.

- `@everyone`의 채널 보기·연결을 거부하고 현재 참가자의 개별 권한만 허용한다. 남아 있는 역할/멤버 overwrite도 교체한다. 채널 내 별도 텍스트 메시지·기록·비디오·초대 생성은 참가자에게 거부한다.
- 이전 채널 접근 권한을 먼저 회수한 다음 이동 또는 명시적 연결 해제를 수행한다. `CONNECT`를 끄는 것만으로 기존 통화가 끊긴다고 가정하지 않는다.
- 이동 HTTP 요청이 성공해도 완료로 선언하지 않는다. `retrieveMemberVoiceStateById(...).useCache(false)`로 실제 위치를 다시 확인한다. 잘못된 관리 채널에 남은 참가자가 있으면 실패로 두고 게임을 재개하지 않는다.
- 게임 종료/중단 시 채널 접근을 회수하고 해당 게임 관리 채널에 남은 참가자의 연결 해제를 확인한 뒤 채널을 삭제한다. 다른 용도의 Discord 채널에 있는 사용자를 정리 목적으로 끊지는 않는다.
- 재시작 시 진행 중인 게임과 미완료 정리를 재조회한다. 외부 생성 직후 DB 기록 전에 중단된 경우에는 전용 카테고리의 동일한 결정적 이름으로 채널을 복구한다. 중복 이름이나 이미 저장된 채널의 소실/비가시성은 자동 성공으로 취급하지 않고 운영자 확인 대상으로 남긴다.
- JDA의 호출 제한 처리를 사용하며 외부 요청은 제한 시간을 둔다. 실패하면 상태를 `ERROR`로 기록하고 주기적으로 재시도한다. 원본 토큰/외부 응답을 오류 응답에 포함하지 않는다. 디버깅은 `discord_voice_session.error_code`와 시각/시도 횟수로 시작한다.

초기 대상은 Java 애플리케이션 1개다. worker의 중복 실행 방지와 JDA Gateway 캐시는 단일 프로세스를 전제로 한다. 수평 확장 전에는 DB worker 소유권/lease, Gateway 소유권, 외부 작업 중복 방지 및 shard 정책을 추가해야 한다.

## 보장 범위

Discord 서버 소유자와 `ADMINISTRATOR`는 채널 권한을 우회한다. 운영자까지 배제하는 비밀 통화라는 보장은 하지 않는다. 관리 권한이 있는 외부 봇도 신뢰 경계에 포함된다. 웹 차단 정책은 매칭과 서비스가 관리하는 채널 권한에 적용되며, 참가자의 Discord DM이나 다른 서버의 대화까지 막을 수는 없다.

API/Gateway 장애와 호출 제한이 존재하므로 물리적인 무지연 차단을 보장하지 않는다. 화면에서 완료를 표시하기 전에 권한과 실제 위치를 확인하고, 확인 실패 시 이후 게임 진행을 멈추는 방식이다. 운영자가 봇 권한을 제거하거나 관리자 권한으로 채널에 들어온 상황까지 자동으로 안전하다고 판단하지 않는다.

## 실환경 완료 체크리스트

독립된 일반 사용자 4명, 서비스 운영자 계정, 외부 제3자 테스트 계정으로 확인하고 날짜·클라이언트·결과를 기록한다.

- 전체방에서 네 사람의 실제 마이크 음성이 상호 전달된다. 마이크 거부·기기 선택·음소거·모바일/브라우저 복귀 안내를 확인한다.
- 2명이 밀담으로 이동할 때 전체방의 나머지 2명에게 밀담 음성이 전달되지 않고, 이전 채널 수동 재입장이 거절된다.
- 초대를 받지 않은 사용자, 초대를 수락하지 않은 사용자, 종료된 밀담 참가자의 입장이 거절된다.
- 밀담 종료와 게임 종료에서 실제 연결 해제/복귀가 확인되고, 종료 채널이 삭제된다.
- 브라우저 새로고침과 Java 서버 재시작 후 올바른 역할·게임 단계·채널 권한으로 복구된다.
- 봇 토큰 오류, 봇 권한 회수, Discord 장애, 호출 제한, 이동 성공 응답 뒤 위치 확인 실패 시 게임이 재개되지 않는다.
- 운영자/admin 우회는 허용 범위로 숨기지 않고 실제 경계로 기록한다.

## 확인한 공식/라이브러리 자료

- [JDA 6.7.0 릴리스와 Gradle 좌표](https://github.com/discord-jda/JDA/releases/tag/v6.7.0) — JDA는 Discord 공식 SDK가 아닌 Java 커뮤니티 라이브러리다. 버전은 6.7.0으로 고정했다.
- [Discord OAuth2](https://docs.discord.com/developers/topics/oauth2)
- [Discord 채널 권한 계산 및 관리자 우회](https://docs.discord.com/developers/topics/permissions)
- [Guild 멤버 이동과 channel_id=null 연결 해제](https://docs.discord.com/developers/resources/guild#modify-guild-member)
- [Voice state 조회](https://docs.discord.com/developers/resources/voice#get-user-voice-state)
- [Discord 호출 제한](https://docs.discord.com/developers/topics/rate-limits)
- [JDA Guild API](https://docs.jda.wiki/net/dv8tion/jda/api/entities/Guild.html)
## 비활성화 전 정리

진행 중인 Discord 게임이 있을 때는 봇이 정상 연결된 상태에서 게임을 완료하거나 중단하고 채널 정리를 확인한 뒤 `VOICE_PROVIDER=disabled`로 바꾼다. disabled 모드는 외부 호출을 하지 않으므로 이미 남아 있는 Discord 연결·채널 권한을 철회할 수 없다.
