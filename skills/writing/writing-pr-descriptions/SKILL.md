---
name: writing-pr-descriptions
description: Writes short pull request descriptions that explain why a change exists and why it takes its shape, instead of listing what changed. Use when writing, drafting, or rewriting the description (body) of a pull request or merge request, including when opening a PR with `gh pr create` or `glab mr create`. Triggers include "open a PR", "raise a PR", "write the PR description", "draft the PR body", "update the PR description", "tidy up this PR description", and a PR body that reads like a changelog or a list of files touched.
---

# Writing PR Descriptions

A PR description exists to give a reviewer what the diff cannot: why this change exists, and why it takes the shape it does. The diff already says *what* changed, line by line. A description that restates it costs the reviewer a read and tells them nothing.

Write the shortest description that lets a reviewer who has not seen the ticket understand the intent before they open the diff.

## Before you write

Read the diff, the commits, and the linked issue or ticket if there is one. Then read the code the diff touches and calls: what the old code did is often outside the diff, and it is what the description has to explain. Answer these for yourself:

1. What was wrong, missing, or wanted, in terms of behaviour someone could observe?
2. Why this approach? Was there an obvious alternative, and why is this one better?
3. What would a reviewer get wrong, or need to check, reading the diff cold?

If you cannot answer the first question, you are not ready to write. Ask, or read more.

## The shape of a description

Keep the title the repo's convention sets. For a single-commit PR, that is usually the commit headline; do not rewrite it.

Write the body as these parts, in this order. Leave a part out when you have nothing true to say in it; never pad one to fill it.

1. **The problem or intent.** One to three sentences on why the change exists, stated as behaviour: what a user, caller, or system did before, and what it should do. One idea per sentence: if a sentence needs rereading to follow, split it. Lead with this. No "This PR..." preamble and no "Summary" heading over it.
2. **An example, when one makes it concrete.** A short code block that shows the behaviour, not the diff: a call that used to misbehave and what it now does, the before-and-after of an API, or a tiny sketch that breaks a complex idea into one readable chunk. Comment the lines that matter. If the prose already makes the point, leave it out.
3. **The approach.** How the change fixes it, at the level of the idea, and why this way. Name a code element only when the reviewer needs it to find their bearings. Saying why the fix is complete (every path that had the bug goes through the changed code) belongs here.
4. **Reviewer notes.** A risk, a trade-off, a deliberate omission, a follow-up, the one file that deserves the closest look.
5. **Testing.** Only what the reviewer cannot see from CI or the diff: a manual check, a suite that did not run and why, a scenario you reproduced. Tests added, enabled, or changed are in the diff, so they are not mentioned here, even when the issue lists them as an acceptance criterion.
6. **The issue link, when there is one.** `Closes #123`, or the tracker's equivalent, on its own line. With no linked issue, end on the last part that has something to say.

Every sentence in the approach and the reviewer notes must do one of four things: explain why the fix works or is complete, change what the reviewer checks, describe a difference a caller or user can observe, or answer a question the reviewer would otherwise ask ("why not a deep clone?", "is this a breaking change?"). Delete a sentence that does none of these, such as one that narrates ordering or detail the reviewer reads in a few lines of diff, or one about a behaviour change no caller can reach.

Headings are for long descriptions. A description that fits on one screen reads better as plain paragraphs.

## Length

Scale with the size of the *idea*, not the size of the diff. A one-line fix to a subtle bug may need a paragraph and an example. A 40-file rename may need one sentence. Most descriptions are under 150 words of prose.

## Common mistakes

| Mistake | Fix |
|---|---|
| A bullet per change or per file | Say the one idea those changes serve. The reviewer reads the list in the diff. |
| Restates the commit title as the first line | Start with the problem the title does not explain. |
| Test counts, coverage figures, "lint and typecheck passed" | Delete. CI shows these. Keep only what CI cannot show. |
| "Tests added", "the regressions now pass" | Delete. The diff shows it. |
| A sentence on how small the diff is ("which is why only one file changed") | Delete. The reviewer sees the size when they open the diff. Saying which callers go through the change is different: that explains why the fix is complete, so keep it. |
| A sentence that announces the next one ("This covers every case." followed by the cases) | Delete it and let the next sentence carry the point. |
| Code block that pastes the diff | Show the behaviour instead: a call, its old result, its new result. |
| Describes the fix in the issue's words without the why | Say what goes wrong for someone, then how this stops it. |
| "Summary", "Changes", "Verification" headings on a four-line body | Drop the headings. |

## Examples

Read `references/examples.md` for a before-and-after on a real PR.

## Related skills

`simplified-technical` applies when the repo asks for plain controlled language, and governs the wording here. If the repo has a PR template, fill its sections using this skill's parts rather than discarding it.
