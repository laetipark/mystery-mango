-- 실제 시험에서 Java 엔진이 확정한 엔딩만 저장한다. 버전은 부모 기록의 FK를 따라간다.
CREATE TABLE sandbox_ending_observation (
 sandbox_id uuid NOT NULL REFERENCES sandbox_run(id),
 ending_id text NOT NULL CHECK (length(btrim(ending_id)) > 0),
 observer_kind text NOT NULL CHECK (observer_kind IN ('AUTHOR','REVIEWER')),
 observed_by uuid NOT NULL REFERENCES app_user(id),
 reached_at timestamptz NOT NULL,
 PRIMARY KEY (sandbox_id,ending_id,observer_kind)
);
CREATE INDEX sandbox_version_idx ON sandbox_run(version_id);

-- 복합 FK가 정식 게임을 초대 시험 기록으로 저장하는 것을 막는다.
ALTER TABLE game_session ADD CONSTRAINT game_session_id_test_unique UNIQUE (id,is_test);
CREATE TABLE invited_test_ending_observation (
 game_id uuid PRIMARY KEY,
 is_test boolean NOT NULL DEFAULT true CHECK (is_test),
 ending_id text NOT NULL CHECK (length(btrim(ending_id)) > 0),
 reached_at timestamptz NOT NULL,
 FOREIGN KEY (game_id,is_test) REFERENCES game_session(id,is_test)
);
CREATE INDEX game_scenario_version_idx ON game_session(scenario_version_id);
