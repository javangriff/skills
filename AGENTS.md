# AGENTS.md

Conventions for agents working in this repository.

## Layout

Skills live one directory deep, flat, no bucket folders:

- `skills/<skill-name>/SKILL.md` is published in this public repo.
- `skills-local/<skill-name>/SKILL.md` is gitignored. Skills that name private
  or employer-specific internals go here, never in `skills/`.

Every skill also carries an `agents/openai.yaml`, and may carry other
supporting files beside its `SKILL.md` (`references/`, `evals/`). Keep them all
inside the skill directory so the whole skill moves as one unit.

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

## Invocation

A skill is **model-invoked** by default: the model or the human can reach it, and
its `description` keeps rich trigger phrasing so auto-invocation fires.

To make a skill **user-invoked**, reachable only when the human names it, set
both of these, because each harness enforces it in its own way:

- `disable-model-invocation: true` in the `SKILL.md` frontmatter (Claude Code)
- `policy.allow_implicit_invocation: false` in `agents/openai.yaml` (Codex)

A skill is user-invoked in both harnesses or neither: setting one without the
other leaves it model-reachable on the harness you missed. Its `description`
also becomes human-facing, a one-line summary for someone browsing the skill
list, with the trigger list stripped.

## agents/openai.yaml

Codex reads this for skill-picker metadata. Every skill has one:

```yaml
interface:
  display_name: "Title Case Name"
  short_description: "One line, no trailing period"
```

Model-invoked skills carry the `interface` block alone. Add the `policy` block
above only when making a skill user-invoked. Codex reads `SKILL.md` without this
file, so it is metadata rather than a requirement, but keep it present so the
picker never falls back to a directory name.

## Adding a skill

1. Create `skills/<name>/SKILL.md` (or `skills-local/<name>/` if it is private).
2. Create `skills/<name>/agents/openai.yaml`.
3. Add a row to the table in `README.md`. Private skills are not listed.
4. Run `scripts/link-skills.sh` to link it into the local harnesses.

## Portability

Nothing here is specific to one agent provider. `SKILL.md` plus frontmatter is
the format every harness reads, so avoid provider-specific tool names, file
paths, and slash-command syntax in skill bodies. Where a skill must invoke
another skill, instruct the agent to call the Skill tool with the skill's name
rather than writing `/name`.

Installation is not this repo's job to reimplement: `scripts/link-skills.sh`
covers the local harnesses, and `npx skills@latest add javangriff/skills` covers
everything else.
