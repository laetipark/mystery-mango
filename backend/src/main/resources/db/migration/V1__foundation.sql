create table app_user (
 id uuid primary key, email varchar(254) not null unique, display_name varchar(40) not null,
 password_hash varchar(100) not null, admin boolean not null default false, created_at timestamptz not null default now()
);
create table player_activity (
 user_id uuid primary key references app_user(id), kind text not null default 'IDLE' check(kind in ('IDLE','QUEUED','PROPOSED','ROOM','GAME')),
 reference_id uuid, updated_at timestamptz not null default now(), check ((kind='IDLE')=(reference_id is null))
);
create table user_block(user_id uuid references app_user(id),blocked_id uuid references app_user(id),created_at timestamptz not null default now(),primary key(user_id,blocked_id),check(user_id<>blocked_id));
create table report(id uuid primary key,reporter_id uuid not null references app_user(id),target_user_id uuid references app_user(id),game_id uuid,message_id uuid,reason varchar(2000) not null,status text not null default 'OPEN',created_at timestamptz not null default now());
create table scenario(id uuid primary key,slug text not null unique,created_at timestamptz not null default now());
create table scenario_version(id uuid primary key,scenario_id uuid not null references scenario(id),version int not null check(version>0),status text not null check(status in ('DRAFT','PUBLISHED')),definition jsonb not null,created_at timestamptz not null default now(),unique(scenario_id,version));
create table room(id uuid primary key,scenario_version_id uuid not null references scenario_version(id),host_id uuid not null references app_user(id),visibility text not null check(visibility in('PUBLIC','INVITE')),mode text not null check(mode in('TEXT','DISCORD')),status text not null default 'WAITING' check(status in('WAITING','PLAYING','CLOSED')),game_id uuid,invite_hash text,invite_expires_at timestamptz,created_at timestamptz not null default now());
create index room_public on room(created_at) where status='WAITING' and visibility='PUBLIC';
create table room_participant(room_id uuid references room(id),user_id uuid references app_user(id),ready boolean not null default false,joined_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),primary key(room_id,user_id));
create table match_ticket(id uuid primary key,user_id uuid not null references app_user(id),status text not null check(status in('WAITING','PROPOSED','CANCELLED','ROOM')),language text not null,max_minutes int not null check(max_minutes between 1 and 360),mode text not null check(mode in('TEXT','DISCORD')),genre text,difficulty text,requeue boolean not null,queued_at timestamptz not null default now(),proposal_id uuid);
create unique index one_live_ticket on match_ticket(user_id) where status in ('WAITING','PROPOSED');
create index queue_order on match_ticket(queued_at,id) where status='WAITING';
create table match_proposal(id uuid primary key,status text not null check(status in('ACCEPTING','VOTING','ROOM','ENDED')),expires_at timestamptz not null,room_id uuid references room(id),created_at timestamptz not null default now());
create table match_member(proposal_id uuid references match_proposal(id),user_id uuid references app_user(id),ticket_id uuid not null references match_ticket(id),accepted boolean not null default false,voted_version_id uuid references scenario_version(id),primary key(proposal_id,user_id));
create table match_candidate(proposal_id uuid references match_proposal(id),scenario_version_id uuid references scenario_version(id),rank int not null,primary key(proposal_id,scenario_version_id),unique(proposal_id,rank));
create table scenario_exposure(user_id uuid references app_user(id),scenario_id uuid references scenario(id),first_seen_at timestamptz not null default now(),primary key(user_id,scenario_id));
create table command_result(user_id uuid references app_user(id),key varchar(128),scope text not null,request_hash text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(user_id,key));
create table event_outbox(id uuid primary key,user_id uuid not null references app_user(id),type text not null,game_id uuid,state_version bigint not null,created_at timestamptz not null default now(),sent_at timestamptz);
create index outbox_pending on event_outbox(created_at) where sent_at is null;
create table spring_session(primary_id char(36) not null primary key,session_id char(36) not null,creation_time bigint not null,last_access_time bigint not null,max_inactive_interval int not null,expiry_time bigint not null,principal_name varchar(100));
create unique index spring_session_ix1 on spring_session(session_id);
create index spring_session_ix2 on spring_session(expiry_time);
create index spring_session_ix3 on spring_session(principal_name);
create table spring_session_attributes(session_primary_id char(36) not null references spring_session(primary_id) on delete cascade,attribute_name varchar(200) not null,attribute_bytes bytea not null,primary key(session_primary_id,attribute_name));

