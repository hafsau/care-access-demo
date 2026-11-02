# One Record, Both Sides

**An unofficial concept by [Hafsa Usmani](https://hafsausmani.com) for Care Access's Product Designer role.**

> **Not affiliated with Care Access.** Rosa and everyone in the queue are fictional, and the studies HL-204 and KD-118 are made up. Consent wording is a content proposal that would need legal and regulatory review. Design tokens come from the public CSS of Care Access's screening site, and the type is IBM Plex. No logo is used, nothing is sent anywhere, and the site is noindexed.

## The idea

Care Access's pre-screen does four jobs in one form:
- booking a free screening
- gathering what research sponsors need
- recording consent
- setting how staff may make contact

This concept separates those jobs without losing any of them:

- **Four separate consent choices** instead of one bundled checkbox: screening data, study matching, text messages and automated voice calls. Each comes with a plain-language summary, the full text, and a way to change it later.
- **Questions asked only when a nearby study needs them,** decided by one rules table. "Not sure" counts as an answer.
- **The coordinator's view of the same record follows the participant's choices.** A blocked action says which choice blocks it, who made it, when, in which language, and what to do instead.

| Page | What's there |
|---|---|
| `/` | Rosa's phone and the coordinator's record, side by side, with "Play Rosa's booking" |
| `/prescreen` | The participant flow in English and Spanish (`?lang=es`) |
| `/coordinator` | The queue, the record, and a call panel |
| `/states` | Edge cases, each running the real components |
| `/system` | Tokens by Care Access's own class names, components, the rules table with a live amendment, consent gates |
| `/case-study` | What works, what I observed (dated), the question ledger, the tradeoff, how I'd measure it |

## How it's built

- **`lib/rules/studies.json` + `engine.ts`:** tri-state eligibility (met / not met / not known yet). One table drives the questions asked, the coordinator's view and the generated tests.
- **`lib/consent.ts`:** the choices, the append-only log, and `can()`, which gates every staff action on purpose and channel.
- **`lib/ledger.ts`:** every question in the live pre-screen (24 slides, observed 2026-11-02) and where it goes. A test fails if any one is missing.
- **`lib/copy.ts`:** English and Spanish copy. Tests check that both have the same keys and that the consent summaries stay easy to read.

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests (Vitest)
npm run e2e        # Playwright + axe, keyboard, 320px, 200% zoom
```

Designed and built by Hafsa Usmani with Claude Code.

## License

MIT for the code (see LICENSE). IBM Plex is under the SIL Open Font License. Care Access's name and design tokens belong to Care Access.
