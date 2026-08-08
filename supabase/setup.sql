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
-- ANTI-DUPLICATE (Phase 1): one vote per ACCOUNT, enforced by a
-- unique (issue_id, voter_id) constraint where voter_id is the
-- Supabase Auth user id (one confirmed email = one account).
-- Clients cannot write to this table at all — every vote goes
-- through /api/vote, which verifies the session token server-side
-- and rate-limits. This is deliberately still not one-vote-per-
-- PERSON: multiple email addresses defeat it. Real identity
-- verification is a known unsolved problem and a LATER-PHASE item;
-- the app says so publicly in "How voting works".
-- ------------------------------------------------------------
create table votes (
  id         uuid primary key default gen_random_uuid(),
  issue_id   text not null references issues(id) on delete cascade,
  voter_id   uuid not null,             -- auth.users id (account identity)
  choice     text not null check (choice in ('yes', 'no', 'abstain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_id, voter_id)
);

create index votes_issue_idx on votes (issue_id);

-- Public aggregates over private rows: the view runs with its owner's
-- rights (security_invoker OFF — deliberate; Supabase's linter flags
-- SECURITY DEFINER views, which is expected for this pattern). It
-- exposes counts only, never voter ids.
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

-- Votes: NO client write policies — the browser cannot insert or update
-- votes. The only write path is /api/vote (service role, bypasses RLS),
-- which verifies the user's session token and rate-limits. Signed-in
-- users can read only their own rows (for "your vote: yes"); public
-- results come exclusively from the aggregate vote_totals view.
create policy "voters read their own votes"
  on votes for select
  to authenticated
  using (voter_id = (select auth.uid()));

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
-- Seed: institutional positions
-- Verified 7 Aug 2026 (Phase 2 editorial pass). Every claim traces to the
-- per-issue log in docs/source-library/. Keep in sync with src/data/seed.js.
-- ------------------------------------------------------------
insert into government_positions (issue_id, actor, position_summary, stance, source_label, source_url) values
  ('school-meals', 'Most national governments',
   'Only a minority of countries guarantee free school meals for every child; most programmes are targeted or partial. The School Meals Coalition (112 member states as of late 2025) pledges a daily school meal for every child by 2030; programmes reach about 466 million children, with large coverage and funding gaps remaining.',
   'partial', 'School Meals Coalition — members & progress (verified Aug 2026)', 'https://schoolmealscoalition.org/about/members'),
  ('beach-access', 'Government of Jamaica',
   'Under the Beach Control Act (1956) the foreshore is Crown property licensed to operators, and there is no general legal right of free beach access. A draft Beach Access and Management Policy went to Cabinet in 2025 and was tabled in March 2026, but campaigners (JaBBEM) say the framework entrenches restrictions rather than dismantling them, and no enforceable guarantee has been enacted (as of Aug 2026).',
   'partial', 'Beach Control Act (Laws of Jamaica); Jamaica Gleaner (Mar 2026)', 'https://laws.moj.gov.jm/library/statute/the-beach-control-act'),
  ('water-rights', 'UN member states',
   'The UN General Assembly recognized water and sanitation as a human right in 2010 (Res 64/292), but the right is not enforceable in most national courts. WHO/UNICEF report that 2.1 billion people — 1 in 4 — still lacked safely managed drinking water in 2024.',
   'partial', 'WHO/UNICEF JMP report 2025 (verified Aug 2026)', 'https://www.who.int/news/item/26-08-2025-1-in-4-people-globally-still-lack-access-to-safe-drinking-water---who--unicef'),
  ('land-use', 'Parties to the Convention on Biological Diversity',
   '196 parties adopted the 30×30 target in the 2022 Kunming–Montreal Framework, but the UN’s Protected Planet Report 2024 finds only 17.6% of land and 8.4% of the ocean protected — coverage must nearly double on land, and more than triple at sea, by 2030.',
   'partial', 'Protected Planet Report 2024 (UNEP-WCMC / IUCN)', 'https://www.unep.org/news-and-stories/press-release/world-must-act-faster-protect-30-planet-2030'),
  ('indigenous-land', 'UN member states',
   'The UN Declaration on the Rights of Indigenous Peoples (2007) affirms Indigenous land rights with broad state endorsement, but it is non-binding. Peer-reviewed mapping (Garnett et al. 2018) shows Indigenous peoples manage or hold tenure rights over more than a quarter of the world’s land — intersecting about 40% of protected and ecologically intact areas — while enforceable legal title lags far behind.',
   'partial', 'UNDRIP; Garnett et al. 2018, Nature Sustainability', 'https://www.nature.com/articles/s41893-018-0100-6'),
  ('gaza-humanitarian', 'UN Security Council / member states',
   'After repeated ceasefire demands (Res 2728, 2735), the October 2025 Comprehensive Plan brought a ceasefire endorsed by Res 2803 (Nov 2025), authorizing a Board of Peace and an international stabilization force. The UN describes it as holding but fragile into 2026: at least 300 children killed in its first 300 days, 1.8 million people displaced and dependent on aid, transitional bodies not yet operating on the ground, and a staged Hamas disarmament roadmap announced only on 31 July 2026. No sanctions regime tied to compliance was ever imposed.',
   'partial', 'UNSC Res 2803; UN News (Aug 2026); SC humanitarian briefing (Jun 2026)', 'https://news.un.org/en/story/2026/08/1168088');

-- ------------------------------------------------------------
-- Seed: transparency entries
-- Verified 7 Aug 2026 (Phase 2 editorial pass). Publicly documented
-- ownership facts only; per-issue logs in docs/source-library/.
-- ------------------------------------------------------------
insert into transparency_entries (company, parent_company, connections, issue_id, source_label, source_url) values
  ('Primo Brands (Poland Spring, Pure Life)',
   'Publicly traded (NYSE: PRMB) — formed 2024 by merger of BlueTriton Brands (One Rock Capital Partners / Metropoulos & Co.) and Primo Water',
   'Leading North American branded bottled-water company; groundwater extraction permits and related lobbying documented in state registers and SEC filings.',
   'water-rights', 'Primo Brands merger completion (Nov 2024); SEC filings', 'https://www.prnewswire.com/news-releases/primo-brands-corporation-announces-successful-completion-of-merger-of-primo-water-and-bluetriton-brands-302300326.html'),
  ('Sandals Resorts International', 'Privately held (Stewart family; Adam Stewart, Executive Chairman)',
   'Operates resorts with licensed private beach access under Jamaica’s Beach Control Act; 2025 reports that the company explored a sale were denied by its leadership in June 2026.',
   'beach-access', 'Skift (Jun 2026); Companies Office of Jamaica', 'https://skift.com/2026/06/30/not-for-sale-sandals-ceo-shuts-down-deal-rumors/'),
  ('Cargill', 'Privately held (Cargill–MacMillan family)',
   'Registered US federal lobbying on agriculture and trade policy (about $1.4M in 2025, per OpenSecrets); major agri-food supplier, including commodities used in institutional and school food programmes.',
   'school-meals', 'OpenSecrets — Cargill Inc lobbying profile', 'https://www.opensecrets.org/federal-lobbying/clients/summary?id=D000000511'),
  ('JBS',
   'Publicly traded (NYSE: JBS, dual-listed Jun 2025); controlled by J&F Investimentos (Batista family)',
   'World’s largest meat processor; deforestation-linked supply-chain findings documented in public audits and raised by NGOs at its US listing.',
   'land-use', 'Global Witness (2025); JBS NYSE listing announcement (Jun 2025)', 'https://globalwitness.org/en/campaigns/forests/meat-giant-jbs-guts-human-rights-commitments-and-sidesteps-climate-scrutiny-in-bid-for-nyse-listing/'),
  ('Glencore', 'Publicly traded (LSE: GLEN)',
   'Copper and coal operations overlap Indigenous territories; documented consultation disputes include the Antapaccay/Espinar expansion (Peru) and Cerrejón in La Guajira (Colombia), where Wayuu communities report water impacts.',
   'indigenous-land', 'Business & Human Rights Resource Centre (verified Aug 2026)', 'https://www.business-humanrights.org/en/latest-news/peru-indigenous-communities-protest-against-glencores-antapaccay-copper-mine-expansion-concerned-with-environmental-damage/'),
  ('Elbit Systems', 'Publicly traded (TASE / NASDAQ: ESLT)',
   'Major Israeli defence supplier; excluded on ethics-screening grounds by Norway’s Government Pension Fund Global (2009, over surveillance systems for the West Bank separation barrier), Dutch pension fund PFZW (2012), and Norway’s KLP (2021), among others.',
   'gaza-humanitarian', 'Norwegian Ministry of Finance / Council on Ethics (2009); AFSC Investigate', 'https://www.regjeringen.no/en/dokumenter/the-council-on-ethics-recommends-that-th/id575451/');
