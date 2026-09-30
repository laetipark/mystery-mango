-- Early development builds returned invitation tokens in command acknowledgements.
-- Invitations remain hash-only; remove any legacy plaintext copies from the cache.
UPDATE command_result
SET result = result - 'token' - 'inviteToken'
WHERE (scope = 'room.create' OR scope LIKE 'room.invite:%')
  AND (result ? 'token' OR result ? 'inviteToken');
