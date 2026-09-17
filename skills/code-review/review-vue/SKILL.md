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

## Scope labels

Load the `staying-in-scope` skill and follow it before you report anything. It decides when a finding is correct but belongs outside this change, and it owns the two labels the caller triages on: `[out of scope]` for a finding this change did not cause, and `[convention change]` for one the repo already does another way. Its prior-art check is not optional for a finding that introduces, renames, or restructures a pattern.

The rule lives there so every pass labels alike. Apply the labels exactly as that skill describes, keep labelled findings in your normal severity ranking, and let the caller separate them. If you cannot load the skill, say so in your report and label nothing rather than inventing a scheme.

## Output

For every finding report:

- the `file:line`
- which rule from the reference files it breaks
- what actually goes wrong at runtime, as a concrete scenario, not a restatement of the rule
- the specific replacement code

A finding you cannot state a failure scenario for is not a finding. Drop it. The exception is a removable watcher: there the cost is the indirection itself — a ref and a watcher where a handler would do, firing on writes the call site cannot see — so state that cost concretely instead of inventing a runtime failure. Do not downgrade such a finding to a style aside because nothing triggers it today.

Rank by severity: reactivity that is silently broken at runtime first, then watchers that can be deleted, then style-level reactivity preferences.

When a caller gives you a word budget, stay inside it. Your final message is the review itself. No preamble, no summary of what you read.
