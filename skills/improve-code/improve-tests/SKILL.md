---
name: improve-tests
description: Audit and improve existing automated tests so they detect meaningful behaviour changes without becoming brittle, flaky, or unnecessarily expensive. Use after writing or changing unit, integration, contract, component, or end-to-end tests; for requests such as "improve these tests", "strengthen the test suite", "reduce brittle mocks", "clean up flaky tests", "make these tests high quality", or "split these tests at the right level". Apply changes and run affected tests; use review-tests instead for report-only code review.
---

# Improve tests

Strengthen tests already in scope. Optimize for confidence per maintenance cost: tests should fail for meaningful behaviour changes, survive internal refactors, run reliably, and explain failures clearly.

`review-tests` owns the canonical quality rules. Call the Skill tool with `review-tests`, then apply its findings; do not reproduce a second checklist here.

## Scope

Use an explicit path or file list when given. Otherwise scope to test files, fixtures, snapshots, helpers, and test configuration in the current change:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git diff --name-only "$base"...HEAD
git diff --name-only
git ls-files --others --exclude-standard
```

Read the related production change and requirements so the tests can be judged against behaviour. Do not sweep unrelated pre-existing tests.

## Step 1: learn and baseline

Read the repository's testing instructions, runner configuration, package/build scripts, and neighbouring tests. Identify the narrowest command that runs the scoped tests.

Run that command before editing. If the baseline fails, record the failures and distinguish them from your changes. Do not silently treat a pre-existing failure as an improvement task.

## Step 2: get the review

Call the Skill tool with `review-tests`. Give it:

- the diff or explicit scope;
- the absolute changed test-file list;
- the related production files and requirement when known;
- `high` effort and no edits.

Read its whole report. Confirm each finding against the code before editing; the report is evidence to act on, not an instruction to apply mechanically.

## Step 3: improve in confidence order

Apply the smallest coherent changes in this order:

1. Fix tests that can pass when behaviour is wrong, fail without a behaviour change, or do not execute their assertions.
2. Add missing high-value cases for changed behaviour at the lowest faithful test level.
3. Replace implementation-detail assertions and internal mocks with observable results, state, or a more stable seam.
4. Remove nondeterminism, shared-state leakage, sleeps, and unreliable cleanup.
5. Clarify names, setup, helpers, assertions, and file boundaries where doing so improves diagnosis or maintenance.
6. Remove duplicate or no-value tests only after proving the same risk remains covered.

Edit tests, test fixtures, test helpers, snapshots, and test configuration only. If a stable test requires a production seam that does not exist, report the design constraint instead of changing production code.

## Step 4: verify

Run the narrow affected test command after each coherent group of edits. Also run the repository's targeted lint or typecheck for changed test files when available.

When practical, prove a new or materially strengthened test is discriminating by using existing mutation tooling or by running a regression test against the known failing revision. Do not install a mutation tool or deliberately corrupt a dirty production file just to demonstrate red.

If a stronger test exposes a production defect, do not weaken the test or change production code. Stop, report the defect and failing command clearly, and say whether the failing test remains in the working tree.

## Output

List:

1. improvements as `file:line`, the risk addressed, and why confidence is stronger;
2. findings not applied and why;
3. every test/lint/typecheck command run and its result;
4. any production defect or design constraint exposed.

No preamble.

## Guard rails

- Preserve production behaviour and public contracts.
- Do not add a new runner, assertion library, dependency, or coverage threshold unless asked.
- Do not update a snapshot without inspecting and explaining the behavioural change it records.
- Do not replace controlled integration coverage with mocks merely to make a test faster.
- Do not add exhaustive permutations, line-coverage padding, or framework-self-tests.
- Do not use fixed test-pyramid percentages; choose levels by risk, fidelity, and feedback time.
- Do not force every test to contain one assertion. Keep one logical behaviour per test.
