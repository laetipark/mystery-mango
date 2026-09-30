CREATE TABLE game_session (
 id uuid PRIMARY KEY, room_id uuid NOT NULL UNIQUE REFERENCES room(id), scenario_version_id uuid NOT NULL REFERENCES scenario_version(id),
 status text NOT NULL CHECK(status IN ('ACTIVE','PAUSED','COMPLETED','ABORTED')), state_version bigint NOT NULL DEFAULT 1,
 current_phase_id uuid, created_at timestamptz NOT NULL, completed_at timestamptz,
 voice_pause boolean NOT NULL DEFAULT false, paused_at timestamptz, flags jsonb NOT NULL DEFAULT '{}',
 accused_role_id text, culprit_identified boolean NOT NULL DEFAULT false, ending_id text
);
CREATE TABLE player_role (
 game_id uuid NOT NULL REFERENCES game_session(id), user_id uuid NOT NULL REFERENCES app_user(id), role_id text NOT NULL,
 active boolean NOT NULL DEFAULT true, last_seen_at timestamptz NOT NULL,
 PRIMARY KEY(game_id,user_id), UNIQUE(game_id,role_id)
);
CREATE TABLE phase_instance (
 id uuid PRIMARY KEY, game_id uuid NOT NULL REFERENCES game_session(id), definition_id text NOT NULL,
 ordinal int NOT NULL, started_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, closed_at timestamptz,
 UNIQUE(game_id,ordinal)
);
ALTER TABLE game_session ADD CONSTRAINT current_phase_fk FOREIGN KEY(current_phase_id) REFERENCES phase_instance(id);
CREATE TABLE phase_ready (phase_id uuid NOT NULL REFERENCES phase_instance(id), user_id uuid NOT NULL REFERENCES app_user(id), PRIMARY KEY(phase_id,user_id));
CREATE TABLE game_investigation (
 id uuid PRIMARY KEY, game_id uuid NOT NULL REFERENCES game_session(id), phase_id uuid NOT NULL REFERENCES phase_instance(id),
 user_id uuid NOT NULL REFERENCES app_user(id), target_id text NOT NULL, created_at timestamptz NOT NULL,
 UNIQUE(game_id,user_id,target_id)
);
CREATE TABLE clue_grant (
 game_id uuid NOT NULL REFERENCES game_session(id), clue_id text NOT NULL, user_id uuid NOT NULL REFERENCES app_user(id),
 owned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL, PRIMARY KEY(game_id,clue_id,user_id)
);
CREATE TABLE public_clue (game_id uuid NOT NULL REFERENCES game_session(id), clue_id text NOT NULL, created_at timestamptz NOT NULL, PRIMARY KEY(game_id,clue_id));
CREATE TABLE game_material (id uuid PRIMARY KEY, game_id uuid NOT NULL REFERENCES game_session(id), text text NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE rule_execution (game_id uuid NOT NULL REFERENCES game_session(id), rule_id text NOT NULL, cause text NOT NULL, PRIMARY KEY(game_id,rule_id,cause));
CREATE TABLE ballot (
 id uuid PRIMARY KEY, game_id uuid NOT NULL REFERENCES game_session(id), phase_id uuid NOT NULL UNIQUE REFERENCES phase_instance(id),
 closed_at timestamptz, accused_role_id text
);
CREATE TABLE game_vote (ballot_id uuid NOT NULL REFERENCES ballot(id), user_id uuid NOT NULL REFERENCES app_user(id), role_id text, updated_at timestamptz NOT NULL, PRIMARY KEY(ballot_id,user_id));
CREATE TABLE whisper_room (
 id uuid PRIMARY KEY, game_id uuid NOT NULL REFERENCES game_session(id), status text NOT NULL CHECK(status IN ('INVITED','ACTIVE','CLOSED')),
 inviter_id uuid NOT NULL REFERENCES app_user(id), invitee_id uuid NOT NULL REFERENCES app_user(id), created_at timestamptz NOT NULL,
 CHECK(inviter_id <> invitee_id)
);
CREATE TABLE chat_message (
 id uuid PRIMARY KEY, game_id uuid NOT NULL REFERENCES game_session(id), sender_id uuid NOT NULL REFERENCES app_user(id),
 whisper_id uuid REFERENCES whisper_room(id), text text NOT NULL CHECK(length(text) BETWEEN 1 AND 2000), created_at timestamptz NOT NULL
);
CREATE TABLE message_recipient (message_id uuid NOT NULL REFERENCES chat_message(id), user_id uuid NOT NULL REFERENCES app_user(id), PRIMARY KEY(message_id,user_id));
CREATE TABLE abort_vote (game_id uuid NOT NULL REFERENCES game_session(id), user_id uuid NOT NULL REFERENCES app_user(id), created_at timestamptz NOT NULL, PRIMARY KEY(game_id,user_id));
CREATE INDEX phase_due_idx ON phase_instance(ends_at) WHERE closed_at IS NULL;
CREATE INDEX player_active_idx ON player_role(user_id,game_id) WHERE active;
CREATE INDEX message_game_idx ON chat_message(game_id,created_at DESC,id);
CREATE INDEX recipient_user_idx ON message_recipient(user_id,message_id);
CREATE INDEX whisper_game_idx ON whisper_room(game_id,status);
