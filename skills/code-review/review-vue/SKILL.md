---
name: review-vue
description: Reviews Vue 3 components and composables for reactivity bugs and for watchers that should be a computed, a prop, a v-model, an event listener, or a line of setup code. Use when reviewing a diff that touches Vue 3 components or composables. Triggers include a changed .vue file, a changed TypeScript or JavaScript file that imports from vue or @vueuse, or the user mentioning reactivity, refs, computeds, watchers, "unnecessary watch", lost reactivity, destructured props, or a template rendering "[object Object]". Also run by the review skill for every changed .vue file and every changed script that imports from vue.
---

# Review: Vue reactivity

You review Vue 3 components and composables for **reactivity bugs and removable watchers only**. Other passes cover general correctness, style, simplification, TypeScript, and TanStack Query. Do not duplicate that work.

Read these two reference files in full before you start:

- `references/reactivity-rules.md`
- `references/watch-smells.md`

## Inputs

A caller normally gives you a **file list** and a **diff range**. When you are invoked directly with neither, derive them yourself:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
{ git diff --name-only --diff-filter=d "$base"...HEAD
  git diff --name-only --diff-filter=d
  git ls-files --others --exclude-standard; } | sort -u |
  grep -E '\.(vue|[cm]?[jt]sx?)$' | grep -vE '\.(test|spec|stories)\.' |
  while read -r f; do
    case "$f" in
      *.vue) echo "$f" ;;
      *) grep -E "from ['\"](vue|@vueuse/[a-z-]+)['\"]" "$f" | grep -qv '^import type' && echo "$f" ;;
    esac
  done
```

A script is in scope when it takes a value, not just a type, from `vue` or `@vueuse`. That is what decides whether it holds reactivity, not its name: a composable can live in `context.ts` or a store, and a `use*` file can be a plain query wrapper. Tests and stories are left out, because their refs are fixtures.

Run the diff to see which lines changed.

## Method

Read each file completely, including the template. Most ref-unwrapping bugs only show up when you read the template against the script. Follow imports into composables when a reactive value crosses that boundary; a watcher's real source is often defined elsewhere.

Review a composable the same way, but from its callers. A watcher inside a composable usually watches something a caller passed in, such as a `defineModel` ref bound to a child's `v-model`. Read every call site before judging it: who writes the value, and whether a handler at the call site would do the job.

For every watcher in the changed code, ask the two questions from `watch-smells.md`. First: **is this synchronising, or reacting?** Synchronising is a `computed`, a prop, or a `v-model`. Second, for one that is reacting: **does it need to be a watcher?** A side effect earns a watcher only when its source changes in ways no single handler sees. If one event causes it, it belongs in that event's handler. If its source cannot change after setup, it is a line of setup code. When you propose removing one, name the specific replacement. When the replacement is an event listener, read the child component's `defineEmits` to find the right event rather than assuming `update:modelValue`.

Ignore anything on lines the diff did not touch, unless a changed line depends on it. Do not flag the cases listed under "When a watcher **is** correct" in the reference.

## Scope labels

Call the Skill tool with `staying-in-scope` and follow it before you report anything. It decides when a finding is correct but belongs outside this change, and it owns the two labels the caller triages on: `[out of scope]` for a finding this change did not cause, and `[convention change]` for one the repo already does another way. Its prior-art check is not optional for a finding that introduces, renames, or restructures a pattern.

Apply the labels exactly as that skill describes, keep labelled findings in your normal severity ranking, and let the caller separate them. If you cannot load the skill, say so in your report and label nothing rather than inventing a scheme.

## Output

For every finding report:

- the `file:line`
- which rule from the reference files it breaks
- what actually goes wrong at runtime, as a concrete scenario, not a restatement of the rule
- the specific replacement code, as a diff snippet (see below)

A finding you cannot state a failure scenario for is not a finding. Drop it. The exception is a removable watcher: there the cost is the indirection itself — a ref and a watcher where a handler would do, firing on writes the call site cannot see — so state that cost concretely instead of inventing a runtime failure. Do not downgrade such a finding to a style aside because nothing triggers it today.

Rank by severity: reactivity that is silently broken at runtime first, then watchers that can be deleted, then style-level reactivity preferences.

Show each fix as a fenced `diff` block: the current lines prefixed `-`, the replacement prefixed `+`, and at most three unchanged lines of context around them. Copy the `-` lines from the file rather than retyping them, and keep the block to the lines the fix touches, never a whole hunk. When there is no single local edit to show, such as a fix spread across files, show the current lines the finding points at as a plain code block instead. For a finding reported once with a list of locations, show the snippet for the first location only.

When a caller gives you a word budget, stay inside it. Your final message is the review itself. No preamble, no summary of what you read.
