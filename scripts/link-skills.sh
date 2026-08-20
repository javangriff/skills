#!/usr/bin/env bash
set -euo pipefail

# Symlinks every skill in this repo into the local harness skill directories, so
# a `git pull` keeps installed skills current and edits made mid-session are
# edits to the repo. Re-run after adding, removing, or renaming a skill.
#
# Skills come from two trees:
#   skills/       published in this repo
#   skills-local/ gitignored, never leaves this machine
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
    names+=("$(basename "$src")")
    srcs+=("$src")
  done < <(find "$tree" -name SKILL.md -print0)
done

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
