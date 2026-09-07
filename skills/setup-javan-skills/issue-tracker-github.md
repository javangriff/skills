# Issue tracker

Issues for this repo live in **GitHub Issues** on `OWNER/REPO`.

## Ticket key pattern

Issue numbers appear as `#123` in commits and PR bodies, and as `123-short-description` or `issue-123` in branch names.

```
Branch regex:   (?:^|/)(?:issue-)?(\d+)(?:-|$)
Message regex:  (?:#|GH-)(\d+)
```

## How to fetch an issue

```bash
gh issue view <number> --json title,body,comments,labels,state
```

Requires the `gh` CLI, authenticated (`gh auth status`).

## Where acceptance criteria appear

In the issue body, under an "Acceptance criteria" heading or as a task-list checklist. Comments may amend them; read comments too.

## Pull requests as a reference surface

A PR body may carry its own checklist that refines the issue. When a PR is under review, read its body as well as the linked issue. Links appear as `Closes #123`, `Fixes #123`, or `Resolves #123`.
