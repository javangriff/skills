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
| [improve-code-docs](./skills/improve-code-docs/SKILL.md) | Documentation pass over TypeScript, JavaScript, and Vue files: adds missing JSDoc, fixes docs that drifted from the signature, and cuts comments that restate the code. |
| [improve-code-organisation](./skills/improve-code-organisation/SKILL.md) | Reorganises a Vue 3 `<script setup>` component so it reads by logical concern instead of by API type. |
| [playwright-adversarial-testing](./skills/playwright-adversarial-testing/SKILL.md) | Drives a running app with Playwright to attack a branch's changes: edge cases, failure paths, race conditions, and bad UX a happy-path demo would miss. |
| [simplified-technical](./skills/simplified-technical/SKILL.md) | Writes prose in ASD-STE100 Simplified Technical English: plain, controlled language with one word per meaning. |
| [setup-javan-skills](./skills/setup-javan-skills/SKILL.md) | Records where a repo tracks issues and how to fetch them, so the review skills can check a change against its ticket. Run once per repo. |

### Code review

| Skill | What it does |
| --- | --- |
| [review](./skills/code-review/review/SKILL.md) | Full review of a diff, PR, or branch. Picks the passes below that match what changed, runs them together, and merges one report. |
| [review-code](./skills/code-review/review-code/SKILL.md) | The general pass: correctness bugs with a failure scenario, then quality smells covering structure, readability, complexity, and comments. |
| [review-typescript](./skills/code-review/review-typescript/SKILL.md) | Type-level defects the compiler accepts: lying casts, `any` leakage, non-exhaustive unions, floating promises, misleading signatures. |
| [review-vue](./skills/code-review/review-vue/SKILL.md) | Vue 3 reactivity bugs and watchers that should be a computed, a prop, a v-model, or an event listener. |
| [review-tanstack-query](./skills/code-review/review-tanstack-query/SKILL.md) | TanStack Query cache and reactivity defects: frozen keys, cache collisions, invalidation that matches nothing, unsafe cache writes. |
| [review-acceptance-criteria](./skills/code-review/review-acceptance-criteria/SKILL.md) | Checks the diff against the ticket, issue, or spec behind it, and lists out-of-scope changes. |

## Layout and conventions

See [AGENTS.md](./AGENTS.md).
