---
name: setup-javan-skills
description: Configure a repository for these skills by recording where its issues are tracked and how to fetch them. Run once per repo before using the review skills.
disable-model-invocation: true
---

# Setup

Write the per-repo configuration that the review skills read: where issues live, how a ticket key looks, and how to fetch one. The output is an `issue-tracker.md`, written either into the repo or into the user's config directory.

The config can live in two places. Readers check them in this order:

1. **Repo level:** `docs/agents/issue-tracker.md`, committed and shared with everyone who works on the repo, plus a short pointer in the repo's agent instructions file.
2. **User level:** `$(config_dir)/issue-tracker.md`, where `config_dir` is derived from the repo's `origin` URL so every clone and worktree of the same repo finds it. Nothing is written into the repo.

```bash
config_dir() {
  local base="${XDG_CONFIG_HOME:-$HOME/.config}/javan-skills" url slug
  url=$(git remote get-url origin 2>/dev/null)
  if [ -n "$url" ]; then
    slug=$(printf '%s' "$url" | sed -E 's#^[a-z]+://##; s#^[^@/]+@##; s#:[0-9]+/#/#; s#:#/#; s#\.git$##; s#/+$##')
  else
    slug="local$(git rev-parse --show-toplevel)"
  fi
  printf '%s/%s\n' "$base" "$slug"
}
```

For `git@github.com:owner/repo.git` or `https://github.com/owner/repo.git` this gives `~/.config/javan-skills/github.com/owner/repo`. A repo with no `origin` is keyed by its absolute path.

This is a prompt-driven skill, not a script. Explore, present what you found, confirm with the user, then write.

## 1. Explore

Read what exists before assuming anything:

- `git remote -v`: is the forge GitHub, GitLab, or something else?
- `CLAUDE.md` and `AGENTS.md` at the repo root: does either exist? Does either already have an `## Agent skills` section?
- `docs/agents/issue-tracker.md` and `$(config_dir)/issue-tracker.md`: has this skill run before, and at which level?
- Branch names and recent commit subjects (`git log --oneline -20`, `git branch -r | head -30`): do they carry a ticket pattern such as `ABC-123` or `#123`? That reveals the tracker even when the remote does not.

## 2. Propose

Lead with the recommended answer so the user can accept it in a word.

- A GitHub remote with `#123` references in history → **GitHub Issues**.
- A GitLab remote → **GitLab Issues**.
- Keys like `ABC-123` in branches or commits → **Jira**. Propose the project keys you saw.
- Otherwise ask, offering: GitHub, GitLab, Jira, or **none** (the acceptance-criteria pass will then rely on spec files under `docs/` or `specs/`).

For Jira, collect three things: the site URL, the project keys, and the fetch method. Ask whether the agent harness exposes a Jira tool (an Atlassian integration or MCP server). If it does, record that as the preferred method. Record the REST fallback either way, with the token expected in `JIRA_EMAIL` and `JIRA_API_TOKEN`.

For GitHub and GitLab, confirm the CLI is installed and authenticated (`gh auth status`, `glab auth status`) and say so if it is not.

Then ask where the config should live:

> Where should this live? (recommended: **repo level**)
>
> - **Repo level**: `docs/agents/issue-tracker.md` plus a pointer in the agent instructions file. Committed, so everyone's agents share it.
> - **User level**: `~/.config/javan-skills/<host>/<owner>/<repo>/issue-tracker.md`. Nothing is written into the repo.

If exploration found an existing config at one level, propose that level.

## 3. Confirm

Show the user a draft before writing:

- For repo level only: the `## Agent skills` block for whichever of `CLAUDE.md` or `AGENTS.md` will be edited.
- The full contents of `issue-tracker.md`, built from the matching template in this skill's directory with the placeholders (`OWNER/REPO`, `SITE`, `KEY1`, `KEY2`) filled in:
  - `issue-tracker-github.md`
  - `issue-tracker-gitlab.md`
  - `issue-tracker-jira.md`

For "none", write no `issue-tracker.md`; at repo level the block says so.

Let the user edit before you write.

## 4. Write

**User level:** `mkdir -p "$(config_dir)"` and write `issue-tracker.md` there. Do not touch the repo. Skip the rest of this step.

**Repo level:** pick the instructions file:

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask which one to create. Do not pick for them.

Never create one when the other already exists. If an `## Agent skills` block already exists, update it in place rather than appending a duplicate, and leave the surrounding sections untouched.

The block:

```markdown
## Agent skills

### Issue tracker

[One line: where issues are tracked and the key pattern.] See `docs/agents/issue-tracker.md`.
```

Then write `docs/agents/issue-tracker.md`, creating the directory if needed.

## 5. Done

Tell the user where the file was written, which skills now read it (`review` and `review-acceptance-criteria`), and that they can edit it directly later. Re-running this skill is only needed to switch trackers or move the config between levels. If both levels end up populated, the repo-level file wins.
