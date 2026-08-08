-- ============================================================
-- Phase 2 content migration — verified editorial pass, 7 Aug 2026
--
-- Replaces the CONTENT rows (government_positions, transparency_entries)
-- with source-verified versions. Does NOT touch issues, votes, or
-- deliberation_messages — safe to run on a live database at any time.
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- Verification logs: docs/source-library/   Rules: docs/editorial-rulebook.md
-- ============================================================

begin;

delete from government_positions;
delete from transparency_entries;

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

commit;

-- Reminder (editorial, not SQL): docs/source-library/gaza-humanitarian.md flags
-- the gaza-humanitarian BALLOT QUESTION itself for retire-and-replace under
-- rulebook §4 — its "until there is a ceasefire" premise is stale. Retiring an
-- issue is a product decision; this migration deliberately does not do it.
