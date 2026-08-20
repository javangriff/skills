# skills

My agent skills, kept in one place and installable into any agent harness.

A skill is a directory with a `SKILL.md` in it. That format is read by Claude
Code, Codex, Cursor, and most other coding agents, so these skills are not tied
to one provider.

## Install

### Any agent

```bash
npx skills@latest add javangriff/skills
```

Pick the skills you want and the agents to install them on. Files are copied
into place, so pull later changes with `npx skills@latest update`.

### This machine (symlinked, for editing)

```bash
git clone https://github.com/javangriff/skills.git ~/code/skills
~/code/skills/scripts/link-skills.sh
```

Each skill is symlinked into `~/.claude/skills` and `~/.codex/skills`, so a
`git pull` updates every installed skill and editing a skill mid-session is
editing the repo. Re-run the script after adding, removing, or renaming a skill.

## Skills

| Skill | What it does |
| --- | --- |
| [grill-me](./skills/grill-me/SKILL.md) | Interviews you relentlessly about a plan or design until every branch of the decision tree is resolved. |
| [improve-code-docs](./skills/improve-code-docs/SKILL.md) | Documentation pass over TypeScript, JavaScript, and Vue files: adds missing JSDoc, fixes docs that drifted from the signature, and cuts comments that restate the code. |
| [improve-code-organisation](./skills/improve-code-organisation/SKILL.md) | Reorganises a Vue 3 `<script setup>` component so it reads by logical concern instead of by API type. |
| [playwright-adversarial-testing](./skills/playwright-adversarial-testing/SKILL.md) | Drives a running app with Playwright to attack a branch's changes: edge cases, failure paths, race conditions, and bad UX a happy-path demo would miss. |
| [simplified-technical](./skills/simplified-technical/SKILL.md) | Writes prose in ASD-STE100 Simplified Technical English: plain, controlled language with one word per meaning. |

## Layout and conventions

See [AGENTS.md](./AGENTS.md).
