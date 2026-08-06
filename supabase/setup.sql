-- ============================================================
-- Y — Supabase schema + seed data
-- Run this once in your Supabase project: SQL Editor → paste → Run.
-- Safe to re-run: drops and recreates everything (including votes!),
-- so only re-run the full file before launch / to reset.
-- ============================================================

drop view if exists vote_totals;
drop table if exists deliberation_messages;
drop table if exists votes;
drop table if exists transparency_entries;
drop table if exists government_positions;
drop table if exists issues;

-- ------------------------------------------------------------
-- Issues on the ballot
-- ------------------------------------------------------------
create table issues (
  id         text primary key,          -- slug, e.g. 'school-meals'
  title      text not null,
  framing    text not null,             -- short neutral framing statement
  category   text not null,
  scope      text not null,             -- Local / Regional / Global / International
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Votes
--
-- ANTI-DUPLICATE (MVP): one vote per browser/device, enforced by a
-- unique (issue_id, voter_id) constraint where voter_id is a random
-- UUID stored in the device's localStorage. This is deliberately weak:
-- clearing storage or scripting the API creates new "voters".
-- Real identity verification (one-person-one-vote) is a known unsolved
-- problem and an explicit LATER-PHASE item — do not over-engineer here.
-- The next hardening step would be moving vote writes behind a server
-- endpoint with rate limiting; after that, privacy-preserving identity.
-- ------------------------------------------------------------
create table votes (
  id         uuid primary key default gen_random_uuid(),
  issue_id   text not null references issues(id) on delete cascade,
  voter_id   uuid not null,             -- device identifier, NOT an identity
  choice     text not null check (choice in ('yes', 'no', 'abstain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_id, voter_id)
);

create index votes_issue_idx on votes (issue_id);

-- Aggregates, computed in the database so clients never fetch raw votes.
create view vote_totals
  with (security_invoker = on) as
select
  issue_id,
  count(*) filter (where choice = 'yes')     as yes,
  count(*) filter (where choice = 'no')      as no,
  count(*) filter (where choice = 'abstain') as abstain,
  count(*)                                   as total
from votes
group by issue_id;

-- ------------------------------------------------------------
-- Discrepancy: what institutions actually do/say per issue
-- ------------------------------------------------------------
create table government_positions (
  id               uuid primary key default gen_random_uuid(),
  issue_id         text not null references issues(id) on delete cascade,
  actor            text not null,       -- e.g. 'UN member states'
  position_summary text not null,
  stance           text not null check (stance in ('aligned', 'partial', 'opposed', 'unclear')),
  source_label     text,
  source_url       text,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Transparency: ownership chains + political connections.
-- Schema is built for real sourced data later; rows seeded below are
-- clearly-labelled samples.
-- ------------------------------------------------------------
create table transparency_entries (
  id             uuid primary key default gen_random_uuid(),
  company        text not null,
  parent_company text,
  connections    text,                  -- qualitative summary; add typed columns later as data matures
  issue_id       text references issues(id) on delete set null,
  source_label   text,
  source_url     text,
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Deliberation messages (private per device-session).
-- No anon policies on purpose: only the server (service-role key,
-- which bypasses RLS) reads/writes these, so one participant can
-- never read another's conversation.
-- ------------------------------------------------------------
create table deliberation_messages (
  id         uuid primary key default gen_random_uuid(),
  issue_id   text not null references issues(id) on delete cascade,
  session_id uuid not null,             -- device session (same id as voter_id)
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index deliberation_session_idx on deliberation_messages (issue_id, session_id, created_at);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table issues                 enable row level security;
alter table votes                  enable row level security;
alter table government_positions   enable row level security;
alter table transparency_entries   enable row level security;
alter table deliberation_messages  enable row level security;

create policy "issues are public"        on issues               for select using (true);
create policy "positions are public"     on government_positions for select using (true);
create policy "transparency is public"   on transparency_entries for select using (true);

-- Votes: public can insert, read (needed for the totals view), and update
-- their vote via upsert. NOTE: with anonymous device identity, update
-- access cannot be scoped per voter at the RLS layer — tampering via
-- crafted API calls is possible and accepted for MVP (see the identity
-- note above). Server-mediated voting is the phase-2 fix.
create policy "anyone can vote"          on votes for insert with check (choice in ('yes', 'no', 'abstain'));
create policy "vote counts are public"   on votes for select using (true);
create policy "votes can be changed"     on votes for update using (true) with check (choice in ('yes', 'no', 'abstain'));

-- deliberation_messages: no policies → anon key has zero access (service role only).

-- ------------------------------------------------------------
-- Seed: issues (keep in sync with src/data/seed.js)
-- ------------------------------------------------------------
insert into issues (id, title, framing, category, scope, sort_order) values
  ('school-meals', 'Universal School Meals',
   'Should every child be guaranteed a free, nutritious meal at school, funded publicly?',
   'Food & Children', 'Local · Global', 1),
  ('beach-access', 'Beach Access in Jamaica',
   'Should free public access to Jamaica’s beaches be guaranteed in law for all citizens?',
   'Commons & Access', 'Local · Regional', 2),
  ('water-rights', 'Water as an Enforceable Right',
   'Should access to clean drinking water be a legally enforceable human right in every country?',
   'Human Rights', 'Global', 3),
  ('land-use', 'Protect 30% of Land & Sea by 2030',
   'Should governments legally protect at least 30% of the planet’s land and oceans for biodiversity by 2030 (the “30×30” target)?',
   'Environment', 'Global', 4),
  ('indigenous-land', 'Indigenous Land Recognition',
   'Should Indigenous peoples’ ownership and stewardship of their traditional lands be legally recognized and enforceable?',
   'Rights & Land', 'Global', 5),
  ('gaza-humanitarian', 'Gaza: Sanctions Until Ceasefire & Access',
   'Should the international community impose sanctions until there is a ceasefire and full humanitarian access in Gaza?',
   'Peace & Humanitarian Law', 'International', 6);

-- ------------------------------------------------------------
-- Seed: institutional positions (curated Aug 2026 — verify before launch)
-- ------------------------------------------------------------
insert into government_positions (issue_id, actor, position_summary, stance, source_label, source_url) values
  ('school-meals', 'Most national governments',
   'Only a minority of countries provide universal free school meals; most programmes are means-tested or partial. The School Meals Coalition (90+ countries) has pledged expansion by 2030, but funding gaps persist.',
   'partial', 'School Meals Coalition', 'https://schoolmealscoalition.org'),
  ('beach-access', 'Government of Jamaica',
   'Under the Beach Control Act (1956), most of the foreshore is Crown land licensed to private operators; there is no general legal guarantee of free public beach access. Reform has been discussed but not enacted.',
   'opposed', 'Beach Control Act, Laws of Jamaica', 'https://moj.gov.jm/laws'),
  ('water-rights', 'UN member states',
   'The UN General Assembly recognized water and sanitation as a human right in 2010 (Res 64/292), but the right is not enforceable in most national courts, and roughly 2 billion people still lack safely managed drinking water (WHO/UNICEF).',
   'partial', 'WHO/UNICEF Joint Monitoring Programme', 'https://washdata.org'),
  ('land-use', 'Parties to the Convention on Biological Diversity',
   '196 parties adopted the 30×30 target in the 2022 Kunming–Montreal Framework, but only about 17% of land and 8% of the ocean is currently protected, and finance commitments lag far behind.',
   'partial', 'CBD / Protected Planet', 'https://www.protectedplanet.net'),
  ('indigenous-land', 'UN member states',
   'The UN Declaration on the Rights of Indigenous Peoples (2007) affirms Indigenous land rights and has broad state endorsement, but it is non-binding; Indigenous peoples steward a large share of the world’s intact lands while holding legal title to far less.',
   'partial', 'UNDRIP (UN DESA)', 'https://www.un.org/development/desa/indigenouspeoples/declaration-on-the-rights-of-indigenous-peoples.html'),
  ('gaza-humanitarian', 'UN Security Council / member states',
   'Security Council resolutions have demanded ceasefires and humanitarian access (e.g. Res 2728, 2735), but no comprehensive international sanctions regime tied to compliance exists; several proposed measures have been vetoed and enforcement remains contested.',
   'opposed', 'UN Security Council resolutions', 'https://www.un.org/securitycouncil/content/resolutions-0');

-- ------------------------------------------------------------
-- Seed: transparency SAMPLES (replace with verified data before launch)
-- ------------------------------------------------------------
insert into transparency_entries (company, parent_company, connections, issue_id, source_label, source_url) values
  ('BlueTriton Brands (Poland Spring, Pure Life)',
   'One Rock Capital Partners / Metropoulos & Co. (acquired from Nestlé, 2021)',
   'Bottled-water operations; lobbying on groundwater extraction permits appears in public state registers.',
   'water-rights', 'Sample entry — verify via OpenSecrets / state lobbying registers', 'https://www.opensecrets.org'),
  ('Sandals Resorts International', 'Privately held (Stewart family)',
   'Operates resorts with licensed private beach access under Jamaica’s Beach Control Act.',
   'beach-access', 'Sample entry — verify via Companies Office of Jamaica', 'https://www.orcjamaica.com'),
  ('Cargill', 'Privately held (Cargill–MacMillan family)',
   'Registered federal lobbying on agriculture and nutrition policy (US); supplier in school-food procurement markets.',
   'school-meals', 'Sample entry — verify via OpenSecrets lobbying data', 'https://www.opensecrets.org'),
  ('JBS', 'J&F Investimentos (Batista family)',
   'World’s largest meat processor; deforestation-linked supply-chain findings documented in public audits.',
   'land-use', 'Sample entry — verify via public audit reports', 'https://www.jbs.com.br'),
  ('Glencore', 'Publicly traded (LSE: GLEN)',
   'Mining concessions overlapping Indigenous territories; consultation disputes documented publicly in several countries.',
   'indigenous-land', 'Sample entry — verify via company filings / NGO reports', 'https://www.glencore.com'),
  ('Elbit Systems', 'Publicly traded (TASE / NASDAQ: ESLT)',
   'Major defense supplier; named in publicized divestment decisions by several European pension funds.',
   'gaza-humanitarian', 'Sample entry — verify via fund divestment statements', 'https://elbitsystems.com');
