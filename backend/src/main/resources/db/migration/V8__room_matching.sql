alter table room add column capacity integer check(capacity between 1 and 4);
alter table room add column is_test boolean not null default false;
alter table room add constraint test_room_private check(not is_test or visibility='INVITE');
alter table match_ticket add column game_type text not null default 'MURDER_MYSTERY' check(game_type in ('MURDER_MYSTERY','TABLETOP','YACHT'));
alter table match_ticket add column scenario_version_id uuid references scenario_version(id);
alter table match_ticket add column capacity integer not null default 4 check(capacity between 2 and 4);
alter table match_ticket add constraint match_game_conditions check((game_type='MURDER_MYSTERY' and capacity=4 and scenario_version_id is null) or (game_type<>'MURDER_MYSTERY' and scenario_version_id is not null));
alter table match_proposal add column game_type text not null default 'MURDER_MYSTERY' check(game_type in ('MURDER_MYSTERY','TABLETOP','YACHT'));
create index board_queue on match_ticket(game_type,scenario_version_id,capacity,mode,language,queued_at,id) where status='WAITING';
-- 이전 로그인 시도에서 초대 원문이 저장된 복귀 쿼리는 보존하지 않는다.
update kakao_login_state set next_path=split_part(next_path,'?',1) where position('?' in next_path)>0;
