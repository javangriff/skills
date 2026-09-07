---
name: improve-code-simplicity
description: Use after writing or changing code and before committing it, to cut the change down to the least code that does the job. Triggers include finishing an implementation, "simplify this", "trim this down", "apply YAGNI", "is any of this unnecessary", or code that feels over-engineered, over-abstracted, or padded with options nobody uses. Also run by the review skill in report mode as its simplicity pass.
---

# Improve code simplicity

Make a change as small as it can be while still doing its job. You are adversarial towards new code: every abstraction, parameter, branch, export, and utility the change introduced has to justify itself against something that exists right now, or it goes.

Read `references/simplicity-rules.md` in full before you start. It carries the rules and, just as important, the list of things that look speculative and must be kept.

## Modes

- **Apply** (default when invoked by hand or after writing code): make the cuts, run the project's existing tests on the touched files, report what was cut and why.
- **Report** (when the caller says "report mode"): same analysis, no edits. Findings in the review shape described under Output.

## Inputs

A caller may give you a **diff range**, a **file list**, and a **word budget**. When invoked directly with none of these, scope to the current change:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git diff "$base"...HEAD
git diff                                      # uncommitted work too
git ls-files --others --exclude-standard      # new files, read in full
```

The diff is the scope. Pre-existing code the change merely touched is out of bounds unless the change made it dead.

## Step 1: learn what the repo requires

Look for documented standards: `CONTRIBUTING.md`, `CODING_STANDARDS.md`, a conventions section in `CLAUDE.md` or `AGENTS.md`, and lint or TypeScript config. A documented requirement overrides every rule in the reference. Note what the repo already provides that new code might duplicate; the reference's Reimplementation entry says where to look.

## Step 2: interrogate every unit

For each function, type, parameter, export, branch, and file the change introduced, ask the reference's question: **what, present in the repo right now, needs this?** Answer it with evidence, not assumption:

```bash
git grep -n 'symbolName'     # callers and importers; respects .gitignore
```

Zero callers, one caller for an abstraction, a value every caller passes identically, a branch no caller can reach: each is a cut. Check the "Kept on purpose" list before cutting anything that handles input, errors, or accessibility.

## Step 3: cut (apply mode only)

Make each cut as the reference directs: inline, remove, hard-code, or replace with the existing utility. Keep behaviour identical for every current caller. Then run the project's existing tests for the touched files only, using whatever runner the repo has (`package.json` scripts, `nx test <project>`, `vitest run <path>`). Do not write new tests, and do not run the whole suite.

If a test fails, the cut changed behaviour. Revert that cut and list it under "not cut" with the failing test's name.

## Output

**Apply mode.** A list of cuts, each as `file:line`, what was removed, and the one-line reason (the rule and the evidence: "one caller, at `x.ts:40`"). Then a "not cut" list: things that looked speculative but a repo standard, a test, or the kept-on-purpose list protected, with the reason. Then the test command you ran and its result. No preamble.

**Report mode.** Every finding as a judgement call: `file:line`, the rule, the evidence, the specific cut. Where the same rule recurs, report it once with the list of locations. Stay inside the word budget when given one. Your final message is the report itself. No preamble.

## Guard rails

- **Never remove a test that covers existing behaviour.** Only tests the change added are candidates, and only when they assert nothing.
- **Never change a published package's public surface** (an exported API consumed outside the repo) without saying so before the cut, and in report mode instead of apply mode.
- **Never suppress a lint rule** to make a cut compile.
