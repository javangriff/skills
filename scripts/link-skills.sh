#!/usr/bin/env bash
set -euo pipefail

# Symlinks every skill in this repo into the local harness skill directories, so
# a `git pull` keeps installed skills current and edits made mid-session are
# edits to the repo. Re-run after adding, removing, or renaming a skill.
#
# Skills come from two trees, and may sit one bucket folder deep:
#   skills/       published in this repo
#   skills-local/ gitignored, never leaves this machine
#
# A skill that ships an agents/claude.md is also linked into ~/.claude/agents as
# a Claude Code subagent of the same name.
#
# For any harness not listed in DESTS, use: npx skills@latest add javangriff/skills

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DESTS=("$HOME/.claude/skills" "$HOME/.codex/skills")

names=()
srcs=()
for tree in "$REPO/skills" "$REPO/skills-local"; do
  [ -d "$tree" ] || continue
  while IFS= read -r -d '' skill_md; do
    src="$(dirname "$skill_md")"
    name="$(basename "$src")"
    for existing in "${names[@]-}"; do
      if [ "$existing" = "$name" ]; then
        echo "error: two skills are both named '$name'; names must be unique across the tree." >&2
        exit 1
      fi
    done
    names+=("$name")
    srcs+=("$src")
  done < <(find "$tree" -name SKILL.md -print0)
done

# Remove symlinks in $dir that point into this repo but whose target is gone
# (a skill was renamed or removed since the last run).
prune_dangling() {
  local dir="$1" link resolved
  [ -d "$dir" ] || return 0
  for link in "$dir"/*; do
    [ -L "$link" ] || continue
    resolved="$(readlink "$link")"
    case "$resolved" in
      "$REPO"/*) [ -e "$link" ] || { rm "$link"; echo "pruned $link"; } ;;
    esac
  done
}

if [ ${#names[@]} -eq 0 ]; then
  echo "error: no SKILL.md found under $REPO/skills or $REPO/skills-local" >&2
  exit 1
fi

for DEST in "${DESTS[@]}"; do
  # A $DEST that is itself a symlink into this repo would make us write the
  # per-skill symlinks back into our own tree. Bail out rather than pollute it.
  if [ -L "$DEST" ]; then
    resolved="$(readlink "$DEST")"
    case "$resolved" in
      "$REPO"|"$REPO"/*)
        echo "error: $DEST is a symlink into this repo ($resolved)." >&2
        echo "Remove it (rm \"$DEST\") and re-run; it will be recreated as a real directory." >&2
        exit 1
        ;;
    esac
  fi

  mkdir -p "$DEST"
  prune_dangling "$DEST"

  for i in "${!names[@]}"; do
    name="${names[$i]}"
    src="${srcs[$i]}"
    target="$DEST/$name"

    # Only ever clobber a real directory that this repo is the source of.
    if [ -e "$target" ] && [ ! -L "$target" ]; then
      if [ ! -f "$target/SKILL.md" ]; then
        echo "error: $target exists and is not a skill directory; refusing to replace it." >&2
        exit 1
      fi
      rm -rf "$target"
    fi

    ln -sfn "$src" "$target"
    echo "linked $name -> $src ($DEST)"
  done
done

# Claude Code subagents: one per skill that ships agents/claude.md.
AGENTS_DEST="$HOME/.claude/agents"
mkdir -p "$AGENTS_DEST"
prune_dangling "$AGENTS_DEST"
for i in "${!names[@]}"; do
  agent="${srcs[$i]}/agents/claude.md"
  [ -f "$agent" ] || continue
  target="$AGENTS_DEST/${names[$i]}.md"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "error: $target exists and is not a symlink; move it aside and re-run." >&2
    exit 1
  fi
  ln -sfn "$agent" "$target"
  echo "linked agent ${names[$i]} -> $agent"
done
