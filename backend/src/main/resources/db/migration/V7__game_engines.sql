ALTER TABLE game_session ADD COLUMN game_type text NOT NULL DEFAULT 'MURDER_MYSTERY'
 CHECK (game_type IN ('MURDER_MYSTERY','TABLETOP','YACHT'));
ALTER TABLE game_session ADD COLUMN board_state jsonb NOT NULL DEFAULT '{}';
ALTER TABLE game_session ADD COLUMN is_test boolean NOT NULL DEFAULT false;
ALTER TABLE game_session ADD COLUMN active_scene_id text;
CREATE TABLE sandbox_run (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_user(id),
 version_id uuid NOT NULL REFERENCES scenario_version(id),
 game_type text NOT NULL CHECK (game_type IN ('MURDER_MYSTERY','TABLETOP','YACHT')),
 capacity int NOT NULL CHECK (capacity BETWEEN 1 AND 4),
 state jsonb NOT NULL, state_version bigint NOT NULL DEFAULT 1,
 active_scene_id text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sandbox_owner_idx ON sandbox_run(owner_id,created_at DESC);
CREATE TABLE scenario_exposure_source (
 user_id uuid NOT NULL REFERENCES app_user(id), version_id uuid NOT NULL REFERENCES scenario_version(id),
 source text NOT NULL CHECK(source IN ('AUTHOR_PREVIEW','TEST_PLAY','REGULAR_PLAY')),
 first_seen_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,version_id,source)
);
