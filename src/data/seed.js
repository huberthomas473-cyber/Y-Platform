// Seed content for Y.
// This file is the single source of truth for issue text on the client, and is
// mirrored by supabase/setup.sql for the database. If you edit issue framing
// here, update setup.sql (or re-run its seed section) to match.
//
// NOTE ON SOURCES: every government-position and transparency row below was
// verified against the cited source on 7 Aug 2026 (Phase 2 editorial pass).
// Per-issue verification logs live in docs/source-library/; the standards and
// re-verification cadence are in docs/editorial-rulebook.md. A claim that
// loses its source gets deleted, not kept.

export const ISSUES = [
  {
    id: 'school-meals',
    title: 'Universal School Meals',
    framing:
      'Should every child be guaranteed a free, nutritious meal at school, funded publicly?',
    category: 'Food & Children',
    scope: 'Local · Global',
    sort_order: 1,
  },
  {
    id: 'beach-access',
    title: 'Beach Access in Jamaica',
    framing:
      'Should free public access to Jamaica’s beaches be guaranteed in law for all citizens?',
    category: 'Commons & Access',
    scope: 'Local · Regional',
    sort_order: 2,
  },
  {
    id: 'water-rights',
    title: 'Water as an Enforceable Right',
    framing:
      'Should access to clean drinking water be a legally enforceable human right in every country?',
    category: 'Human Rights',
    scope: 'Global',
    sort_order: 3,
  },
  {
    id: 'land-use',
    title: 'Protect 30% of Land & Sea by 2030',
    framing:
      'Should governments legally protect at least 30% of the planet’s land and oceans for biodiversity by 2030 (the “30×30” target)?',
    category: 'Environment',
    scope: 'Global',
    sort_order: 4,
  },
  {
    id: 'indigenous-land',
    title: 'Indigenous Land Recognition',
    framing:
      'Should Indigenous peoples’ ownership and stewardship of their traditional lands be legally recognized and enforceable?',
    category: 'Rights & Land',
    scope: 'Global',
    sort_order: 5,
  },
  {
    id: 'gaza-humanitarian',
    title: 'Gaza: Sanctions Until Ceasefire & Access',
    framing:
      'Should the international community impose sanctions until there is a ceasefire and full humanitarian access in Gaza?',
    category: 'Peace & Humanitarian Law',
    scope: 'International',
    sort_order: 6,
  },
]

// stance: how institutional action compares to a "yes" on the issue framing.
// 'aligned' | 'partial' | 'opposed' | 'unclear'
export const POSITIONS = [
  {
    issue_id: 'school-meals',
    actor: 'Most national governments',
    position_summary:
      'Only a minority of countries guarantee free school meals for every child; most programmes are targeted or partial. The School Meals Coalition (112 member states as of late 2025) pledges a daily school meal for every child by 2030; programmes reach about 466 million children, with large coverage and funding gaps remaining.',
    stance: 'partial',
    source_label: 'School Meals Coalition — members & progress (verified Aug 2026)',
    source_url: 'https://schoolmealscoalition.org/about/members',
  },
  {
    issue_id: 'beach-access',
    actor: 'Government of Jamaica',
    position_summary:
      'Under the Beach Control Act (1956) the foreshore is Crown property licensed to operators, and there is no general legal right of free beach access. A draft Beach Access and Management Policy went to Cabinet in 2025 and was tabled in March 2026, but campaigners (JaBBEM) say the framework entrenches restrictions rather than dismantling them, and no enforceable guarantee has been enacted (as of Aug 2026).',
    stance: 'partial',
    source_label: 'Beach Control Act (Laws of Jamaica); Jamaica Gleaner (Mar 2026)',
    source_url: 'https://laws.moj.gov.jm/library/statute/the-beach-control-act',
  },
  {
    issue_id: 'water-rights',
    actor: 'UN member states',
    position_summary:
      'The UN General Assembly recognized water and sanitation as a human right in 2010 (Res 64/292), but the right is not enforceable in most national courts. WHO/UNICEF report that 2.1 billion people — 1 in 4 — still lacked safely managed drinking water in 2024.',
    stance: 'partial',
    source_label: 'WHO/UNICEF JMP report 2025 (verified Aug 2026)',
    source_url:
      'https://www.who.int/news/item/26-08-2025-1-in-4-people-globally-still-lack-access-to-safe-drinking-water---who--unicef',
  },
  {
    issue_id: 'land-use',
    actor: 'Parties to the Convention on Biological Diversity',
    position_summary:
      '196 parties adopted the 30×30 target in the 2022 Kunming–Montreal Framework, but the UN’s Protected Planet Report 2024 finds only 17.6% of land and 8.4% of the ocean protected — coverage must nearly double on land, and more than triple at sea, by 2030.',
    stance: 'partial',
    source_label: 'Protected Planet Report 2024 (UNEP-WCMC / IUCN)',
    source_url:
      'https://www.unep.org/news-and-stories/press-release/world-must-act-faster-protect-30-planet-2030',
  },
  {
    issue_id: 'indigenous-land',
    actor: 'UN member states',
    position_summary:
      'The UN Declaration on the Rights of Indigenous Peoples (2007) affirms Indigenous land rights with broad state endorsement, but it is non-binding. Peer-reviewed mapping (Garnett et al. 2018) shows Indigenous peoples manage or hold tenure rights over more than a quarter of the world’s land — intersecting about 40% of protected and ecologically intact areas — while enforceable legal title lags far behind.',
    stance: 'partial',
    source_label: 'UNDRIP; Garnett et al. 2018, Nature Sustainability',
    source_url: 'https://www.nature.com/articles/s41893-018-0100-6',
  },
  {
    issue_id: 'gaza-humanitarian',
    actor: 'UN Security Council / member states',
    position_summary:
      'After repeated ceasefire demands (Res 2728, 2735), the October 2025 Comprehensive Plan brought a ceasefire endorsed by Res 2803 (Nov 2025), authorizing a Board of Peace and an international stabilization force. The UN describes it as holding but fragile into 2026: at least 300 children killed in its first 300 days, 1.8 million people displaced and dependent on aid, transitional bodies not yet operating on the ground, and a staged Hamas disarmament roadmap announced only on 31 July 2026. No sanctions regime tied to compliance was ever imposed.',
    stance: 'partial',
    source_label: 'UNSC Res 2803; UN News (Aug 2026); SC humanitarian briefing (Jun 2026)',
    source_url: 'https://news.un.org/en/story/2026/08/1168088',
  },
]

// Transparency rows — publicly documented ownership facts, each verified
// against the cited source on 7 Aug 2026. Qualitative descriptions only, no
// invented figures. Verification logs: docs/source-library/<issue>.md.
export const TRANSPARENCY = [
  {
    company: 'Primo Brands (Poland Spring, Pure Life)',
    parent_company:
      'Publicly traded (NYSE: PRMB) — formed 2024 by merger of BlueTriton Brands (One Rock Capital Partners / Metropoulos & Co.) and Primo Water',
    connections:
      'Leading North American branded bottled-water company; groundwater extraction permits and related lobbying documented in state registers and SEC filings.',
    issue_id: 'water-rights',
    source_label: 'Primo Brands merger completion (Nov 2024); SEC filings',
    source_url:
      'https://www.prnewswire.com/news-releases/primo-brands-corporation-announces-successful-completion-of-merger-of-primo-water-and-bluetriton-brands-302300326.html',
  },
  {
    company: 'Sandals Resorts International',
    parent_company: 'Privately held (Stewart family; Adam Stewart, Executive Chairman)',
    connections:
      'Operates resorts with licensed private beach access under Jamaica’s Beach Control Act; 2025 reports that the company explored a sale were denied by its leadership in June 2026.',
    issue_id: 'beach-access',
    source_label: 'Skift (Jun 2026); Companies Office of Jamaica',
    source_url: 'https://skift.com/2026/06/30/not-for-sale-sandals-ceo-shuts-down-deal-rumors/',
  },
  {
    company: 'Cargill',
    parent_company: 'Privately held (Cargill–MacMillan family)',
    connections:
      'Registered US federal lobbying on agriculture and trade policy (about $1.4M in 2025, per OpenSecrets); major agri-food supplier, including commodities used in institutional and school food programmes.',
    issue_id: 'school-meals',
    source_label: 'OpenSecrets — Cargill Inc lobbying profile',
    source_url: 'https://www.opensecrets.org/federal-lobbying/clients/summary?id=D000000511',
  },
  {
    company: 'JBS',
    parent_company:
      'Publicly traded (NYSE: JBS, dual-listed Jun 2025); controlled by J&F Investimentos (Batista family)',
    connections:
      'World’s largest meat processor; deforestation-linked supply-chain findings documented in public audits and raised by NGOs at its US listing.',
    issue_id: 'land-use',
    source_label: 'Global Witness (2025); JBS NYSE listing announcement (Jun 2025)',
    source_url:
      'https://globalwitness.org/en/campaigns/forests/meat-giant-jbs-guts-human-rights-commitments-and-sidesteps-climate-scrutiny-in-bid-for-nyse-listing/',
  },
  {
    company: 'Glencore',
    parent_company: 'Publicly traded (LSE: GLEN)',
    connections:
      'Copper and coal operations overlap Indigenous territories; documented consultation disputes include the Antapaccay/Espinar expansion (Peru) and Cerrejón in La Guajira (Colombia), where Wayuu communities report water impacts.',
    issue_id: 'indigenous-land',
    source_label: 'Business & Human Rights Resource Centre (verified Aug 2026)',
    source_url:
      'https://www.business-humanrights.org/en/latest-news/peru-indigenous-communities-protest-against-glencores-antapaccay-copper-mine-expansion-concerned-with-environmental-damage/',
  },
  {
    company: 'Elbit Systems',
    parent_company: 'Publicly traded (TASE / NASDAQ: ESLT)',
    connections:
      'Major Israeli defence supplier; excluded on ethics-screening grounds by Norway’s Government Pension Fund Global (2009, over surveillance systems for the West Bank separation barrier), Dutch pension fund PFZW (2012), and Norway’s KLP (2021), among others.',
    issue_id: 'gaza-humanitarian',
    source_label: 'Norwegian Ministry of Finance / Council on Ethics (2009); AFSC Investigate',
    source_url:
      'https://www.regjeringen.no/en/dokumenter/the-council-on-ethics-recommends-that-th/id575451/',
  },
]

// Baseline aggregate counts used ONLY in local demo mode (no Supabase
// configured), so the interface has something to render. Clearly labelled
// illustrative in the UI. Real deployments start from zero honest votes.
export const DEMO_BASELINE = {
  'school-meals': { yes: 412, no: 61, abstain: 24 },
  'beach-access': { yes: 358, no: 42, abstain: 31 },
  'water-rights': { yes: 501, no: 38, abstain: 19 },
  'land-use': { yes: 377, no: 84, abstain: 40 },
  'indigenous-land': { yes: 402, no: 57, abstain: 35 },
  'gaza-humanitarian': { yes: 366, no: 98, abstain: 57 },
}

export const STANCE_LABELS = {
  aligned: 'Aligned',
  partial: 'Partially aligned',
  opposed: 'Diverges',
  unclear: 'Unclear',
}

// Illustrative alignment score used by the Discrepancy gap meter.
export const STANCE_SCORE = { aligned: 100, partial: 50, opposed: 8, unclear: null }
