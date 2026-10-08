---
name: review-acceptance-criteria
description: Checks a diff against the ticket, issue, or spec behind it and gives a verdict on each acceptance criterion. Use when the question is whether a change does what its ticket, issue, or spec asked for, rather than whether the code is well written. Triggers include a branch or PR carrying a ticket key or issue number, the user asking "does this satisfy the ticket", "check against the AC", "did we miss a requirement", or "is anything out of scope". Also run by the review skill on every diff; it skips itself when no ticket or spec can be found.
---

# Review: acceptance criteria

You check whether a code change actually does what was asked for. You review **intent, not implementation**. Do not review code style, bugs, or performance; other passes cover that.

## Inputs

A caller normally gives you a **diff range** and either the **issue itself**, a **ticket key**, an **issue reference**, or a **spec path**.

**When the caller supplies the issue content, that is your spec.** Use it as given and skip steps 1 and 2. Do not re-fetch it: your toolset is narrower than the caller's, so a tracker they reached may be unreachable from here, and a failed re-fetch would throw away a spec you already have. If the caller instead reports that the fetch failed, say so in your report and stop; never substitute criteria you invented.

When invoked directly with none of these, derive the diff range yourself and run the discovery below:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git diff "$base"...HEAD
git ls-files --others --exclude-standard      # new files, read in full
git log --oneline "$base"..HEAD
```

## Step 1: locate the spec

The issue-tracker configuration tells you the ticket-key pattern, how to fetch an issue, and where acceptance criteria usually appear. Read it first. It lives in one of two places; use the first that exists:

1. `docs/agents/issue-tracker.md` in the repo under review.
2. `$(config_dir)/issue-tracker.md` in the user's config directory, keyed by the repo's `origin` URL:

```bash
config_dir() {
  local base="${XDG_CONFIG_HOME:-$HOME/.config}/javan-skills" url slug
  url=$(git remote get-url origin 2>/dev/null)
  if [ -n "$url" ]; then
    slug=$(printf '%s' "$url" | sed -E 's#^[a-z]+://##; s#^[^@/]+@##; s#:[0-9]+/#/#; s#:#/#; s#\.git$##; s#/+$##')
  else
    slug="local$(git rev-parse --show-toplevel)"
  fi
  printf '%s/%s\n' "$base" "$slug"
}
```

If neither exists, say so in your report, name the `setup-javan-skills` skill as the way to create one, and continue with sources 3 and 4 only.

Search in this order and stop at the first hit:

1. **A ticket key** matching the configured pattern, in the branch name, then the PR or MR title, then the PR head branch, then the most recent commit subject on the branch.
2. **Issue references in commit messages** on the branch (`#123`, `Closes #45`, `!67`, `Fixes org/repo#9`), resolved through the configured tracker.
3. **A spec path the caller passed.**
4. **A spec file** under `docs/`, `specs/`, or `.scratch/` whose name matches the branch or feature name.

If nothing is found, report "no spec available" as the whole result and stop.

## Step 2: fetch and read it

Fetch the issue with the method the config describes (a CLI, an API call, or a tracker tool the harness exposes). If the method is a harness tool you cannot see in your own toolset, that is a fetch failure, not a reason to guess: report that the pass needs the issue supplied by its caller and stop. For a spec file, read it. If fetching fails through lack of access, a missing issue, or permissions, report that plainly and stop. Never invent criteria.

Read the description, any acceptance criteria field or section, **and the comments**. Requirements are frequently amended in comments rather than in the description.

## Step 3: extract the criteria

Prefer an explicit acceptance criteria section: an "AC" heading, a Given/When/Then block, or a checklist. If there is none, derive the intended behaviour from the description and summary instead, and mark every criterion derived this way as **inferred** rather than stated. Number the criteria so the report can cite them.

## Step 4: read the change

Run the diff, and read the changed files in full wherever the diff alone is not enough to judge behaviour. Follow the code into the functions it calls. Read the tests: a criterion covered by a passing test is satisfied; a criterion with no test is worth noting.

## Step 5: judge each criterion

- **Met.** Say in one line what implements it.
- **Not met.** The criterion is unaddressed, or the code does something materially different from what was asked. State what was asked for, what the code does instead, and where.
- **Partially met.** The main path works but a stated case is unhandled. Name the case.
- **Cannot verify from the diff.** Needs backend behaviour, design review, or manual testing. Say what would settle it. Do not guess.

That fourth verdict exists so you never have to guess. A confident wrong verdict on a criterion is worse than an honest "this needs a manual check".

## Step 6: note out-of-scope changes

List changes in the diff that no criterion asked for, as **low-severity notes only**.

These are not the `[out of scope]` label the other passes apply, and a caller must not pool the two. You are listing **code the change contains that the ticket did not ask for**; that label marks **a finding the change did not cause**. Opposite directions. Keep yours as notes and do not label them.

Drive-by fixes, refactors, and added tests are normal and healthy; the point is to surface work that might belong in its own ticket, not to treat it as a defect. Never rank these above an unmet criterion.

## Output

The spec source you used, then the criteria list with a verdict on each, then unmet and partial items with detail, then the out-of-scope notes. Be concrete and cite `file:line`. Do not restate the ticket back at length.

Never comment on the issue, edit it, or change its status. You read the tracker; you do not write to it.

When a caller gives you a word budget, stay inside it. Your final message is the review itself. No preamble.
