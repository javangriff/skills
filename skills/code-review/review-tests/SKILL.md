---
name: review-tests
description: Review changed automated tests for false confidence, missing behaviour, brittleness, flakiness, and inappropriate test scope. Use when reviewing a diff, PR, branch, or test file that changes unit, integration, contract, component, or end-to-end tests; when asked whether tests are meaningful, sufficient, resilient, too mocked, or at the right level; or as the test-quality pass selected by the review skill. Report findings only; do not edit or run tests.
---

# Review tests

Judge whether the changed tests buy useful confidence without making the codebase harder to change. A good test is sensitive to behaviour changes, insensitive to structure changes, deterministic, readable, and specific when it fails.

Read `references/test-quality-rules.md` in full before reviewing. It is the canonical test-quality bar for this skill and for `improve-tests`.

## Inputs

A caller normally gives you a **diff command**, a **changed test-file list**, an **effort level**, and a **word budget**. When invoked directly with none of these, scope to the current change:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git diff "$base"...HEAD
git diff                                      # uncommitted work too
git ls-files --others --exclude-standard      # new files, read in full
```

The diff is the scope. Review changed tests, fixtures, snapshots, test helpers, and test configuration. Read related production code and pre-existing tests only as context. Do not report unrelated weaknesses in the existing suite.

## Step 1: learn the testing contract

Read the repository's `AGENTS.md`, `CLAUDE.md`, contributing guide, testing docs, and relevant test-runner configuration. Inspect package/build scripts and neighbouring tests to learn:

- test file conventions and available test levels;
- which dependencies are deliberately real, fake, or mocked;
- how state, clocks, random values, and external services are controlled;
- the public seam and behaviour vocabulary used by the repository.

Read the requirement, ticket, or related production change when available. A coverage gap requires a behaviour or risk to be missing, not merely an uncovered line.

## Step 2: interrogate each changed test

For every changed test, be able to state:

1. the observable behaviour it specifies;
2. the public seam through which it acts and observes;
3. the independent source of its expected result;
4. one plausible defect that would make it fail;
5. why its test level is the smallest scope that proves the behaviour faithfully.

If one of these has no convincing answer, match the test against the reference. Also inspect test setup, cleanup, helpers, data, and assertions for false passes, nondeterminism, or hidden coupling.

## Step 3: find missing confidence

Compare the changed behaviour with its tests. Look for omitted equivalence partitions, boundaries, invalid input, error paths, state transitions, concurrency, or integration contracts that are material to the change. Recommend the lowest test level that can expose the risk.

Do not demand every permutation, every line, or the same scenario at every layer. Do not use a coverage percentage as evidence of quality.

## Scope labels

Call the Skill tool with `staying-in-scope` and follow it before you report anything. It decides when a finding is correct but belongs outside this change, and it owns the two labels the caller triages on: `[out of scope]` for a finding this change did not cause, and `[convention change]` for one the repo already does another way. Its prior-art check is not optional for a finding that introduces, renames, or restructures a pattern.

Apply the labels exactly as that skill describes, keep labelled findings in your normal severity ranking, and let the caller separate them. If you cannot load the skill, say so in your report and label nothing rather than inventing a scheme.

## Output

Return two sections:

**Hard findings.** A changed test can pass while its claimed behaviour is wrong, can fail without a behaviour change, or asserts a contract contradicted by the source of truth. For each: `file:line`, the claim, the concrete false-pass/false-fail scenario, and the fix. Order by severity.

**Judgement calls.** Missing high-value cases, implementation coupling, excessive mocking, wrong test level, duplicate cross-layer coverage, unclear structure, or needless maintenance cost. For each: `file:line`, the named rule, why it hurts here, and the specific improvement. Group repeated instances.

If a section is empty, say so in one line. Stay inside the word budget. Your final message is the review itself, with no preamble.

## Guard rails

- Do not edit files or run tests, builds, coverage, or mutation tools. This is a review pass; CI and `improve-tests` own execution.
- Do not report naming or Arrange/Act/Assert preferences when the test is already clear.
- Do not equate multiple assertions with multiple behaviours.
- Do not ban mocks categorically. Judge what boundary they replace and whether interaction is the contract.
- Do not replace a high-fidelity test with a narrower test unless the narrower test covers the same risk.
- Do not review production code except where it proves a test finding.
