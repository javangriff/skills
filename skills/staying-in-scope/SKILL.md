---
name: staying-in-scope
description: Decides whether a change belongs in the current piece of work, by checking the repo's prior art for the pattern and whether the work caused the issue, and labels review findings that belong elsewhere. Use before introducing, proposing, or reporting a change to how something is done. Triggers include being about to restructure, rename, extract, or adopt a new pattern; planning work that touches code the ticket did not ask for; a review finding about code the diff did not author; and any point where a local improvement might split a convention the rest of the repo follows. Loaded by the review passes so the scoping rule has one home.
---

# Staying in scope

Two questions decide whether a change belongs where you are about to put it:

1. **Is this this change's job?** Or would it be true whether or not this branch existed?
2. **Does this match how the repo already does it?** Or does adopting it here alone split a convention?

A change that fails either question is not necessarily wrong. It is in the wrong place, at the wrong size, or owed a decision nobody has made yet. Answering "no" is not a reason to stay quiet; it is a reason to say which of the two failed, and let a human choose.

This skill owns that decision. It applies when writing code, when planning work, and when reviewing a diff. The check is the same in all three; only what you do with the answer changes.

## What this never applies to

**A bug keeps its severity.** A correctness defect — a wrong result, a crash, a security hole, data loss — is fixed or reported plainly, however unusual the fix has to be. Consistency is never a reason to leave a bug in, and scope is never a reason to ship one.

This skill governs **pattern changes**: restructuring, extracting, inlining, renaming, introducing an abstraction, adopting a library or helper, changing how something is organised. Those are the changes that can be locally right and globally wrong.

## The prior-art check

**Before you introduce or propose a pattern, look at how the repo already does it.** Not after, and not only when it occurs to you. The pattern you have in mind is the hypothesis; the repo is the evidence.

```bash
git grep -n '<the pattern you are proposing>'      # does the repo already do it your way?
git grep -n '<the pattern the code uses today>'    # how widespread is the current way?
```

Search the whole repo, not just the files in front of you. Count distinct files, not hits, since one file can use a pattern ten times. Then:

| What you find | What it means |
| --- | --- |
| No prevailing pattern either way | Proceed. There is no convention to break. |
| The repo already does it your way | Proceed, and cite a prior-art `file:line`. This is the strongest position you can be in. |
| The repo consistently does it another way | A convention change. Do not make it silently. Cite at least two existing `file:line` instances of the current way. |
| Mixed, with no clear majority | Proceed, and say the repo is split. A split convention is not a convention. |

**The evidence bar is two instances in two files.** One other occurrence is a coincidence, not a convention. If you cannot produce the citations, you have not done the check, and you must not assert a convention on a hunch — in either direction.

A documented standard counts as prior art on its own: a rule in `CONTRIBUTING.md`, `CLAUDE.md`, `AGENTS.md`, or a lint config outranks any head-count of files. Cite the rule instead of the instances.

## The scope check

Ask: **would this be worth doing if the current task did not exist?** If yes, it is out of scope for the current task. If the work introduced it, moved it, or made it reachable, it is in scope.

Touching a line does not make its whole file yours. Adding one argument to a function does not adopt that function's pre-existing problems, and fixing a bug in a file does not commission a cleanup of it.

## When writing code or planning

Run both checks **before** you write the code, not after. The cost of the answer rises steeply once the code exists, because by then the choice has been made and the conversation is about undoing it.

- **Prior art says the repo does it another way.** Follow the existing pattern, and say in one line that you did and what the alternative was. If you believe the existing pattern is genuinely wrong, say so and ask before diverging: a convention change is a decision for the human, and it is a separate piece of work from the one you were given.
- **The improvement is out of scope.** Do the task you were given. Note the improvement as a follow-up candidate, with what it would touch, and move on. Do not fold it in because you happened to be in the file.
- **Neither check fires.** Proceed without ceremony. Most work clears both.

Never silently adopt a new pattern in one file because it is better in isolation. That is precisely how a codebase acquires an inconsistency that nobody chose.

## When reviewing

A review pass that reports every correct finding as if it were actionable sends the author outside the intent of their change, or lands a pattern in one file that the rest of the repo does differently. Neither is fixed by dropping the finding. Label it instead.

| Label | Means |
| --- | --- |
| `[out of scope]` | Correct, but this change did not cause it. Pre-existing debt in a touched file, a problem in adjacent code the diff merely reads, a weakness that predates the branch. |
| `[convention change]` | Correct in isolation, but the repo already does this another way. Applying it here alone splits the convention, so the real change is repo-wide. |

An unlabelled finding is the default and means: this change introduced it, and fixing it here leaves the codebase consistent.

Write a labelled finding exactly as your pass normally would — `file:line`, the claim, the consequence, the fix — then add:

- the label, leading the finding so it is visible before the detail;
- the evidence for the label: the prior-art citations, or why the change did not cause it;
- what the real change would be, in one line: which files a consistent fix touches, or that it belongs in its own ticket.

That last line is what the caller triages on. "Adopting this across the 11 query modules that do it the old way" and "a one-line fix in a file this PR already touches" are different decisions, and only the pass knows which it is.

Do not soften a labelled finding. It is not a lesser finding, it is a finding with a different owner. The caller decides whether to action it now or raise it as a follow-up: that decision is not yours to pre-empt by dropping it, and not yours to force by presenting it as blocking.
