# Y — Roadmap: from prototype to reality

*This document is written for humans, not programmers. If you're a student
thinking about volunteering: welcome — there is a job here for you whether or
not you've ever written code. Technical terms are explained in (brackets) as
they appear.*

---

## Where the project stands today

**The app is built and it works.** All four sections exist: voting
(Referendum), the gap between public opinion and government action
(Discrepancy), the who-owns-whom database (Transparency), and the neutral AI
discussion guide (Deliberate). Anyone can download this repository and see the
whole thing running on their own computer in about ten minutes, with example
data — no accounts or passwords needed.

**What it is not yet:** live on the internet, filled with verified real-world
data, or protected against cheating. Getting from here to a real public
platform is not mainly a programming problem — most of the remaining work is
research, writing, organizing, and community-building. That's why this roadmap
exists.

## The three things that will decide whether Y succeeds

Before the task list, the honest picture. We researched every platform that
has ever tried something like Y (the full findings are in
[docs/similar-platforms.md](docs/similar-platforms.md)). Nobody has ever built
this exact combination — but many have tried pieces of it, and almost all of
them died of the same three causes. These are the real enemies:

1. **Trust.** The moment a journalist looks at Y, they will ask: "how do I
   know these votes are real?" Right now, one person could vote thousands of
   times with a bit of technical effort. Until that's fixed, Y's numbers can't
   be quoted anywhere — and being quotable is the entire product.

2. **Credibility.** Every claim in the Discrepancy and Transparency sections
   ("the government promised X", "company A owns company B") must have a
   source a reader can check. One wrong claim, publicly debunked, could sink
   the whole project. The current data is example/placeholder data — every row
   needs to be verified or replaced before launch.

3. **Consequence and distribution.** The platforms that died (and there are
   many) all had the same experience: nobody showed up, and when people did
   vote, nothing happened afterwards. The ones that survived — in Taiwan and
   Estonia — survived because reaching the vote threshold *forced an official
   response*. Y needs an answer to two questions: *"How do people find out Y
   exists?"* and *"What actually happens when an issue reaches 75%?"* Neither
   is a software question. Both are the most important questions in this file.

---

## Phase 0 — Switch it on *(one technical volunteer, one weekend)*

The app currently runs in "demo mode". Making it real requires creating three
free accounts and connecting them. The step-by-step instructions are already
written in the [README](README.md) under "Go live". In plain terms:

- [ ] Create a **Supabase** account (a free online database — this is where
      votes are permanently stored so they survive when you close the browser).
- [ ] Create an **Anthropic** account and API key (this powers the neutral AI
      facilitator in the Deliberate section; costs a small amount per
      conversation, expect pocket-money amounts at first).
- [ ] Create a **Vercel** account (free web hosting — this puts the app on the
      internet at a real address).
- [ ] Buy a domain name (the web address, e.g. `y-assembly.org` — roughly
      €10–15/year, the only unavoidable cost).

**Who can do this:** any computer-science or web-development student. It's
copy-paste-level work; everything is documented.

## Phase 1 — Make it trustworthy *(2–3 developer volunteers, 1–2 months)*

This phase attacks enemy #1 (trust). Right now the app remembers "one vote per
browser", which is easy to trick. The goal is not perfect identity
verification (nobody on Earth has solved that) — the goal is making cheating
*hard enough* that Y's numbers are defensible.

- [x] **Move vote-counting behind a guarded door.** Done (Aug 2026): all
      votes go through `/api/vote`, which verifies the session token,
      rate-limits per IP/user plus a per-issue cooldown, and is the only
      write path (RLS blocks client writes entirely).
- [x] **Add simple sign-in with an email address.** Done (Aug 2026):
      Supabase Auth with email + password and email confirmation; one
      account = one confirmed email = one vote per issue. UI adapted from
      the Supabase UI Library (shadcn/ui) auth block.
- [x] **Show our honesty on the page.** Done (Aug 2026): the Referendum
      section ends with "How voting works — and its limits", which states
      plainly that emails are not people and results are an indicative
      signal, not a certified election.
- [ ] **Polish the phone experience.** Most users will be on phones. Test
      every screen on a cheap Android phone, not just a MacBook.
- [ ] **Accessibility check.** Can a blind user with a screen reader vote? Can
      someone with poor eyesight read the results? (A design or HCI student
      can lead this.)

**Who can do this:** computer-science students with some web experience
(React/JavaScript). This is a genuinely good portfolio project — real product,
real users, real security thinking.

## Phase 2 — Make it credible *(3–5 research volunteers, ongoing — NO CODING)*

This is the biggest volume of work in the whole project and it needs zero
programming. It attacks enemy #2 (credibility). Think of it as running a tiny,
very careful newsroom.

- [x] **Verify or replace every existing claim.** ✅ *Done 7 Aug 2026 — all 12
      rows (6 positions + 6 transparency) verified against primary/reputable
      sources; two corrected (Gaza status figures, Elbit fund history), one
      unverifiable citation deleted. Logs: [docs/source-library/](docs/source-library/).
      Run `supabase/phase2-content.sql` to update a live database.*
- [x] **Write an editorial rulebook.** ✅ *Done — one page:
      [docs/editorial-rulebook.md](docs/editorial-rulebook.md). Note its §4:
      the `gaza-humanitarian` ballot question is flagged for retire-and-replace
      (its "until there is a ceasefire" premise is stale since Oct 2025) — a
      product decision awaiting sign-off.*
- [~] **Build the source library issue by issue.** *Structure + verification
      logs + money-trail starting points done ([docs/source-library/](docs/source-library/));
      public-opinion research per issue is still marked OPEN in each log —
      that's the standing volunteer research queue.*
- [ ] **Add new issues carefully.** Better five bulletproof issues than fifty
      shaky ones. *Process now defined in the rulebook (§5): research file
      first, then two-person wording review, then ballot.*

**Who can do this:** students of political science, journalism, law,
economics, international relations. This is real investigative research
experience with a publishable result. A journalism professor might even take
parts of this on as coursework.

## Phase 3 — Make it matter *(organizers + communicators, starts alongside Phase 2)*

This attacks enemy #3, the one that killed everyone else: nobody shows up,
nothing happens. The research points to a clear strategy — **don't launch
globally, launch on ONE issue where Y can win.**

- [x] **Pick the launch issue.** ✅ *Beach Access in Jamaica — picked and live:
      pinned first on the ballot with a "Launch issue" tag. Launch pack:
      [docs/launch/](docs/launch/README.md).*
- [x] **Define the consequence.** ✅ *Published as [the 75% Rule
      (v1.0)](docs/launch/the-75-percent-rule.md): ≥75% of decided votes with a
      1,000-vote floor → result + evidence dossier delivered to the ministry
      responsible for the BAMP and NEPA/NRCA, copied to the Opposition; response
      — or documented silence — published within 30 days. Linked from the
      ballot card itself.*
- [~] **Partner, don't broadcast.** *List researched and sequenced
      ([docs/launch/partners-jamaica.md](docs/launch/partners-jamaica.md)):
      JaBBEM first, then JET, then the Fishermen Co-operative Union.
      **Contacting them is human work and needs an owner — this workstream
      still needs its leader.***
- [x] **Press kit.** ✅ *One page, limits stated plainly:
      [docs/launch/press-kit.md](docs/launch/press-kit.md). Fill the contact
      slot before distribution.*

**Who can do this:** students of communications, marketing, politics; anyone
who has organized anything. This workstream needs a leader as much as the code
does — arguably more.

## Phase 4 — Bigger bets *(later, once the above is real)*

- **Stronger identity verification** — one-person-one-vote is a famous
  unsolved problem; revisit once there are real users worth protecting.
- **More languages.** The app is structured so translation is possible; do it
  when there's an audience to translate for.
- **Voice input** — so people who can't read or type can vote. The buttons are
  already built to accept this without rebuilding the app.
- **WhatsApp/SMS voting.** The research finding that should shape Y's future
  the most: the only civic platforms that ever reached tens of millions of
  people globally (UNICEF's U-Report, the UN's MY World) did it through SMS
  and WhatsApp, not through websites.

---

## The team to recruit

| Role | How many | Background | Phase |
|---|---|---|---|
| Web developer | 2–3 | CS student, some JavaScript/React | 0, 1 |
| Designer / accessibility | 1 | Design or HCI student | 1 |
| Research / fact-checking lead | 1 + team of 3–5 | Politics, journalism, law, economics | 2 |
| Campaign / partnerships lead | 1–2 | Communications, organizing experience | 3 |
| Translator (later) | per language | Native speakers | 4 |

Total: a realistic core team is **6–10 volunteers**, and more than half of
them don't write code.

## How a volunteer gets started (30 minutes)

1. Get a free account at [github.com](https://github.com) (the site where the
   project's code and task list live).
2. **Developers:** install [Node.js](https://nodejs.org), then download this
   project and run `npm install` and `npm run dev` in its folder — the full
   app opens on your computer in demo mode, no passwords needed.
3. **Non-developers:** you don't need to install anything. Read this file,
   read [docs/similar-platforms.md](docs/similar-platforms.md), then look at
   the "Issues" tab of this repository — research and writing tasks will be
   posted there just like coding tasks.
4. Everyone: pick a small task first. Fixing one wrong source or one clumsy
   sentence is a real contribution.

## Ground rules (non-negotiable)

- **Neutrality.** Y takes no side on any issue, ever. Ballot wording, AI
  behaviour, and editorial text must present all positions fairly. Volunteers
  will have strong opinions — the platform must not.
- **Sources or it doesn't ship.** No claim goes public without a checkable
  source.
- **Honesty about limits.** We publish what the platform can't yet guarantee
  (like perfect vote verification) rather than pretending.
- **No secrets in the code.** Passwords and API keys live in private
  configuration, never in files that get uploaded to GitHub. (The project is
  already set up this way — keep it that way.)
