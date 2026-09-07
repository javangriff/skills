# Issue tracker

Issues for this repo live in **GitLab Issues** on `HOST/GROUP/PROJECT`.

## Ticket key pattern

Issue numbers appear as `#123` in commits and MR descriptions, and as `123-short-description` in branch names (GitLab's default when creating a branch from an issue). Merge requests are `!45`.

```
Branch regex:   (?:^|/)(\d+)-
Message regex:  #(\d+)
```

## How to fetch an issue

```bash
glab issue view <number> --comments
```

Requires the `glab` CLI, authenticated (`glab auth status`). For a self-hosted instance, set `GITLAB_HOST`.

## Where acceptance criteria appear

In the issue description, under an "Acceptance criteria" heading or as a task-list checklist. Comments may amend them; read comments too.

## Merge requests as a reference surface

An MR description may carry its own checklist that refines the issue. When an MR is under review, read its description as well as the linked issue. Links appear as `Closes #123` or `Related to #123`.
