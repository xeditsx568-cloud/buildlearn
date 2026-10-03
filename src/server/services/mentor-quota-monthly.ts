/**
 * Atomic monthly mentor AI quota reservation (B-W1-02).
 * Reserve before provider call; release on fallback; commit = keep reservation.
 */

export const RESERVE_MONTHLY_QUOTA_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[2])
end
if current > tonumber(ARGV[1]) then
  redis.call('DECR', KEYS[1])
  return -1
end
return current
`;

export const RELEASE_MONTHLY_QUOTA_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then
  return 0
end
local current = tonumber(raw)
if current <= 0 then
  return 0
end
return redis.call('DECR', KEYS[1])
`;
