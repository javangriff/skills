---
name: review
description: Use whenever the user asks to review code: the current diff, a PR, a branch, or a path. Triggers include "review my changes", "review this PR", "check my branch before I push", "pre-push review", "does this do what the ticket says", and any mention of reactivity, watchers, query keys, caching, casts, or acceptance criteria in the context of a change. Prefer this over any single review pass, since it selects and runs the right passes for what the diff touches.
---

# Review

One code review made of several passes that run together and report as one. You are the orchestrator: you pick the passes, give each its inputs, and merge the results. You do not review the code yourself.

The passes are skills in their own right:

| Pass | Runs when |
| --- | --- |
| `review-code` | always |
| `improve-code-simplicity` (report mode) | always |
| `review-tests` | any recognised test, fixture, snapshot, or test-runner configuration file changed |
| `review-typescript` | any TypeScript source file changed |
| `review-vue` | any `.vue` file changed |
| `review-tanstack-query` | any changed source file contains query identifiers |
| `review-acceptance-criteria` | always; it locates the ticket or spec itself and skips when there is none |

Each pass's own description says what it finds, and each carries its own method and output format. **Your prompt to a pass is its inputs, never its method.** Restating the method here would let two copies drift.

## Arguments

All optional:

- No target: the working tree plus the branch, compared with the main branch's merge-base.
- A PR or MR number, a branch name, or a path: that target.
- An effort level: `low`, `medium` (default), `high`, or `max`. Forwarded to every pass. At `low` and `medium`, passes report only findings they can demonstrate; at `high` and `max` they may add lower-confidence suggestions, marked as such.
- `--fix`: apply code findings to the working tree after the review.
- `--comment`: post findings as inline comments on the PR or MR.

## Step 1: pin and validate the fixed point

Resolve the base and confirm there is something to review **before** starting any pass. A bad ref or an empty diff must fail here, not inside five parallel passes.

```bash
main=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@.*/@@'); main=${main:-main}
base=$(git merge-base HEAD "origin/$main" 2>/dev/null || git merge-base HEAD "$main")
git rev-parse --verify "$base" >/dev/null || { echo "cannot resolve base"; exit 1; }
if git diff --quiet "$base"...HEAD && git diff --quiet \
   && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "nothing to review"; exit 1
fi
```

Untracked files count. A change made entirely of new files is still a change.

For a branch target, use that branch in place of `HEAD`. For a path target, restrict every diff command to that path. For a PR or MR target, fetch the diff with the forge's CLI (`gh pr diff <n>`, `glab mr diff <n>`) and its metadata (`gh pr view <n> --json title,headRefName,body`) in place of the local commands.

Record the exact diff command you settled on. Every pass receives it verbatim.

## Step 2: derive the pass inputs

```bash
changed=$(mktemp)
{ git diff --name-only --diff-filter=d "$base"...HEAD
  git diff --name-only --diff-filter=d
  git ls-files --others --exclude-standard; } | sort -u > "$changed"
grep -E '\.(ts|tsx|mts|cts)$' "$changed"                          # review-typescript
grep -E '\.vue$' "$changed"                                        # review-vue, and review-typescript when lang="ts"
grep -Ei '(^|/)(__tests__|tests?|specs?|fixtures?|snapshots?|e2e|cypress|playwright)(/|$)|(\.(test|spec)\.[^/]+$|_(test|spec)\.[^/]+$|(^|/)test_[^/]+\.[^/]+$|[[:alnum:]]Tests?\.[^/]+$|\.snap$)|(^|/)(jest|vitest|playwright|cypress)\.config\.|(^|/)(pytest\.ini|conftest\.py|tox\.ini|phpunit\.xml)$' "$changed"  # review-tests
grep -E '\.(ts|tsx|mts|cts|js|jsx|mjs|vue|svelte)$' "$changed" | tr '\n' '\0' \
  | xargs -0 grep -lE 'useQuery|useMutation|useInfiniteQuery|useQueryClient|useSuspenseQuery|queryOptions|queryKey|queryFn|invalidateQueries|setQueryData|getQueryData|cancelQueries|prefetchQuery|@tanstack/'   # review-tanstack-query
```

Deleted files are excluded. The query grep runs over source files only, so documentation that mentions `useQuery` does not trigger the pass. A pass whose input is empty is **skipped, and the report says so**. A skipped pass that is never mentioned reads as a pass that found nothing.

The acceptance-criteria pass always runs. It reads the issue-tracker config if one exists (in the repo, or at user level for this repo), falls back to spec files if not, and skips itself when it finds nothing. Give it what you already know so it does not repeat the lookup: the branch name, the PR title and head branch if any, and the most recent commit subject.

Set a word budget per pass: 400 words at `low` and `medium`, 800 at `high` and `max`.

## Step 3: run the passes

If the harness can run subagents, start every selected pass in **one step** so they overlap. Tell each subagent to load the named skill (a same-named agent definition may exist in the harness; either is fine) and give it only:

- the diff command from step 1
- its file list from step 2 (absolute paths)
- the effort level and word budget
- for `improve-code-simplicity`: the words "report mode", so it makes no edits
- for `review-tests`: the changed test-file list; it follows those tests into related production code itself
- for `review-tanstack-query`: the query module to cross-reference, when you can see one in the diff's directory
- for `review-acceptance-criteria`: the branch, PR title, head branch, and last commit subject

If the harness has no subagents, run the passes in sequence yourself by calling the Skill tool with each pass's name and the same inputs, and collect each result before starting the next.

Two rules for dispatch:

- For a diff with more than about eight changed `.vue` files, fan `review-vue` out across several subagents of three or four files each, so no single pass holds too much at once.
- Do not pass `--fix` or `--comment` down. Passes report; the merged report acts.

The Vue and TanStack passes overlap on `.vue` files that contain queries. That is intentional, since they look for different defects. Deduplicate at merge time, not by narrowing either file list.

## Step 4: merge and report

Wait for every pass, then produce **one** report in this order.

1. **Acceptance criteria.** The verdict table exactly as the pass returned it, first, because "this does not do what was asked" outranks any code finding. This section is never ranked against or merged with code findings; a change can pass one and fail the other. If the pass was skipped, one line saying why (no tracker config, no spec found).
2. **Findings.** Every finding from every code pass, in a single list ordered by severity, not grouped by pass. Bugs and hard findings first, then judgement calls. Each finding is the claim, the failure scenario or smell, and the fix, with `file:line`.
3. **Notes.** Skipped passes and why, out-of-scope changes, criteria that could not be verified.

Deduplicate: when two passes flag the same line, keep the more specific write-up. A domain pass beats `review-code`; `review-tanstack-query` beats `review-vue` for anything inside a query or mutation call; `review-typescript` beats `review-code` for anything about a type; `improve-code-simplicity` beats every other pass for anything about code that is not needed.

`review-tests` beats `review-code` and `improve-code-simplicity` for findings about whether a test provides confidence, is coupled to implementation, or belongs at the wrong test level. The simplicity pass still owns unnecessary production code.

Then honour `--fix` or `--comment`:

- `--fix` applies **code findings only**. An unmet acceptance criterion means writing a feature, not applying a fix; report it and stop.
- `--comment` posts the findings on the PR or MR. Load the `writing-pr-comments` skill and follow it: it owns how a comment is shaped, triaged, and anchored, so that method has one home and cannot drift from this file. Give it the merged findings, the diff command from step 1, and the PR or MR number. Each finding carries its provenance across, since a pass that observed a failure and a pass that inferred one from the diff must not read alike once posted.

## Guard rails

- **Never suppress a lint rule to resolve a finding.** Fix the underlying code.
- **Never write a ticket reference into a code comment** to resolve an acceptance-criteria finding. Criteria live in the tracker and the PR, not the code.
- **Do not run builds, typechecks, or test suites** as part of the review. CI covers those.
- **Do not restructure a component** to satisfy a reactivity finding. Propose the smallest change that fixes the bug; larger reorganisation is a separate task.
- **Never write to the issue tracker.** This skill reads it; it does not comment, edit, or transition.
