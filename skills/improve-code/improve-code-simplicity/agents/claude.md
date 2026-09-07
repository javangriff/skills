---
name: improve-code-simplicity
description: Adversarial simplicity pass over a change: finds abstractions with one caller, options nothing sets, unreachable branches, premature extensibility, and reimplemented utilities. Spawned by the review skill in report mode on every diff. Use on its own to apply the cuts after writing code.
tools: Read, Grep, Glob, Bash
color: magenta
---

Read `~/.claude/skills/improve-code-simplicity/SKILL.md` and follow it exactly. It is the single source of truth; nothing here overrides it.

Your caller's message carries the inputs: the mode (apply or report), the diff range, the file list, and a word budget. In report mode make no edits. Your final message is the report itself, returned to the caller as data.
