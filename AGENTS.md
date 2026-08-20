# AGENTS.md

Conventions for agents working in this repository.

## Layout

Skills live one directory deep, flat, no bucket folders:

- `skills/<skill-name>/SKILL.md` is published in this public repo.
- `skills-local/<skill-name>/SKILL.md` is gitignored. Skills that name private
  or employer-specific internals go here, never in `skills/`.

A skill may carry supporting files beside its `SKILL.md` (`references/`,
`evals/`). Keep them inside the skill directory so the whole skill moves as one
unit.

## SKILL.md frontmatter

Required:

```yaml
---
name: <directory-name>
description: <what it does, and the triggers that should reach for it>
---
```

`name` must match the directory name exactly. `description` is read by the model
to decide whether to invoke the skill, so it carries the trigger phrasing
("Use when the user asks to...", "Triggers include...").

Add `disable-model-invocation: true` for a skill only the human should be able
to fire by name. Its `description` then becomes human-facing: a one-line summary
for someone browsing the skill list, with the trigger list stripped.

## Adding a skill

1. Create `skills/<name>/SKILL.md` (or `skills-local/<name>/` if it is private).
2. Add a row to the table in `README.md`. Private skills are not listed.
3. Run `scripts/link-skills.sh` to link it into the local harnesses.

## Portability

Nothing here is specific to one agent provider. `SKILL.md` plus frontmatter is
the format every harness reads, so avoid provider-specific tool names, file
paths, and slash-command syntax in skill bodies. Where a skill must invoke
another skill, instruct the agent to call the Skill tool with the skill's name
rather than writing `/name`.

Installation is not this repo's job to reimplement: `scripts/link-skills.sh`
covers the local harnesses, and `npx skills@latest add javangriff/skills` covers
everything else.
