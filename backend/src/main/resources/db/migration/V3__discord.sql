create table discord_account (
  user_id uuid primary key references app_user(id),
  discord_user_id text not null unique check (discord_user_id ~ '^[0-9]{5,20}$'),
  display_name text not null,
  eligible boolean not null default false,
  eligibility_reason text,
  verified_at timestamptz,
  linked_at timestamptz not null default now()
);
create table discord_voice_session (
  game_id uuid primary key references game_session(id),
  desired_hash text not null default '',
  status text not null default 'PENDING' check(status in ('PENDING','READY','ERROR','CLEANED')),
  attempts integer not null default 0,
  error_code text,
  retry_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reconciled_at timestamptz
);
create table discord_voice_channel (
  id uuid primary key,
  game_id uuid not null references game_session(id),
  room_key text not null unique,
  kind text not null check(kind in ('MAIN','WHISPER')),
  whisper_id uuid,
  channel_id text unique,
  closed_at timestamptz
);
create index discord_voice_channel_game_idx on discord_voice_channel(game_id);
create table discord_voice_member (
  game_id uuid not null references game_session(id),
  user_id uuid not null references app_user(id),
  channel_id text,
  connected boolean not null default false,
  join_requested boolean not null default false,
  observed_at timestamptz,
  primary key(game_id,user_id)
);
