# 카카오 로그인과 Discord 연결 설정

이미 만든 카카오 개발자 앱과 Discord 봇의 설정을 아래 값에 맞춘다. 메뉴 이름은 2026-10-01 공식 문서 기준이다. 새 앱을 만들 필요는 없으며, 운영에 사용한 카카오 앱은 계속 유지한다.

**카카오 설정을 먼저 준비한 뒤 새 버전을 배포한다.** 새 운영 버전에서는 이메일·비밀번호 가입과 로그인이 비활성화된다. 첫 카카오 로그인은 카카오 사용자 ID를 기준으로 회원을 생성하고, 이후에는 같은 회원으로 로그인한다. 기존 이메일 계정과는 자동 병합하지 않으므로 기존 계정의 게임 기록이나 관리자 권한도 자동 이전되지 않는다.

키·Client Secret·봇 토큰은 서버의 `/home/laeti/mystery-mango/.env.production.local`에 로컬 편집기로만 입력한다. 채팅, 소스 코드, 프런트 `VITE_` 변수, 스크린샷에 붙여 넣지 않는다. 기존 DB 비밀번호와 다른 운영 설정은 보존한다.

## 1. 기존 카카오 앱 설정

1. [카카오디벨로퍼스 앱](https://developers.kakao.com/console/app)에서 미스터리 망고에 사용할 기존 앱을 연다. **앱 → 일반 → 앱 기본 정보**의 서비스 이름과 대표 도메인 `https://mystery.laetipark.me`를 확인한다.
2. **카카오 로그인 → 사용 설정 → 상태**를 **ON**으로 저장한다. [카카오 로그인 설정](https://developers.kakao.com/docs/ko/kakaologin/prerequisite)
3. **앱 → 플랫폼 키 → REST API 키**에서 사용할 키를 선택한다. 이 키 값이 `KAKAO_CLIENT_ID`다. 숫자로 된 앱 ID와 혼동하지 않는다.
4. 같은 키의 **카카오 로그인 리다이렉트 URI**에 아래 주소를 등록하고 저장한다. 끝에 `/`를 붙이지 않는다.

   ```text
   https://mystery.laetipark.me/api/v1/auth/kakao/callback
   ```

5. 같은 키의 **클라이언트 시크릿**에서 코드를 확인하고 **활성화 ON**을 유지한다. 이 값이 `KAKAO_CLIENT_SECRET`다. 새 REST API 키는 기본 활성화 상태이며, 이 서버 구현도 시크릿을 요구한다. [REST API 키·리다이렉트 URI 설정](https://developers.kakao.com/docs/ko/app-setting/app)
6. **카카오 로그인 → 동의항목 → 개인정보 → 닉네임 (`profile_nickname`) → 설정**에서 **선택 동의**로 설정한다. 동의 목적은 서비스 내 표시 이름 사용으로 적는다. 닉네임은 필수 가입 정보가 아니며, 응답에 없으면 기본 이름 “탐정”을 사용한다. 이메일, 프로필 사진, 친구 목록은 요청하지 않는다. 닉네임은 기본 제공 동의항목이며 선택 동의를 지원한다. [동의항목 설정](https://developers.kakao.com/docs/ko/kakaologin/prerequisite), [지원 동의 단계](https://developers.kakao.com/docs/ko/kakaologin/utilize)

Java 서버의 REST OAuth 방식이므로 JavaScript SDK 키·SDK 도메인은 필요하지 않다. 과거의 “Web 플랫폼 등록” 안내 대신 REST API 키의 콜백을 설정한다. **앱 → 제품 링크 관리 → 웹 도메인**은 공유 등 제품 링크용이다. 해당 제품을 사용한다면 `https://mystery.laetipark.me`를 별도로 등록한다. [플랫폼 키와 제품 링크 구분](https://developers.kakao.com/docs/ko/app-setting/app)

이 로그인 방식은 OpenID Connect의 ID 토큰이나 카카오싱크 간편가입을 사용하지 않는다. 이 기능을 추가로 활성화할 필요는 없다.

### KOE205 오류가 표시될 때

`KOE205`는 로그인 요청에 앱에서 설정하지 않은 동의항목이 포함된 경우 발생한다. 현재 서버는 `scope=profile_nickname`을 요청하므로, **실제 운영 REST API 키가 속한 앱**의 **카카오 로그인 → 동의항목 → 닉네임 (`profile_nickname`)**을 **선택 동의**로 설정하고 저장한다. 동의 목적 예시는 `서비스 내 사용자 표시 이름으로 사용`이다. [공식 오류 설명](https://developers.kakao.com/docs/ko/kakaologin/trouble-shooting)

설정 변경만으로 해결되면 서버 재배포는 필요하지 않다. 이전 오류 화면을 새로고침하거나 콜백 주소를 직접 열지 말고, 서비스의 `/login` 화면으로 돌아가 카카오 로그인 버튼을 새로 누른다. 같은 오류가 계속되면 오류 화면의 “설정하지 않은 동의항목” 이름과 해당 앱의 설정을 확인한다. 키·토큰·인가 코드·state가 포함된 전체 주소는 공유하지 않는다. 닉네임 항목이 없거나 오래된 통합 프로필 항목만 있으면 추가 개인정보 항목을 임의로 켜기 전에 요청 scope와 해당 앱이 지원하는 항목을 다시 맞춘다.

## 2. 기존 Discord 앱과 봇 설정

### OAuth 연결 정보

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 기존 봇의 애플리케이션을 선택한다.
2. **General Information → Application ID**를 `DISCORD_CLIENT_ID`로 사용한다. **OAuth2**의 **Client Secret**을 `DISCORD_CLIENT_SECRET`에 사용한다.
3. **OAuth2 → Redirects**에 아래 콜백 주소를 추가하고 저장한다. 카카오 콜백과 다른 주소다. [Discord OAuth2](https://docs.discord.com/developers/topics/oauth2), [OAuth2 탭의 콜백 설정](https://discord.com/developers/docs/social-sdk/authentication.html)

   ```text
   https://mystery.laetipark.me/api/v1/me/discord/callback
   ```

4. **Bot → Token**에서 발급받은 기존 봇 토큰을 `DISCORD_BOT_TOKEN`에 사용한다. 저장한 토큰이 없다면 **Reset Token**으로 재발급할 수 있다. 재발급하면 기존 토큰을 사용하는 다른 실행 프로세스도 갱신해야 하므로, 이미 사용하는 토큰을 단순 확인 목적으로 재발급하지 않는다. [봇 토큰 관리](https://docs.discord.com/developers/quick-start/getting-started)

사용자의 마이페이지 연결은 OAuth scope `identify`만 요청한다. 이메일이나 자동 서버 가입 권한은 요청하지 않으며, 봇 설치는 아래의 별도 운영자 절차다. [OAuth scope](https://docs.discord.com/developers/topics/oauth2)

### 전용 서버·카테고리와 봇 설치

1. 미스터리 망고 전용 Discord 서버와 그 안의 음성 채널용 카테고리를 선택한다. 다른 서비스 채널과 섞지 않는다. 게임별 `mm-` 채널은 앱이 생성한다.
2. Discord **사용자 설정 → 고급 → 개발자 모드**를 켠다. 서버 아이콘을 우클릭해 **서버 ID 복사**한 값을 `DISCORD_GUILD_ID`로, 카테고리를 우클릭해 **채널 ID 복사**한 값을 `DISCORD_CATEGORY_ID`로 사용한다. 카테고리 이름이나 개별 음성 채널 ID를 넣지 않는다. [ID 확인 방법](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID)
3. Developer Portal의 **Installation → Installation Contexts**에서 **Guild Install**을 지원하도록 설정한다. **Default Install Settings → Guild Install**의 scope에 `bot`을 두고 아래 권한을 설정한다. `applications.commands`가 함께 표시되어도 현재 구현은 명령어를 등록하지 않는다. **Install Link**로 전용 서버에 설치한다. 이미 설치됐다면 같은 봇인지 확인하고 역할·카테고리 권한을 점검한다. [서버 설치 설정](https://docs.discord.com/developers/quick-start/getting-started)

현재 `DiscordVoiceProvider`의 봇 권한 집합에 맞춘 값은 **`321981969`**다. 권한 선택 화면에서는 다음 11개 항목을 사용한다.

| 표시 권한 | Discord 권한 비트 | 현재 구현에서 필요한 이유 |
|---|---|---|
| View Channels / 채널 보기 | `VIEW_CHANNEL` | 관리 카테고리·채널 확인 |
| Manage Channels / 채널 관리 | `MANAGE_CHANNELS` | 게임 음성 채널 생성·삭제 |
| Manage Roles / 역할 관리 | `MANAGE_ROLES` | 채널별 접근 권한 변경. 카테고리 화면에서는 Manage Permissions / 권한 관리로 표시될 수 있음 |
| Connect / 연결 | `CONNECT` | 참가자 연결 허용·회수 |
| Speak / 말하기 | `SPEAK` | 참가자 발언 권한 설정 |
| Use Voice Activity / 음성 감지 사용 | `USE_VAD` | 참가자 음성 감지 권한 설정 |
| Move Members / 멤버 이동 | `MOVE_MEMBERS` | 전체방·밀담방 이동 및 연결 해제 |
| Send Messages / 메시지 보내기 | `SEND_MESSAGES` | 참가자에게 해당 기능을 거부하는 overwrite 설정 |
| Read Message History / 메시지 기록 보기 | `READ_MESSAGE_HISTORY` | 참가자에게 해당 기능을 거부하는 overwrite 설정 |
| Video / 영상 | `STREAM` | 참가자에게 해당 기능을 거부하는 overwrite 설정 |
| Create Invite / 초대 코드 만들기 | `CREATE_INSTANT_INVITE` | 참가자에게 해당 기능을 거부하는 overwrite 설정 |

권한 비트는 [Discord 권한 표](https://docs.discord.com/developers/topics/permissions)에 대응한다. 서버 역할과 전용 카테고리 양쪽에서 위 권한을 만족해야 `botReady=true`가 된다. 마지막 네 권한은 봇의 메시지·영상·초대 기능을 켜기 위한 설정이 아니라 현재 코드가 참가자에게 해당 기능을 거부하기 위해 검사하는 권한이다. 봇은 음성에 접속하거나 녹음하지 않는다.

**Administrator는 부여하지 않는다.** JDA는 일반 intent인 `GUILD_VOICE_STATES`만 요청하므로 **Bot → Privileged Gateway Intents**의 Presence, Server Members, Message Content를 새로 켤 필요도 없다. [Gateway intents](https://docs.discord.com/developers/events/gateway)

현재 서버 소유자 계정도 음성 게임에 참가할 수 있다. 소유자가 아닌 플레이어에게는 관리자·채널 관리·권한 관리·멤버 이동 권한을 부여하지 않는다. 이런 관리 권한 계정은 참가 검사에서 제외한다. 소유자는 Discord 권한상 모든 음성 채널에 접근할 수 있으므로 밀담의 청취 분리 검증은 관리 권한 없는 일반 계정 네 명으로 별도 수행한다. 자세한 권한 전환 규칙은 [Discord 음성 연동](discord.md)을 따른다.

참가자용 서버 초대 링크도 준비한다. `DISCORD_INVITE_URL`은 현재 환경 파일에 예약되어 있지만 앱 화면·API에서 읽어 사용하지 않는다. 값을 넣는 것만으로 참가 링크가 표시되거나 사용자가 자동 가입하지 않으므로 운영자가 참가자에게 링크를 별도로 안내한다.

## 3. 서버 값 입력과 배포

서버 터미널에서 환경 파일을 직접 편집한다. `nano`에서는 저장 `Ctrl+O` → Enter, 종료 `Ctrl+X`를 사용한다.

```bash
cd /home/laeti/mystery-mango
nano .env.production.local
chmod 600 .env.production.local
```

아래 항목을 편집한다. 표의 설명을 값으로 복사하지 말고 각 콘솔에서 확인한 실제 값을 입력한다. 기존 `DATABASE_PASSWORD`는 변경하지 않는다.

| 환경 변수 | 입력할 값 |
|---|---|
| `KAKAO_CLIENT_ID` | 위에서 선택한 REST API 키 |
| `KAKAO_CLIENT_SECRET` | 같은 REST API 키에 활성화된 클라이언트 시크릿 |
| `KAKAO_REDIRECT_URI` | `https://mystery.laetipark.me/api/v1/auth/kakao/callback` |
| `VOICE_PROVIDER` | Discord 설정까지 준비했으면 `discord`, 나중에 연결하면 `disabled` |
| `DISCORD_CLIENT_ID` | 봇 애플리케이션의 Application ID |
| `DISCORD_CLIENT_SECRET` | 같은 애플리케이션의 OAuth2 Client Secret |
| `DISCORD_BOT_TOKEN` | 같은 애플리케이션의 봇 토큰 |
| `DISCORD_GUILD_ID` | 전용 Discord 서버 ID |
| `DISCORD_CATEGORY_ID` | 그 서버 안의 관리 카테고리 ID |
| `DISCORD_REDIRECT_URI` | `https://mystery.laetipark.me/api/v1/me/discord/callback` |
| `DISCORD_INVITE_URL` | 선택 사항. 현재 자동 사용하지 않는 참가자용 초대 링크 |

카카오 값과 콜백 등록이 준비되면 운영 DB를 백업한 뒤 전체 배포를 실행한다. 이번 변경은 DB 마이그레이션, 앱과 호스트 Nginx 설정을 함께 적용한다. 백업 성공 시에만 배포가 진행되도록 아래 명령을 사용한다.

```bash
sudo bash scripts/backup-production.sh && sudo bash scripts/deploy-production.sh
sudo bash scripts/compose-production.sh ps
curl --fail --resolve mystery.laetipark.me:443:127.0.0.1 https://mystery.laetipark.me/healthz
```

카카오만 먼저 적용해도 텍스트 게임은 사용할 수 있다. 이후 Discord 값을 채우고 `VOICE_PROVIDER=discord`로 바꾼 뒤 같은 배포 명령을 다시 실행한다. 환경 파일 저장만으로 실행 중인 컨테이너의 설정이 바뀌지는 않는다.

## 4. 사용자가 확인할 연결 순서

1. [미스터리 망고](https://mystery.laetipark.me)에서 카카오로 로그인한다. 처음이면 회원이 생성되고, 로그아웃 후 다시 로그인했을 때 같은 계정으로 돌아오는지 확인한다.
2. 로그인한 브라우저의 **마이페이지 → Discord 계정 연결**에서 본인의 Discord 계정을 승인한다. 콜백 URL을 직접 여는 방식으로 시험하지 않는다. 같은 브라우저의 로그인 세션과 일회용 state가 필요하다.
3. 같은 Discord 계정으로 전용 서버에 직접 가입하고, 가입 심사가 있으면 완료한다. 현재 서버 소유자도 참가할 수 있다.
4. 마이페이지의 계정 연결과 참가 자격을 확인한다. Discord 모드 게임에 참여한 뒤 화면의 채널 링크로 직접 통화에 입장한다. 밀담의 접근·청취 분리를 검증할 때는 관리 권한 없는 일반 사용자 네 명을 사용한다.

다음 상태는 서로 다른 단계다.

| 상태 | 확인되는 것 | 추가로 필요한 확인 |
|---|---|---|
| `configured=true` | 환경 설정이 형식상 갖춰짐 | 토큰 유효성·Gateway 연결·서버 권한 |
| `botReady=true` | 봇 연결, 대상 서버·카테고리, 현재 코드의 권한 검사 통과 | 사용자 연결·서버 참가 자격 |
| `linked=true` | 서비스 계정과 Discord 사용자 ID 연결 | `eligible=true` 및 실제 통화 |
| `eligible=true` | 해당 계정의 서버 참가 자격 통과 | 채널 입장·마이크·상호 음성 |
| 게임 음성 `READY` | 채널 권한·위치 전환 확인 | `connected`와 실제 청취 결과 |

`READY`나 봇 온라인 표시만으로 음성 검증 완료로 기록하지 않는다. 네 명의 실제 음성 전달, 2인 밀담의 외부 청취 차단, 종료 후 복귀·채널 삭제를 [실환경 체크리스트](discord.md#실환경-완료-체크리스트)로 확인한다.

## 설정 완료 체크리스트

- [ ] 기존 카카오 앱의 REST API 키·활성화된 시크릿·정확한 콜백을 준비했다.
- [ ] 카카오 로그인 ON, 닉네임 선택 동의, 이메일 미요청을 확인했다.
- [ ] `.env.production.local`을 직접 편집하고 전체 배포를 마쳤다.
- [ ] 실제 카카오 첫 로그인과 재로그인이 성공했다.
- [ ] Discord 봇의 애플리케이션·서버·카테고리 ID와 콜백이 일치한다.
- [ ] 일반 사용자 계정으로 Discord 연결·서버 가입·참가 자격을 확인했다.
- [ ] 봇 준비 상태와 실제 네 명의 통화·밀담 검증 결과를 구분해 기록했다.

## 공식 자료

- [카카오 로그인 설정](https://developers.kakao.com/docs/ko/kakaologin/prerequisite)
- [카카오 앱·REST API 키·리다이렉트 URI](https://developers.kakao.com/docs/ko/app-setting/app)
- [카카오 개인정보 동의항목](https://developers.kakao.com/docs/ko/kakaologin/utilize)
- [Discord 애플리케이션·토큰·서버 설치](https://docs.discord.com/developers/quick-start/getting-started)
- [Discord OAuth2](https://docs.discord.com/developers/topics/oauth2)
- [Discord 권한 비트](https://docs.discord.com/developers/topics/permissions)
- [Discord Gateway intents](https://docs.discord.com/developers/events/gateway)
- [Discord 서버·채널 ID 확인](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID)
