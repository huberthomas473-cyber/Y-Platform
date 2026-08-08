-- ============================================================
-- Y — Phase 1 migration: account-based, server-mediated voting
-- Run once in the SQL Editor of an EXISTING project that already
-- ran setup.sql. (Fresh projects: just run setup.sql, which now
-- includes this end-state.)
--
-- What this does:
--   1. Removes ALL client write access to votes. The only write
--      path left is /api/vote (service role), which verifies the
--      user's session and rate-limits.
--   2. Removes public read access to RAW votes. Individual rows
--      (voter_id + choice) were previously readable by anyone —
--      unacceptable once voter_id is a real account id. Signed-in
--      users can read ONLY their own rows (for "your vote: yes").
--   3. Recreates vote_totals as an owner view (no security_invoker),
--      so public aggregate counts keep working over the now-private
--      votes table. Aggregates only — the view exposes no voter ids.
-- ============================================================

-- 1 + 2: replace the MVP policies.
-- Dropped by enumeration rather than by name: a name-based `drop policy if
-- exists` silently succeeds when the deployed policy is called something else,
-- which would leave the table wide open while the migration reports success.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'votes'
  loop
    execute format('drop policy %I on public.votes', pol.policyname);
  end loop;
end $$;

create policy "voters read their own votes"
  on votes for select
  to authenticated
  using (voter_id = (select auth.uid()));

-- 3: public aggregates over private rows.
-- The view runs with its owner's rights (security_invoker OFF — deliberate;
-- Supabase's linter will flag it, which is expected for this pattern).
drop view if exists vote_totals;
create view vote_totals as
select
  issue_id,
  count(*) filter (where choice = 'yes')     as yes,
  count(*) filter (where choice = 'no')      as no,
  count(*) filter (where choice = 'abstain') as abstain,
  count(*)                                   as total
from votes
group by issue_id;

grant select on vote_totals to anon, authenticated;

-- Reset pre-Phase-1 votes. Earlier rows belong to anonymous DEVICE ids that
-- no account owns, so they would sit in the totals forever, uncorrectable.
-- Comment this line out if you want to keep them.
truncate table votes;
