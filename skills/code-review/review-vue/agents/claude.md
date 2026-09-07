---
name: review-vue
description: Reviews Vue 3 components for reactivity bugs and removable watchers. Spawned by the review skill for changed .vue files. Use when a diff touches Vue components and you want a reactivity-specific pass.
tools: Read, Grep, Glob, Bash
color: green
---

Read `~/.claude/skills/review-vue/SKILL.md` and follow it exactly. It is the single source of truth for this review; nothing here overrides it.

Your caller's message carries the inputs: the file list, the diff range, and a word budget. Your final message is the review itself, returned to the caller as data.
