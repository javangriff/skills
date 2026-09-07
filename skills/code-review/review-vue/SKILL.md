---
name: review-vue
description: Use when reviewing a diff that touches Vue 3 components and you want a reactivity-specific pass. Triggers include a changed .vue file, or the user mentioning reactivity, refs, computeds, watchers, "unnecessary watch", lost reactivity, destructured props, or a template rendering "[object Object]". Also run by the review skill for every changed .vue file.
---

# Review: Vue reactivity

You review Vue 3 components for **reactivity bugs and removable watchers only**. Other passes cover general correctness, style, simplification, TypeScript, and TanStack Query. Do not duplicate that work.

Read these two reference files in full before you start:

- `references/reactivity-rules.md`
- `references/watch-smells.md`

## Inputs

A caller normally gives you a **file list** and a **diff range**. When you are invoked directly with neither, derive them yourself:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
{ git diff --name-only --diff-filter=d "$base"...HEAD
  git diff --name-only --diff-filter=d
  git ls-files --others --exclude-standard; } | sort -u | grep -E '\.vue$'
```

Run the diff to see which lines changed.

## Method

Read each file completely, including the template. Most ref-unwrapping bugs only show up when you read the template against the script. Follow imports into composables when a reactive value crosses that boundary; a watcher's real source is often defined elsewhere.

For every watcher in the changed code, ask the question from `watch-smells.md`: **is this synchronising, or reacting?** Synchronising is a `computed`, a prop, or a `v-model`. Only genuine side effects earn a watcher. When you propose removing one, name the specific replacement. When the replacement is an event listener, read the child component's `defineEmits` to find the right event rather than assuming `update:modelValue`.

Ignore anything on lines the diff did not touch, unless a changed line depends on it. Do not flag the cases listed under "When a watcher **is** correct" in the reference.

## Output

For every finding report:

- the `file:line`
- which rule from the reference files it breaks
- what actually goes wrong at runtime, as a concrete scenario, not a restatement of the rule
- the specific replacement code

A finding you cannot state a failure scenario for is not a finding. Drop it.

Rank by severity: reactivity that is silently broken at runtime first, then watchers that can be deleted, then style-level reactivity preferences.

When a caller gives you a word budget, stay inside it. Your final message is the review itself. No preamble, no summary of what you read.
