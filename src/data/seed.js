// Seed content for Y.
// This file is the single source of truth for issue text on the client, and is
// mirrored by supabase/setup.sql for the database. If you edit issue framing
// here, update setup.sql (or re-run its seed section) to match.
//
// NOTE ON SOURCES: government-position and transparency rows are hand-curated
// SEED DATA (curated August 2026). Verify every source link and claim before a
// public launch — the UI labels them as sample/seed data until then.

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
      'Only a minority of countries provide universal free school meals; most programmes are means-tested or partial. The School Meals Coalition (90+ countries) has pledged expansion by 2030, but funding gaps persist.',
    stance: 'partial',
    source_label: 'School Meals Coalition',
    source_url: 'https://schoolmealscoalition.org',
  },
  {
    issue_id: 'beach-access',
    actor: 'Government of Jamaica',
    position_summary:
      'Under the Beach Control Act (1956), most of the foreshore is Crown land licensed to private operators; there is no general legal guarantee of free public beach access. Reform has been discussed but not enacted.',
    stance: 'opposed',
    source_label: 'Beach Control Act, Laws of Jamaica',
    source_url: 'https://moj.gov.jm/laws',
  },
  {
    issue_id: 'water-rights',
    actor: 'UN member states',
    position_summary:
      'The UN General Assembly recognized water and sanitation as a human right in 2010 (Res 64/292), but the right is not enforceable in most national courts, and roughly 2 billion people still lack safely managed drinking water (WHO/UNICEF).',
    stance: 'partial',
    source_label: 'WHO/UNICEF Joint Monitoring Programme',
    source_url: 'https://washdata.org',
  },
  {
    issue_id: 'land-use',
    actor: 'Parties to the Convention on Biological Diversity',
    position_summary:
      '196 parties adopted the 30×30 target in the 2022 Kunming–Montreal Framework, but only about 17% of land and 8% of the ocean is currently protected, and finance commitments lag far behind.',
    stance: 'partial',
    source_label: 'CBD / Protected Planet',
    source_url: 'https://www.protectedplanet.net',
  },
  {
    issue_id: 'indigenous-land',
    actor: 'UN member states',
    position_summary:
      'The UN Declaration on the Rights of Indigenous Peoples (2007) affirms Indigenous land rights and has broad state endorsement, but it is non-binding; Indigenous peoples steward a large share of the world’s intact lands while holding legal title to far less.',
    stance: 'partial',
    source_label: 'UNDRIP (UN DESA)',
    source_url:
      'https://www.un.org/development/desa/indigenouspeoples/declaration-on-the-rights-of-indigenous-peoples.html',
  },
  {
    issue_id: 'gaza-humanitarian',
    actor: 'UN Security Council / member states',
    position_summary:
      'Security Council resolutions have demanded ceasefires and humanitarian access (e.g. Res 2728, 2735), but no comprehensive international sanctions regime tied to compliance exists; several proposed measures have been vetoed and enforcement remains contested.',
    stance: 'opposed',
    source_label: 'UN Security Council resolutions',
    source_url: 'https://www.un.org/securitycouncil/content/resolutions-0',
  },
]

// SAMPLE transparency rows — illustrative structure with publicly documented
// ownership facts; qualitative descriptions only, no invented figures.
// Replace with verified, sourced data before public launch.
export const TRANSPARENCY = [
  {
    company: 'BlueTriton Brands (Poland Spring, Pure Life)',
    parent_company: 'One Rock Capital Partners / Metropoulos & Co. (acquired from Nestlé, 2021)',
    connections:
      'Bottled-water operations; lobbying on groundwater extraction permits appears in public state registers.',
    issue_id: 'water-rights',
    source_label: 'Sample entry — verify via OpenSecrets / state lobbying registers',
    source_url: 'https://www.opensecrets.org',
  },
  {
    company: 'Sandals Resorts International',
    parent_company: 'Privately held (Stewart family)',
    connections:
      'Operates resorts with licensed private beach access under Jamaica’s Beach Control Act.',
    issue_id: 'beach-access',
    source_label: 'Sample entry — verify via Companies Office of Jamaica',
    source_url: 'https://www.orcjamaica.com',
  },
  {
    company: 'Cargill',
    parent_company: 'Privately held (Cargill–MacMillan family)',
    connections:
      'Registered federal lobbying on agriculture and nutrition policy (US); supplier in school-food procurement markets.',
    issue_id: 'school-meals',
    source_label: 'Sample entry — verify via OpenSecrets lobbying data',
    source_url: 'https://www.opensecrets.org',
  },
  {
    company: 'JBS',
    parent_company: 'J&F Investimentos (Batista family)',
    connections:
      'World’s largest meat processor; deforestation-linked supply-chain findings documented in public audits.',
    issue_id: 'land-use',
    source_label: 'Sample entry — verify via public audit reports',
    source_url: 'https://www.jbs.com.br',
  },
  {
    company: 'Glencore',
    parent_company: 'Publicly traded (LSE: GLEN)',
    connections:
      'Mining concessions overlapping Indigenous territories; consultation disputes documented publicly in several countries.',
    issue_id: 'indigenous-land',
    source_label: 'Sample entry — verify via company filings / NGO reports',
    source_url: 'https://www.glencore.com',
  },
  {
    company: 'Elbit Systems',
    parent_company: 'Publicly traded (TASE / NASDAQ: ESLT)',
    connections:
      'Major defense supplier; named in publicized divestment decisions by several European pension funds.',
    issue_id: 'gaza-humanitarian',
    source_label: 'Sample entry — verify via fund divestment statements',
    source_url: 'https://elbitsystems.com',
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
