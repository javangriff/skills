---
name: writing-pr-comments
description: Use when writing or posting comments on a pull request or merge request, whether inline on a line, as a review summary, or as a reply to someone else's comment. Triggers include "post these as PR comments", "comment on the PR", "leave a review", "add a comment to the PR", "--comment", turning review findings into comments, and replying to reviewer feedback. Also used by the review skill when it is asked to post its findings rather than print them.
---

# Writing PR Comments

A review comment has one job: give the author enough to decide what to do, and make the decision feel like theirs. A comment that states a defect but leaves the author guessing how urgent it is, how you know, or whether they may disagree has done half the job.

## The shape of a comment

Write each comment as these parts, in this order. Omit a part only when it genuinely does not apply.

1. **The claim.** What is wrong, in one sentence, in plain words. Lead with the thing itself, not a preamble.
2. **The consequence.** The concrete scenario where it bites: the input, the state, what the user or the build sees. This is what turns an opinion into a finding.
3. **How you know.** Say whether the failure was observed or read off the code, because the author weighs those differently. Mirror the evidence you actually hold, at the precision you hold it: if all you know is that it was verified, write that it was verified, and let the venue go unnamed. Name a browser, an app, a test run, or an environment only when that venue is a fact you were given or a thing you did. Absent a run, "reading the code, so worth a sanity check" is the honest form and costs the finding nothing.
4. **The suggestion.** The smallest change that fixes it, offered as a suggestion. A short code block when the shape is not obvious from words; otherwise words.
5. **The scope signal.** Say where it belongs: blocking, fix in this PR, fine as a follow-up, or take it or leave it. **Never leave this to be inferred.**

## Scope signals

| Signal | Use when |
|---|---|
| "worth fixing before this merges" | A user-visible defect or a correctness bug |
| "could go in this PR or a follow-up, your call" | Real but not urgent |
| "happy for this to be a follow-up, it is a bit outside this PR's scope" | Correct but the PR did not cause it |
| "flagging rather than asking, happy for it to stay" | Judgement call, public API, or style |

## Triage before you post

Sort findings by what they cost a user, and post the ones that earn their place. A comment thread that is nine tenths nitpick trains the author to skim.

- Drop the marginal nit. If your own scope signal would be "take it or leave it" and the finding is cosmetic, it is usually better unsaid.
- Fold a small related point into a neighbouring comment as a footnote rather than opening a second thread on adjacent lines.
- Open the review body with what is genuinely good in the change, specifically, not as a throat-clear.

## Tone

Write as a colleague reading a teammate's work, not a linter.

- Plain commas and full stops carry the rhythm. Reach for an em dash rarely, if at all.
- Ask rather than instruct where a choice exists: "could we pin it to the known set?" over "pin it to the known set".
- Concede what you do not know: "one caveat before changing it", "worth a check with the backend first".
- Stay on the line you are commenting on. A tangent about naming or an unrelated rule belongs in its own comment, or nowhere.
- Cut the implementation tip that is not needed to make the point.

## Posting mechanics

- An inline comment must anchor to a line **present in the diff**. Parse the diff's hunk headers for addressable right-side lines before you post; a comment on an unchanged line is rejected.
- When the line you mean is not in the diff, anchor on the nearest changed line that caused the problem and name the real line in the body.
- Post as a plain comment. Reach for "request changes" or "approve" only when the user asks for a verdict.
- Post the batch as one review rather than many single comments, then read the result back to confirm each landed on the line you intended.

## Common mistakes

| Mistake | Fix |
|---|---|
| No scope signal, author cannot triage | Add one. It is a required part, not a flourish. |
| Observed and read-from-code findings look identical | Say which. It changes how much the author trusts it. |
| Provenance embellished into a run that never happened | Mirror the evidence at the precision you hold it. "Reading the code" is a complete answer. |
| A venue invented around real evidence ("I hit this in the browser" from a bare "verified") | Keep the venue unnamed unless you were told it. |
| Every finding posted at equal weight | Triage. Drop or fold the marginal ones. |
| Prescriptive code block for a one-word change | Say it in words. |
| Comment drifts into an unrelated rule | Delete the tangent. |
| Anchor line not in the diff, post fails | Check hunk ranges first. |

## Related skills

`review` produces the findings; this skill turns them into comments. `simplified-technical` applies when the repo asks for plain controlled language, and overrides the tone guidance here.
