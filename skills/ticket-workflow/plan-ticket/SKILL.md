---
name: plan-ticket
description: Turns one ticket into an implementation plan that a subagent with no access to the conversation can follow, grounded in the code it will change. Use when a ticket, issue, or spec needs a plan before someone builds it, or when handing implementation to another agent. Triggers include "plan this ticket", "write an implementation plan", "how would we build ENG-123", and the implement-ticket skill's planning step.
---

# Plan ticket

Write the plan an implementer needs to build one ticket without asking anyone a question. The implementer has the plan and the repo. It has not seen the ticket discussion, the conversation, or the code you read. Anything it needs, the plan says.

You read and plan. **You do not edit files, create branches, or commit.**

## Inputs

A caller usually gives you the ticket content, and may give you a branch and a worktree path. When given a worktree path, read the code there.

Invoked directly with only a ticket key or URL, fetch it as the `implement-ticket` skill describes in its step 1. Without the ticket's content, stop; never plan from a title.

## Step 1: understand the ask

Read the description, the acceptance criteria, linked designs or docs, and every comment. Write down for yourself:

- the behaviour a user or caller sees today, and what they should see after
- each acceptance criterion, numbered; mark any you had to infer from the description as **inferred**
- what the ticket leaves open

An open question that changes what gets built goes back to your caller, not into a guess. Say what you would assume if told to proceed.

## Step 2: read the code

Find where the change lands and read it. Follow the calls in and out far enough to know what else depends on it. Find:

- the repo's conventions that apply: its agent instructions, contributing docs, and how nearby code does the same kind of thing. Load the `staying-in-scope` skill before you choose a pattern the repo does not already use.
- an existing utility, component, or helper the change should reuse
- the tests that cover this area, and how the repo writes them
- the commands that check the work: test, lint, typecheck, build. Read them from the package scripts, Makefile, or CI config; do not guess.

## Step 3: write the plan

Use this shape. Leave a section out when it would be empty.

```markdown
# <KEY>: <summary>

## Goal
Two or three sentences: the behaviour change and why it is wanted.

## Acceptance criteria
1. ... (inferred, where it is)

## Context
What the implementer must know about the code: the files involved and their roles,
the conventions to follow, and the existing code to reuse, each with a path.

## Steps
1. <one change>: what to do, in which files, and which criterion it serves.
   Done when: <an observable check>.
2. ...

## Tests
Which behaviour to test, at which level, in which file, following which existing test.

## Checks
The exact commands to run before reporting.

## Out of scope
What the implementer might be tempted to change and must not.

## Open questions
Anything the implementer should report on rather than decide.
```

Order the steps so the code works after each one. Make each step small enough to review on its own and name the files it touches. Point at code by path and symbol, and quote a line or two when that saves the implementer a search; do not write the implementation out in full.

Every criterion maps to at least one step. A step that maps to no criterion either belongs in Out of scope or needs a sentence explaining why the ticket needs it.

## Output

Your final message is the plan, and nothing else. Your caller hands it to the implementer verbatim.
