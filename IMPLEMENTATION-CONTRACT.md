# Shared implementation contract

All application backend code is Java 21 / Spring Boot 4.1.1 under `com.mysterymango`. PostgreSQL is authoritative. No fake production responses. Korean UI. Files owned by the assigned agent must not overwrite another agent's work.

## Shared Java services (parent owns)
- `common.Db`: `List<Map<String,Object>> list(String sql,Object... args)`, `Map<String,Object> one(String sql,Object... args)` (throws ApiException 404 if absent), `Map<String,Object> optional(String sql,Object... args)` (returns null), `int update(String sql,Object... args)`. `static UUID uuid(Map,String)`, `static String str(Map,String)`, `static int num(Map,String)`, `static Instant instant(Map,String)`.
- `common.Json`: `String write(Object)`, `Map<String,Object> object(String)`, `<T> T read(String,Class<T>)` uses Jackson 3 injected ObjectMapper.
- `common.ApiException(int status,String code,String message)` runtime exception. Errors JSON `{code,message,traceId}`.
- `auth.Actor`: static `UUID id()` from authenticated principal name; `boolean admin()`.
- `common.Commands`: `<T> T run(UUID actor,String key,String scope,Object body,Supplier<T> action)` REQUIRED transaction, locks global PostgreSQL advisory transaction lock (single server conservative serialization), idempotency record + request hash. Cache only safe command acknowledgement IDs. Controllers require `Idempotency-Key` for POST/PUT/DELETE business changes. Auth/heartbeat exempt. Never cache private material. Call `Commands.lock()` for scheduler transactions and all other mutations. Coarse DB transaction lock is intentional MVP safety, documented scalability limit.
- `common.Events`: `void emit(Collection<UUID> users,String type,UUID gameId,long version)` stores one outbox row per user, IDs/timestamps only. Dispatcher checks current authorization and uses `/user/queue/events`.
- `room.RoomService`: `Map<String,Object> snapshot(UUID roomId,UUID userId)`, `Map<String,Object> create(UUID userId,UUID scenarioVersionId,String visibility,String mode)`. `PlayerActivity` helper in `common.Activities`: `void requireIdle(UUID)`, `void set(UUID,String,UUID)`, `void release(UUID)`. All mutate within Commands lock.
- `scenario.ScenarioService`: `Map<String,Object> definition(UUID versionId)`, `Map<String,Object> publicVersion(UUID versionId)`.

## Shared SQL (parent V1 migration)
app_user(id uuid PK,email text UNIQUE,display_name text,password_hash text,admin boolean,created_at timestamptz)
player_activity(user_id uuid PK FK app_user,kind text IDLE/QUEUED/PROPOSED/ROOM/GAME,reference_id uuid nullable,updated_at timestamptz)
user_block(user_id uuid,blocked_id uuid,created_at,PK(user_id,blocked_id))
report(id uuid,reporter_id uuid,target_user_id uuid nullable,game_id uuid nullable,message_id uuid nullable,reason text,status text,created_at)
scenario(id uuid PK,slug text UNIQUE,created_at)
scenario_version(id uuid PK,scenario_id uuid FK,version int,status DRAFT/PUBLISHED,definition jsonb,created_at,UNIQUE(scenario_id,version))
room(id uuid PK,scenario_version_id uuid FK,host_id uuid,visibility PUBLIC/INVITE,mode TEXT/DISCORD,status WAITING/PLAYING/CLOSED,game_id uuid nullable,invite_hash text nullable,invite_expires_at timestamptz nullable,created_at)
room_participant(room_id uuid,user_id uuid,ready boolean,joined_at timestamptz,last_seen_at timestamptz,PK(room_id,user_id))
match_ticket(id uuid PK,user_id uuid,status WAITING/PROPOSED/CANCELLED/ROOM,language text,max_minutes int,mode TEXT/DISCORD,genre text nullable,difficulty text nullable,requeue boolean,queued_at timestamptz,proposal_id uuid nullable)
match_proposal(id uuid PK,status ACCEPTING/VOTING/ROOM/ENDED,expires_at timestamptz,room_id uuid nullable,created_at)
match_member(proposal_id uuid,user_id uuid,ticket_id uuid,accepted boolean,voted_version_id uuid nullable,PK(proposal_id,user_id))
match_candidate(proposal_id uuid,scenario_version_id uuid,rank int,PK(proposal_id,scenario_version_id))
scenario_exposure(user_id uuid,scenario_id uuid,first_seen_at timestamptz,PK(user_id,scenario_id))
command_result(user_id uuid,key text,scope text,request_hash text,result jsonb,created_at,PK(user_id,key))
event_outbox(id uuid PK,user_id uuid,type text,game_id uuid nullable,state_version bigint,created_at,sent_at timestamptz nullable)

Game agent owns V2__game.sql; voice agent owns V3__discord.sql. Shared IDs UUID; use UTC Instant. Spring Session tables in V1.

## Game service boundary (game agent owns)
`game.GameService.start(UUID roomId,UUID actor)` called inside Commands.run from POST rooms/{id}/start; returns `{gameId}`. Checks exact four + all ready + host. Assign roles immutable. `GameService.snapshot(UUID gameId,UUID actor)` authorized. `GameService.tick()` scheduler with transactions and Commands.lock. Expose `List<UUID> participants(UUID gameId)` (active recipients), `boolean isParticipant(UUID gameId,UUID userId)` and `void pauseForVoice(UUID gameId,boolean pause)` for voice agent. Game table name `game_session`: id uuid, room_id uuid, scenario_version_id uuid,status ACTIVE/PAUSED/COMPLETED/ABORTED,state_version bigint,current_phase_id uuid,created_at,completed_at. Player role table `player_role(game_id,user_id,role_id text,active boolean,last_seen_at)`; IDs stable. Whisper table `whisper_room(id,game_id,status INVITED/ACTIVE/CLOSED,inviter_id,invitee_id,created_at)`; max 2. Voice reconciles reads these three tables, no circular Java dependency. Game mutations do NOT call voice directly; voice worker observes committed state. For DISCORD mode game must gate whisper/phase transitions while voice synchronization pending; collaborate with voice agent.

## Scenario JSON v1 (game agent creates 3 resources)
`{schemaVersion:1,slug,title,synopsis,language:"ko",playerCount:4,estimatedMinutes:45,genre,difficulty:"EASY"|"MEDIUM"|"HARD",modes:["TEXT","DISCORD"],roles:[{id,name,publicIntro,secret,objective:{text,condition}}],phases:[{id,kind:"READING"|"INVESTIGATION"|"DISCUSSION"|"VOTE"|"ENDING",durationSeconds,actions:["CHAT","WHISPER","INVESTIGATE","SHARE","VOTE"],publicText,investigationLimit}],targets:[{id,name,phaseIds:[...],clueIds:[...]}],clues:[{id,title,text,sharePolicy:"PUBLIC_AND_WHISPER"|"PUBLIC"|"PRIVATE"}],ballot:{culpritRoleId,allowChange:true,allowAbstain:true,tiePolicy:"NO_ACCUSATION"},endings:[{id,title,text,condition}],rules:[{id,when:"PHASE_STARTED"|"CLUE_PUBLISHED"|"BALLOT_CLOSED",phaseId?,clueId?,condition,effects:[{type:"GRANT_CLUE"|"PUBLISH_MATERIAL"|"SET_FLAG",roleId?,clueId?,text?,flag?,value?}]}]}`.
Conditions bounded allowlist: `{type:"ALWAYS"}`, `{type:"CULPRIT_IDENTIFIED"}`, `{type:"NOT",condition:{...}}`, `{type:"ALL"|"ANY",conditions:[...]}`, `{type:"CLUE_PUBLIC",clueId}`, `{type:"HAS_CLUE",clueId,roleId?}`, `{type:"FLAG",flag,value}`. Last ending ALWAYS required. No arbitrary scripts. Parent validates public metadata and refs; game agent implement full validation or provide validator called by ScenarioService.

## REST response contract
All request bodies JSON, cookie session; GET /api/v1/auth/csrf -> `{token,headerName}`. POST auth/register `{email,password,displayName}`, POST auth/login `{email,password}` -> `{id,email,displayName,admin}`; GET auth/me same; POST auth/logout.
GET /api/v1/meta -> `{voiceProvider,voiceConfigured}`.
GET scenarios?page=0&size=20&genre=&difficulty=&maxMinutes= -> `{items:[{id,versionId,title,synopsis,playerCount,estimatedMinutes,genre,difficulty,language,modes,roles:[{id,name,publicIntro}]}],total,page,size}`; GET scenarios/{id} same public card plus rooms can query room list.
GET /api/v1/me/activity -> `{kind,referenceId}`. GET /rooms -> `{items:[{id,title,scenarioVersionId,hostName,count,capacity,mode}],total,page,size}`.
POST /rooms `{scenarioVersionId,visibility,mode,inviteToken?}` -> `{roomId,expiresAt?}`; INVITE requires a browser-generated cryptographic 32-byte base64url token, retained only in browser memory. The server stores its hash and never caches the plaintext token. GET /rooms/{id} -> `{id,title,scenarioVersionId,hostId,visibility,mode,status,gameId,capacity,participants:[{userId,displayName,ready,connected}],rules}`.
POST /rooms/{id}/join `{inviteToken?}`; PUT /rooms/{id}/ready `{ready}`; POST /rooms/{id}/leave; POST /rooms/{id}/start -> `{gameId}`; POST /rooms/{id}/invite `{inviteToken}` -> `{roomId,expiresAt}`; DELETE invite revokes.
POST /match-tickets `{language,maxMinutes,mode,genre?,difficulty?,requeue}` -> `{ticketId}`; GET /match-tickets/{id} -> `{id,status,queuedAt,proposalId}`; DELETE same; GET /match-proposals/{id} -> `{id,status,expiresAt,roomId,members:[{userId,displayName,accepted}],candidates:[public scenario cards with rank],myVote}`; POST accept; POST reject; PUT scenario-vote `{scenarioVersionId}`.
Game agent defines snapshot below and communicates additions, frontend align:
GET /games/{id}/snapshot -> `{id,status,stateVersion,serverTime,phase:{id,definitionId,kind,endsAt,publicText,actions},participants:[{userId,displayName,roleId,roleName,connected}],myRole:{id,name,secret,objective},clues:[{id,title,text,owned,public,sharePolicy}],targets:[{id,name,investigated}],investigationsRemaining,ballot:{id,allowChange,allowAbstain,myVote,endsAt}|null,whispers:[{id,status,inviterId,inviteeId}],materials:[{id,text}],ending:{title,text,objectiveAchieved}|null}`.
GET games/{id}/me/role -> own role; POST games/{id}/investigations `{targetId}`; POST clue-shares `{clueId,scope:"PUBLIC"|"WHISPER",whisperId?}`; PUT ballots/{ballotId}/me `{roleId:null|string}`; GET/POST messages `?whisperId=&before=&size=50` body `{text,whisperId?}` -> list `{items:[{id,senderId,senderName,text,createdAt,whisperId}],hasMore}` / command ack `{messageId}`; POST whispers `{inviteeId}` -> `{whisperId}`; POST whispers/{wid}/accept|leave; POST heartbeat; POST phase-ready (reading phase only); POST abort-vote -> `{...}`; GET /me/history -> `{items:[{gameId,title,status,completedAt}],total,page,size}`.
GET/POST/DELETE /me/blocks (POST `{userId}`, DELETE /{id}); POST /reports `{targetUserId?,gameId?,messageId?,reason}`.
GET/POST /admin/scenarios; POST /admin/scenarios/validate `{definition}`; POST /admin/scenarios/{versionId}/publish; GET /admin/reports.

Discord voice agent adds /me/discord and /games/{id}/voice-state, /voice-join; provide frontend contract via message. No Discord messages or DMs; only channel and permissions management on configured dedicated guild. Config default disabled.

## UX/test conventions
Home, auth, catalog/detail, rooms, matching, lobby, three-column game/mobile tabs, history/account, admin. Actual state only; no mocked participant count. Friendly cream/charcoal/mango accent, readable Korean. Empty/error/loading/reconnecting states. React renders plaintext, no raw HTML.
Frontend tasks npm dev/build/lint/test, Playwright 4 independent contexts. Parent will provide development accounts admin@example.test and player1..8@example.test password MangoDev!2026 only dev/e2e profile, per-account signup normal login works. Profile `e2e` sets phase duration via env GAME_PHASE_SECONDS (default 4 for e2e); non-e2e original duration. Engine must expose this override.
No true external Discord verification without real credentials/users. Document limitations honestly.
