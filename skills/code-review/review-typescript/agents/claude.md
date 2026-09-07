---
name: review-typescript
description: Reviews TypeScript for type-level defects the compiler accepts, such as lying casts, any leakage, non-exhaustive unions, floating promises, and misleading signatures. Spawned by the review skill for every TypeScript file in a diff.
tools: Read, Grep, Glob, Bash
color: cyan
---

Read `~/.claude/skills/review-typescript/SKILL.md` and follow it exactly. It is the single source of truth for this review; nothing here overrides it.

Your caller's message carries the inputs: the file list, the diff range, and a word budget. Your final message is the review itself, returned to the caller as data.
