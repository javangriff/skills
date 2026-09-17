---
name: review-tanstack-query
description: Use when reviewing a diff that touches TanStack Query code (useQuery, useMutation, useInfiniteQuery, queryKey, queryFn, invalidateQueries, setQueryData) in any framework adapter. Triggers include the user mentioning query keys, caching, stale data, invalidation that does nothing, refetching, or optimistic updates. Also run by the review skill when changed files contain query identifiers.
---

# Review: TanStack Query

You review **TanStack Query** code for cache and reactivity defects only. Other passes cover general correctness, style, TypeScript, and framework reactivity outside of query code. Do not duplicate that work.

Read this reference file in full before you start:

- `references/tanstack-query-rules.md`

## Inputs

A caller normally gives you a **file list** and a **diff range**, and may name the query module to cross-reference. When you are invoked directly with neither, derive them yourself:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
{ git diff --name-only --diff-filter=d "$base"...HEAD
  git diff --name-only --diff-filter=d
  git ls-files --others --exclude-standard; } | sort -u \
  | grep -E '\.(ts|tsx|mts|cts|js|jsx|mjs|vue|svelte)$' | tr '\n' '\0' \
  | xargs -0 grep -lE 'useQuery|useMutation|useInfiniteQuery|useQueryClient|useSuspenseQuery|queryOptions|queryKey|queryFn|invalidateQueries|setQueryData|getQueryData|cancelQueries|prefetchQuery|@tanstack/' 2>/dev/null
```

Then find the adapter and version:

```bash
grep -E '"@tanstack/[a-z-]*query' package.json
```

Run the diff to see which lines changed.

## Priority order

1. **Frozen options.** A `queryKey` or `enabled` built from a plain value that can change (`props.id`, `someRef.value`, a destructured argument). These never refetch and are the most common defect in this kind of code. Check every value in every key against whether it can change over the component's life.
2. **Missing key variables.** Read each `queryFn` body and match every reactive value it reads against the query key. Anything read but not keyed is a cache collision: two different requests sharing one cache entry.
3. **Invalidation that matches nothing.** For each `invalidateQueries` / `setQueryData` call, find the actual `queryKey` of the query it is meant to affect and confirm the prefix matches. Search the repo for the key. Do not assume.
4. **Cache-mutation and optimistic-update mistakes.** Non-immutable `setQueryData` updaters, optimistic updates missing `cancelQueries` or rollback.
5. **v5 migration leftovers.** `cacheTime`, positional arguments, `onSuccess`/`onError` on `useQuery`, `keepPreviousData`, `isLoading` used with its v4 meaning.

Follow key factories and query composables **across files**. The key a mutation invalidates is very often defined somewhere other than the file being changed, and a mismatch is invisible unless you read both. Always read the query module a changed mutation is meant to affect, even when it is not in the diff.

Do not flag the items listed under "Not worth flagging" in the reference file. Ignore anything on lines the diff did not touch, unless a changed line depends on it.

## Scope labels

Load the `staying-in-scope` skill and follow it before you report anything. It decides when a finding is correct but belongs outside this change, and it owns the two labels the caller triages on: `[out of scope]` for a finding this change did not cause, and `[convention change]` for one the repo already does another way. Its prior-art check is not optional for a finding that introduces, renames, or restructures a pattern.

The rule lives there so every pass labels alike. Apply the labels exactly as that skill describes, keep labelled findings in your normal severity ranking, and let the caller separate them. If you cannot load the skill, say so in your report and label nothing rather than inventing a scheme.

## Output

For every finding report:

- the `file:line`
- the rule it breaks
- the concrete user-visible consequence: which screen shows which stale or wrong data, and when
- the specific replacement code

A finding you cannot state a user-visible consequence for is not a finding. Drop it.

When a caller gives you a word budget, stay inside it. Your final message is the review itself. No preamble, no summary of what you read.
