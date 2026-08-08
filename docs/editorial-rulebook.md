# Y — Editorial Rulebook

*One page. If a rule isn't here, the answer is "be more careful, not less."*
*Applies to everything shown as fact in the app: issue framings, government positions, transparency rows.*

## 1. What counts as a source

| Tier | Examples | Use |
|------|----------|-----|
| **A — Primary / official** | Laws and gazettes, UN resolutions and reports, court records, SEC/regulatory filings, official statistics (WHO, UNEP), company statements | Preferred. Always sufficient alone. |
| **B — Established reporting** | News organisations with named reporters and a corrections process (e.g. Reuters, AP, Gleaner, Skift, Mongabay) | Fine for events and status. Two independent Tier-B sources for contested claims. |
| **C — NGO / academic** | Peer-reviewed papers; NGO reports with published methodology (Global Witness, BHRRC, OpenSecrets) | Fine for documented findings; attribute in-text ("per OpenSecrets…"). |

**Never sources:** social media posts, anonymous blogs, AI output, press releases about opponents, Wikipedia (follow its citations instead).

## 2. Claim rules

- Every factual sentence must trace to a **checkable link** — an official document, reputable report, or court/regulatory record. **No source → the claim is deleted, not kept.**
- Numbers carry their year and origin ("2.1 billion in 2024, WHO/UNICEF JMP"). Superlatives ("largest") only if the source says so.
- Every row records **who verified it and when** (see §5). Anything older than **6 months**, or overtaken by major news, is re-verified before it stays up.
- Corrections are public: note what changed and why in the issue's verification log.

## 3. Neutral ballot wording

A ballot question must pass all five checks before it ships:

1. **One proposition.** No "and" joining separable demands.
2. **No loaded language.** Neither side's campaign vocabulary; plain description of the mechanism ("funded publicly", "guaranteed in law").
3. **Answerable yes/no/abstain** — a "no" must be a coherent position, not a moral failing.
4. **The sign test:** a thoughtful supporter *and* a thoughtful opponent should both accept the wording as a fair statement of the question.
5. **Two-person review**, at least one of whom disagrees with (or is indifferent to) the "yes" side.

## 4. Changing a live question

Votes belong to the exact wording people saw. **Never edit a live question in place.** If events overtake a question (its premise no longer holds), retire the issue — its results stay visible, marked "closed" — and open a new, re-worded issue with a fresh id and zero votes.
*Standing example: `gaza-humanitarian` asks about sanctions "until there is a ceasefire"; a fragile ceasefire has existed since Oct 2025, so the question is flagged for retire-and-replace under this rule.*

## 5. Sign-off and logs

- Each issue has a verification log at `docs/source-library/<issue-id>.md`: claim → source → status → date → checker.
- Content ships only after the log shows every claim **verified** and a second person has signed the wording (§3.5).
- New issues follow the same path in reverse: research file first (opinion data, official positions, money trail), then wording review, then ballot. **Better five bulletproof issues than fifty shaky ones.**

*Last updated: 7 Aug 2026.*
