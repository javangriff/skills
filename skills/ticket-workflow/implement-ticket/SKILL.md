---
name: implement-ticket
description: Takes a Jira, Linear, or GitHub ticket from read to pull request, delegating the implementation to a subagent and reviewing its work until it is right. When the ticket is a parent, finds the child tickets ready to start and either picks up the first or runs one per child in parallel as an orchestrator. Use when the user hands over a ticket to deliver. Triggers include "pick up this ticket", "implement ENG-123", "work on #45", "take this issue to a PR", a ticket URL with an instruction to build it, and "do the ready subtasks of this epic".
---

# Implement ticket

Deliver a ticket as a reviewed pull request. You are the lead: you understand the ticket, own the plan, judge the work, and open the PR. A subagent writes the code.

Three skills share this work:

| Skill | Role |
| --- | --- |
| `implement-ticket` | This file. Reads the ticket, routes parents, runs the pipeline, reviews, opens the PR. |
| `plan-ticket` | Turns one ticket into a plan a subagent can follow without the conversation. |
| `implement-plan` | The implementer subagent. Follows a plan, commits, reports, and takes review feedback. |

Your prompt to a subagent is its **inputs**, never its method. The method lives in its skill so the two cannot drift.

## Progress

```
Ticket progress:
- [ ] 1. Ticket fetched and read, comments included
- [ ] 2. Parent check done; mode chosen (single / first child / one per child)
- [ ] 3. Branch (or worktree) created from an up-to-date main branch
- [ ] 4. Plan written
- [ ] 5. Implementer dispatched with the plan
- [ ] 6. Review loop closed: checks pass, review clean, criteria met
- [ ] 7. Pull request opened
```

## Step 1: fetch the ticket

The tracker comes from the reference the user gave:

- `*.atlassian.net/browse/KEY-123` or a bare key like `ENG-123` → **Jira**
- `linear.app/<team>/issue/KEY-123` → **Linear**
- `github.com/<owner>/<repo>/issues/<n>` or `#<n>` → **GitHub**

Read the repo's issue-tracker config for the fetch method and key pattern. It lives at `docs/agents/issue-tracker.md` in the repo, else at `${XDG_CONFIG_HOME:-$HOME/.config}/javan-skills/<host>/<owner>/<repo>/issue-tracker.md` keyed by the `origin` URL. Without one, say so, name the `setup-javan-skills` skill, and fetch with what the harness offers: a tracker tool (Atlassian or Linear integration), `gh issue view`, or the tracker's REST API. When a tracker tool's schema is not loaded, load it first.

Read the summary, description, acceptance criteria, linked designs or docs, **and every comment**. Requirements change in comments.

If you cannot fetch it, stop and say why. Never implement from the title alone.

## Step 2: route a parent ticket

A ticket is a parent when it has children: Jira subtasks or issues whose `parent` is this key (`parent = KEY` in JQL), Linear sub-issues, or GitHub sub-issues (`gh api repos/{owner}/{repo}/issues/<n>/sub_issues`) and task-list items that link issues.

Not a parent: go to step 3 in **single mode** with this ticket.

A parent: fetch every child with its status, assignee, and links, and sort each into one of three groups.

- **Ready.** Not done, not in progress, unassigned or assigned to the user, and every "is blocked by" or "depends on" link points at a finished ticket.
- **Blocked.** Waiting on an unfinished ticket. Name it.
- **Taken or done.** In progress, in review, assigned to someone else, or closed.

Show the user the three groups in a short table, in the parent's own order. If nothing is ready, stop there. Otherwise ask:

> N child tickets are ready. How do you want to proceed?
>
> - **First ready ticket** (KEY-1): I deliver that one end to end.
> - **All N in parallel**: I orchestrate one pipeline per ticket, each in its own worktree, and open one PR each.

Offer only the first option when one child is ready. Do not choose for the user; their answer decides how much runs at once.

- **First ready ticket:** fetch it, then continue at step 3 in single mode.
- **All in parallel:** continue at step 3 in **orchestrator mode**.

The two modes run the same pipeline. They differ in where work happens and who plans:

| | Single mode | Orchestrator mode |
| --- | --- | --- |
| Workspace | a new branch in the current checkout | one git worktree per ticket |
| Planning | you, inline | one planner subagent per ticket |
| Implementing, reviewing, PR | subagent / you / you | same, once per ticket |

Every subagent is started by you. No subagent starts another one, so the pipeline works in harnesses that do not allow nesting, and one lead sees every ticket.

## Step 3: create the workspace

Check the working tree is clean first; if it is not, ask before going on. Then fetch and branch from the up-to-date main branch.

Name the branch the way the repo does. Read its agent instructions and contributing docs, and look at recent branch names (`git branch -r --sort=-committerdate | head -20`). Include the ticket key.

In orchestrator mode, create one worktree per ticket beside the repo, each on its own branch:

```bash
git fetch origin
git worktree add "../$(basename "$PWD")-<key>" -b <branch> "origin/<main>"
```

Record each ticket's key, branch, and absolute worktree path. Every later step passes them on.

## Step 4: plan

**Single mode:** call the Skill tool with `plan-ticket` and give it the ticket you fetched. Planning yourself means you understand the change well enough to judge it later.

**Orchestrator mode:** start one subagent per ticket in **one step** so they overlap. Tell each to load `plan-ticket` (a same-named agent definition may exist; either is fine) and give it the ticket content verbatim, the branch, and the worktree path. Read each returned plan before moving on: a plan that guesses at something the ticket does not say goes back with the question, or to the user.

Planners read; they do not edit, so they can share the repo safely.

## Step 5: dispatch the implementer

Start a subagent per ticket, all in one step in orchestrator mode. Tell it to load `implement-plan` and give it:

- the plan, verbatim
- the ticket key and branch, and in orchestrator mode the absolute worktree path
- the commands that check the work (test, lint, typecheck) if the plan names them

Keep a handle on each implementer so feedback in step 6 reaches the same one with its context intact. If the harness cannot continue a finished subagent, start a fresh one with the plan, the current diff command, and the feedback.

## Step 6: review until it is right

When an implementer reports, check its claims before you read its code. A report that says "tests pass" is not evidence.

1. In the ticket's workspace, run the checks yourself: the tests that cover the change, lint, and typecheck. Confirm the working tree is clean and every change is committed.
2. Call the Skill tool with `review` and the branch as its target. It runs the review passes, including acceptance criteria, and merges one report. Give it the ticket you already fetched so it does not fetch again.
3. Read the diff yourself against the plan. Look for what a pass cannot see: a plan step skipped, a change the plan did not ask for, a deviation the report did not mention.

Then decide:

- **Done** when the checks pass, every acceptance criterion is met or marked as needing a manual check you can name, and no unlabelled finding is left that you agree with.
- **Not done:** send the implementer one message with every change you want, each with `file:line`, the reason, and the fix. Disagree with a finding instead of forwarding it when it is wrong; you own the result, not the review. Labelled findings (`[out of scope]`, `[convention change]`) are not sent; keep them for the PR notes.

Repeat from 1 after each round. After three rounds without convergence, stop and bring the open points to the user rather than looping.

In orchestrator mode, review each ticket as its implementer reports. Do not wait for the slowest one.

## Step 7: open the pull request

Push the branch, then open the PR with the forge's CLI (`gh pr create`, `glab mr create`).

- **Template.** Use the repo's PR template if one exists: `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/`, `docs/pull_request_template.md`, a root `pull_request_template.md`, or `.gitlab/merge_request_templates/`. Fill its sections; do not delete them.
- **Body.** Call the Skill tool with `writing-pr-descriptions` and follow it inside the template.
- **Title.** The repo's convention, with the ticket key where the repo puts one.
- **Link.** Link the ticket the way the tracker expects (`Closes #45`, or the Jira or Linear key).

Then report to the user: the PR URL, what was built, any criterion that needs a manual check, and the held-back review findings as candidates for follow-up tickets. In orchestrator mode, one line per ticket, then the details.

In orchestrator mode, the worktrees stay until the user removes them. Tell them the paths and `git worktree remove <path>`.

## Guard rails

- **Never write to the tracker** (comment, assign, transition) unless the user asks. Opening a PR that links the ticket is enough.
- **Never push to the main branch** or force-push a branch you did not create.
- **Never widen the ticket.** Work the ticket did not ask for becomes a note in the PR or a suggested follow-up, not code.
- **Never claim done without evidence.** The checks you ran yourself, and the review report, are the evidence.
