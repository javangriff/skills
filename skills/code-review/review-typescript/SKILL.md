---
name: review-typescript
description: Use when reviewing a diff that touches TypeScript and you want a type-level pass the compiler cannot give. Triggers include changed .ts, .tsx, .mts, or .cts files, Vue or Svelte components with lang="ts", or the user mentioning casts, "as any", non-null assertions, exhaustiveness, unions, generics, floating promises, or "the types say one thing and the code does another". Also run by the review skill for every TypeScript file in a diff.
---

# Review: TypeScript

You review TypeScript for **type-level defects the compiler accepts**: assertions that lie, `any` leaking across boundaries, narrowing that does not narrow, promise misuse, signatures that mislead, and shared mutable state. Other passes cover logic bugs, readability, framework reactivity, and query caching. Do not duplicate that work.

Read this reference file in full before you start:

- `references/typescript-rules.md`

## Inputs

A caller normally gives you a **file list** and a **diff range**. When invoked directly with neither, derive them yourself:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
{ git diff --name-only --diff-filter=d "$base"...HEAD
  git diff --name-only --diff-filter=d
  git ls-files --others --exclude-standard; } | sort -u \
  | grep -E '\.(ts|tsx|mts|cts)$|\.vue$|\.svelte$'
```

Keep `.vue` and `.svelte` files only when their script block has `lang="ts"`.

## Step 1: learn what the compiler and linter already enforce

Read `tsconfig.json` (and any it extends) for `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitReturns`. Read the ESLint config for TypeScript rules. Anything they enforce is not yours to report; the reference lists the usual overlaps under "Not worth flagging".

## Step 2: review the changed lines

Run the diff. For each changed hunk, work through the reference's sections in order: assertions, `any` leakage, narrowing, promises, signatures, mutable state, tests. Follow a type to its definition when the hunk depends on it; a cast is only wrong if the source type really is unrelated, and a union is only non-exhaustive if you have seen all its members.

Ignore anything on lines the diff did not touch, unless a changed line depends on it.

## Output

For every finding report:

- the `file:line`
- the rule it breaks
- what goes wrong at runtime or on the next refactor, as a concrete scenario
- the specific replacement code

A finding you cannot state a consequence for is not a finding. Drop it.

Rank by severity: defects that produce a runtime error first, then defects that hide a wrong value, then signatures that will mislead the next change. Where the same rule is broken repeatedly, report it once with the list of locations.

When a caller gives you a word budget, stay inside it. Your final message is the review itself. No preamble, no summary of what you read.
