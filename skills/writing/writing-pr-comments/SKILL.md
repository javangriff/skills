---
name: writing-pr-comments
description: Writes pull request comments an author can act on (the claim, the consequence, how it is known, a suggested fix, and an explicit scope signal) and replies to reviewer feedback. Use when writing or posting comments on a pull request or merge request, whether inline on a line, as a review summary, or as a reply to someone else's comment. Triggers include "post these as PR comments", "comment on the PR", "leave a review", "add a comment to the PR", "--comment", turning review findings into comments, and replying to reviewer feedback. Also used by the review skill when it is asked to post its findings rather than print them.
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

A finding that arrives carrying a `[convention change]` or `[out of scope]` label from the `staying-in-scope` skill has already been triaged: it is real, and it does not belong in this PR. Do not post it inline as if it were a change request. Put it in the review summary body instead, with its evidence, and end it on a follow-up signal:

| Label | How to post it |
|---|---|
| `[convention change]` | Summary body. Name the prevailing pattern and where it is, then say the real change is repo-wide: "the other query modules key this inline, so changing just this one would split it — worth a separate ticket if we want to move the lot." |
| `[out of scope]` | Summary body. Say plainly the PR did not cause it: "this predates the branch, flagging it rather than asking you to fix it here." |

Never let a labelled finding read as blocking. The author did not cause it, or cannot fix it alone, and a comment that implies otherwise costs them a round trip to say so.

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

## Replying as the author

A reply is not a finding, so the shape above inverts. The reviewer has already made the claim; your job is to say where you stand and what happens next. Answer every comment, including the nits, because the reviewer cannot tell silence from disagreement.

Write a reply as: **your position, the reason it holds, and what you have done or will do.** Keep the tone rules and the provenance rule exactly as they are above; they matter more here, not less.

The provenance rule binds the author too, in both directions. Describe a check at the precision you ran it: if you satisfied yourself by reading the code, say that, and do not promote it into a test or a run that exists only in the reply. Describe a change in the tense it is in: a fix you have written is done, a fix you intend is an offer, and the two must not be mixed. Offering the cheap proof you have not yet run ("happy to add a test that mutates the prop") is honest and often the most useful thing in the thread; claiming it already passes is not.

End on a commitment, which is the author-side mirror of a scope signal. Say which of these is true:

| Commitment | Use when |
|---|---|
| "done in this PR" | You made the change. Say so plainly and stop. |
| "raising a follow-up, linked here" | Valid, but not this PR's job. Link the ticket in the reply. |
| "leaving as is unless you disagree" | You think the comment does not hold. |
| "your call, happy either way" | You genuinely do not mind and want the thread closed. |

**When you disagree,** give the reviewer the reading you have and the room to correct you. Show the specific thing they may not have seen, say what you checked and how, and offer the cheap proof if one exists. "I think this one is safe, though tell me if I have misread it" opens a door that "this is incorrect" closes. Never make it a contest of who is right; the code either behaves that way or it does not.

**When you agree but cannot do it here,** the difficulty is sounding like a constraint rather than a brush-off. Name the cost concretely, so the reviewer can weigh it: what the real fix touches, roughly what it takes, and why it does not belong in this change. Then offer the smaller thing you can do now, and say plainly that it is containment rather than a fix. Offer to take it out of the PR if they would rather block on the real one.

**When you agree,** one line. "Good catch, dropped in this PR." Padding an easy agreement wastes the reviewer's attention for the threads that need it.

## Posting mechanics

- An inline comment must anchor to a line **present in the diff**. Parse the diff's hunk headers for addressable right-side lines before you post; a comment on an unchanged line is rejected.
- When the line you mean is not in the diff, anchor on the nearest changed line that caused the problem and name the real line in the body.
- Post as a plain comment. Reach for "request changes" or "approve" only when the user asks for a verdict.
- A reply anchors to the thread it answers, so the diff-line rules above do not apply to it.
- Post the batch as one review rather than many single comments, then read the result back to confirm each landed on the line you intended.

## Common mistakes

| Mistake | Fix |
|---|---|
| No scope signal, author cannot triage | Add one. It is a required part, not a flourish. |
| Observed and read-from-code findings look identical | Say which. It changes how much the author trusts it. |
| Provenance embellished into a run that never happened | Mirror the evidence at the precision you hold it. "Reading the code" is a complete answer. |
| A venue invented around real evidence ("I hit this in the browser" from a bare "verified") | Keep the venue unnamed unless you were told it. |
| A reply claims a check or a change that has not happened ("there is a test covering it", "I have put it in this PR") | Say what you did at its real precision, and offer the rest as an offer. |
| Every finding posted at equal weight | Triage. Drop or fold the marginal ones. |
| Prescriptive code block for a one-word change | Say it in words. |
| Comment drifts into an unrelated rule | Delete the tangent. |
| Anchor line not in the diff, post fails | Check hunk ranges first. |

## Related skills

`review` produces the findings; this skill turns them into comments. `simplified-technical` applies when the repo asks for plain controlled language, and overrides the tone guidance here.
