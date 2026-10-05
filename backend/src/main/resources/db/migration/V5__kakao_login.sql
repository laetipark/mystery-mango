alter table app_user alter column email drop not null;
alter table app_user alter column password_hash drop not null;
alter table app_user add column kakao_id varchar(32) unique;
alter table app_user add constraint app_user_has_login check ((email is not null and password_hash is not null) or kakao_id is not null);
alter table app_user add constraint app_user_kakao_id_format check (kakao_id is null or kakao_id ~ '^[1-9][0-9]{0,18}$');

-- No provider access/refresh tokens, raw state, session IDs, or emails are stored here.
create table kakao_login_state (
 state_hash char(64) primary key,
 session_hash char(64) not null unique,
 next_path varchar(2048) not null,
 expires_at timestamptz not null
);
create index kakao_login_state_expiry on kakao_login_state(expires_at);
