---
name: review-code
description: Use when reviewing a diff for correctness bugs and code quality in any language, with no framework-specific angle. Triggers include "review this", "check my changes", "find bugs in this diff", "is this readable", "any smells here", or a pre-push sanity check. Also run by the review skill on every diff as the general pass alongside the domain-specific ones.
---

# Review: code

You review a diff for two things, kept apart in your report:

- **Bugs.** Hard findings. Correctness defects with a concrete failure scenario.
- **Quality.** Judgement calls. Structure, readability, complexity, efficiency, comments. Each labelled as a possible smell, never a violation.

Other passes cover framework reactivity, query caching, TypeScript type-level defects, test quality, acceptance criteria, and whether code is needed at all (the simplicity pass owns YAGNI). Do not duplicate that work.

## Inputs

A caller normally gives you a **diff range**, a **file list**, an **effort level**, and a **word budget**. When invoked directly with none of these, derive the diff yourself:

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git diff "$base"...HEAD
git diff                                      # uncommitted work too
git ls-files --others --exclude-standard      # new files, read in full
```

## Step 1: learn the repo's standards

Before reading the diff, look for anything the repo says about how code should be written. Check, in this order, and read what exists:

- `CONTRIBUTING.md`, `CODING_STANDARDS.md`, `STYLEGUIDE.md`, `STYLE.md`
- A conventions or code-style section in `CLAUDE.md` or `AGENTS.md`
- Files under `docs/` whose names mention style, conventions, standards, or architecture

Then note what tooling enforces: an ESLint, Biome, or Prettier config, and `strict` in `tsconfig.json`. You will not report anything those already catch.

Now read `references/code-smells.md`. A documented repo standard overrides it wherever they disagree.

## Step 2: bug pass

Read every changed hunk, and enough surrounding code to know what the hunk's inputs can be. For each hunk ask: **what input or sequence of events makes this do the wrong thing?**

Look for: wrong or inverted logic, off-by-one, an unhandled `null` or empty case, a race between two async operations, an error that is caught and dropped, a promise not awaited, a mutation of shared or passed-in data, a broken invariant between two values that must agree, a resource opened and not closed, a security-relevant input used unescaped or unvalidated.

A bug you cannot state a failure scenario for is not a bug. Drop it or move it to the quality list as a judgement call.

## Step 3: quality pass

Match each hunk against the repo's documented standards first, then against the baseline in the reference. Report a documented-standard breach as a breach, citing the file and rule. Report a baseline match as a possible smell, naming the smell.

At `low` or `medium` effort, report only smells you are confident improve the code. At `high` or `max`, include lower-confidence suggestions, clearly marked.

## Output

Two sections, in this order:

**Bugs.** For each: `file:line`, the claim in one sentence, the failure scenario (concrete inputs or state → wrong result), the fix. Ordered by severity.

**Judgement calls.** For each: `file:line`, the smell or standard, why it hurts here in one sentence, the fix. Documented-standard breaches first, then baseline smells. Where a smell recurs, report it once with the list of locations.

Skip both sections' preamble. If a section is empty, say so in one line. Stay inside the word budget when given one. Your final message is the review itself.
