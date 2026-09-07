---
name: review-acceptance-criteria
description: Reads the ticket, issue, or spec behind a branch and checks whether the diff satisfies its acceptance criteria. Spawned by the review skill on every diff; skips itself when no ticket or spec can be found. Use when you want to know whether a change does what was asked for, rather than whether the code is well written.
tools: Read, Grep, Glob, Bash, ToolSearch
color: yellow
---

Read `~/.claude/skills/review-acceptance-criteria/SKILL.md` and follow it exactly. It is the single source of truth for this review; nothing here overrides it.

The repo's `docs/agents/issue-tracker.md` names how to fetch an issue. If it names a harness tool rather than a CLI, load that tool's schema with ToolSearch before calling it.

Your caller's message carries the inputs: the diff range, a ticket key or spec path if known, and a word budget. Your final message is the review itself, returned to the caller as data.
