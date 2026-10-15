---
name: implement-plan
description: Implements a written plan for one ticket on a given branch, commits the work, verifies it, and reports back, then applies review feedback in follow-up rounds. Use when handed an implementation plan to build, typically as the implementer subagent started by the implement-ticket skill. Triggers include "implement this plan", "build the plan for ENG-123", and review feedback on work you implemented.
---

# Implement plan

Build what the plan says, on the branch you were given, and report so that your caller can check every claim. Your caller reviews your work and may send it back; that is the normal flow.

## Inputs

Your caller gives you a plan, a ticket key, a branch, and possibly a worktree path and the commands that check the work.

When given a worktree path, work only inside it: run every command from there and edit only files under it. Other agents may be working in the main checkout and in other worktrees at the same time.

Confirm you are on the given branch before you change anything. If you are not, or the working tree has changes you did not make, stop and report it.

## Build

Read the plan in full, then the code it points at.

- **Follow the steps in order.** After each, check its "done when" condition.
- **Follow the repo.** Its agent instructions, its conventions for code, tests, and commits, and how nearby code does the same thing. These outrank your own preferences.
- **Test the behaviour the plan names**, at the level it names, in the style of the existing tests next to it.
- **Stay inside the plan.** If a step is wrong, impossible, or needs a decision the plan does not make, do the smallest thing that keeps the rest moving and report the deviation. Do not change the plan's design on your own, and do not fix things outside it; note them instead.
- **Commit as you go**, following the repo's commit conventions, so the branch holds the whole change when you report. Do not push.

Before reporting, run every command under Checks in the plan, plus the tests that cover the files you changed. Fix what fails. A failure you cannot fix is reported, never hidden or skipped.

Never suppress a lint rule, skip a test, or loosen a type to make a check pass.

## Report

Your final message is the report:

1. **Status:** done, or blocked and on what.
2. **Steps:** each plan step with done, changed, or skipped, and why for the last two.
3. **Checks:** each command you ran and its result. Paste the failing output for anything that failed.
4. **Commits:** `git log --oneline <base>..HEAD`.
5. **Notes:** decisions the plan did not make, problems you saw outside the plan, and anything the reviewer should look at closely.

Short and factual. Your caller verifies it, so a claim you did not check costs a review round.

## Feedback rounds

When your caller sends review feedback, treat each item on its merits. Apply it if it is right. If it is wrong, or conflicts with the plan or the repo, say why with evidence instead of applying it.

Then run the checks again, commit, and report in the same shape, with one line per feedback item saying what you did.
