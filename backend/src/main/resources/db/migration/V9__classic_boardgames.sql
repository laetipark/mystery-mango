-- 기존 불변 작품·플레이 기록은 보존하고 자동 규칙 고전 게임을 허용한다.
alter table game_session drop constraint game_session_game_type_check;
alter table game_session add constraint game_session_game_type_check check(game_type in ('MURDER_MYSTERY','TABLETOP','YACHT','GOMOKU','REVERSI','CHECKERS'));
alter table sandbox_run drop constraint sandbox_run_game_type_check;
alter table sandbox_run add constraint sandbox_run_game_type_check check(game_type in ('MURDER_MYSTERY','TABLETOP','YACHT','GOMOKU','REVERSI','CHECKERS'));
alter table sandbox_run add constraint classic_sandbox_capacity check(game_type not in ('GOMOKU','REVERSI','CHECKERS') or capacity=2);
alter table match_ticket drop constraint match_ticket_game_type_check;
alter table match_ticket add constraint match_ticket_game_type_check check(game_type in ('MURDER_MYSTERY','TABLETOP','YACHT','GOMOKU','REVERSI','CHECKERS'));
alter table match_ticket add constraint classic_match_capacity check(game_type not in ('GOMOKU','REVERSI','CHECKERS') or capacity=2);
alter table match_proposal drop constraint match_proposal_game_type_check;
alter table match_proposal add constraint match_proposal_game_type_check check(game_type in ('MURDER_MYSTERY','TABLETOP','YACHT','GOMOKU','REVERSI','CHECKERS'));
