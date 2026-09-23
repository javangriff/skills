# skills

My agent skills, kept in one place and installable into any agent harness.

A skill is a directory with a `SKILL.md` in it. That format is read by Claude
Code, Codex, Cursor, and most other coding agents, so these skills are not tied
to one provider.

## Install

```bash
npx skills@latest add javangriff/skills
```

Pick the skills you want and the agents to install them on. Files are copied
into place, so pull later changes with `npx skills@latest update`.

## Skills

| Skill | What it does |
| --- | --- |
| [grill-me](./skills/grill-me/SKILL.md) | Interviews you relentlessly about a plan or design until every branch of the decision tree is resolved. |
| [improve-code-docs](./skills/improve-code/improve-code-docs/SKILL.md) | Documentation pass over TypeScript, JavaScript, and Vue files: adds missing JSDoc, fixes docs that drifted from the signature, and cuts comments that restate the code. |
| [improve-code-organisation](./skills/improve-code/improve-code-organisation/SKILL.md) | Reorganises a Vue 3 `<script setup>` component so it reads by logical concern instead of by API type. |
| [improve-code-simplicity](./skills/improve-code/improve-code-simplicity/SKILL.md) | Adversarial pass over a change that cuts what nothing present needs: one-caller abstractions, options nobody sets, unreachable branches, premature extensibility. Also the review skill's simplicity pass. |
| [improve-tests](./skills/improve-code/improve-tests/SKILL.md) | Strengthens existing tests: fixes false confidence and brittleness, adds high-value missing cases at the right level, and verifies the affected targets. |
| [playwright-adversarial-testing](./skills/playwright-adversarial-testing/SKILL.md) | Drives a running app with Playwright to attack a branch's changes: edge cases, failure paths, race conditions, and bad UX a happy-path demo would miss. |
| [staying-in-scope](./skills/staying-in-scope/SKILL.md) | Decides whether a change belongs in the work at hand: checks prior art before adopting a pattern, so a local improvement does not silently split a repo-wide convention, and labels review findings that need their own ticket. |
| [setup-javan-skills](./skills/setup-javan-skills/SKILL.md) | Records where a repo tracks issues and how to fetch them, so the review skills can check a change against its ticket. Run once per repo. |

### Code review

| Skill | What it does |
| --- | --- |
| [review](./skills/code-review/review/SKILL.md) | Full review of a diff, PR, or branch. Picks the passes below that match what changed, runs them together, and merges one report. |
| [review-code](./skills/code-review/review-code/SKILL.md) | The general pass: correctness bugs with a failure scenario, then quality smells covering structure, readability, complexity, and comments. |
| [review-tests](./skills/code-review/review-tests/SKILL.md) | Reviews changed tests for false confidence, missing behaviour, implementation coupling, flakiness, and inappropriate unit/integration/end-to-end scope. |
| [review-typescript](./skills/code-review/review-typescript/SKILL.md) | Type-level defects the compiler accepts: lying casts, `any` leakage, non-exhaustive unions, floating promises, misleading signatures. |
| [review-vue](./skills/code-review/review-vue/SKILL.md) | Vue 3 reactivity bugs and watchers that should be a computed, a prop, a v-model, or an event listener. |
| [review-tanstack-query](./skills/code-review/review-tanstack-query/SKILL.md) | TanStack Query cache and reactivity defects: frozen keys, cache collisions, invalidation that matches nothing, unsafe cache writes. |
| [review-acceptance-criteria](./skills/code-review/review-acceptance-criteria/SKILL.md) | Checks the diff against the ticket, issue, or spec behind it, and lists out-of-scope changes. |

### Writing

| Skill | What it does |
| --- | --- |
| [writing-pr-descriptions](./skills/writing/writing-pr-descriptions/SKILL.md) | Writes short PR descriptions that explain why a change exists and why it takes its shape, with a code example where it helps, instead of listing the changes. |
| [writing-pr-comments](./skills/writing/writing-pr-comments/SKILL.md) | Turns review findings into PR comments an author can act on: the claim, the consequence, how you know, a suggested fix, and an explicit scope signal. |
| [simplified-technical](./skills/writing/simplified-technical/SKILL.md) | Writes prose in ASD-STE100 Simplified Technical English: plain, controlled language with one word per meaning. |

## Layout and conventions

See [AGENTS.md](./AGENTS.md).
