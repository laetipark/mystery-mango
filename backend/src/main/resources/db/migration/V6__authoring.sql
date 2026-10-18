ALTER TABLE scenario ADD COLUMN owner_id uuid REFERENCES app_user(id);
ALTER TABLE scenario_version ADD COLUMN presentation jsonb NOT NULL DEFAULT '{"scenes":[]}';
ALTER TABLE scenario_version ADD COLUMN author_revision bigint;
CREATE UNIQUE INDEX author_frozen_revision ON scenario_version(scenario_id,author_revision) WHERE author_revision IS NOT NULL;
CREATE TABLE author_work (
 id uuid PRIMARY KEY, scenario_id uuid NOT NULL UNIQUE REFERENCES scenario(id), owner_id uuid NOT NULL REFERENCES app_user(id),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), document jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX author_work_owner ON author_work(owner_id,updated_at DESC);
CREATE TABLE scenario_review (
 id uuid PRIMARY KEY, version_id uuid NOT NULL UNIQUE REFERENCES scenario_version(id), author_id uuid NOT NULL REFERENCES app_user(id),
 status text NOT NULL CHECK(status IN ('PENDING','APPROVED','CHANGES_REQUESTED','SUPERSEDED')), note varchar(4000) NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz
);
CREATE TABLE author_asset (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_user(id), name varchar(160) NOT NULL, mime_type varchar(100) NOT NULL,
 size bigint NOT NULL CHECK(size>0 AND size<=26214400), storage_key varchar(80) NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX author_asset_owner ON author_asset(owner_id,created_at DESC);
CREATE TABLE author_version_asset (
 version_id uuid NOT NULL REFERENCES scenario_version(id), asset_id uuid NOT NULL REFERENCES author_asset(id), PRIMARY KEY(version_id,asset_id)
);
CREATE FUNCTION protect_scenario_version_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.definition IS DISTINCT FROM NEW.definition OR OLD.presentation IS DISTINCT FROM NEW.presentation OR OLD.scenario_id IS DISTINCT FROM NEW.scenario_id OR OLD.version IS DISTINCT FROM NEW.version OR OLD.author_revision IS DISTINCT FROM NEW.author_revision THEN
  RAISE EXCEPTION 'Frozen scenario version content is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_scenario_version BEFORE UPDATE ON scenario_version FOR EACH ROW EXECUTE FUNCTION protect_scenario_version_content();
