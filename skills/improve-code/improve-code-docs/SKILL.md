---
name: improve-code-docs
description: Audits and improves in-code documentation in TypeScript, JavaScript, and Vue files, adding JSDoc to functions that lack it, fixing JSDoc that has drifted from the signature, and cutting comments that restate the code. Use when the user wants to document functions, add or fix JSDoc or doc comments, "clean up the comments", make comments less verbose, or do a documentation pass before pushing a PR, including vague asks such as a file that "needs better comments", "isn't documented", or "has too many useless comments". Defaults to the files a branch or PR changed when no path is given.
---

# Improve code documentation

The goal is code that documents itself with **just enough** prose: every function carries a JSDoc block that tells a reader what it does and why, and inline comments earn their place by explaining intent the code can't. Two failure modes to fix — **missing** docs (undocumented functions) and **noisy** docs (comments that restate the code, or JSDoc that's drifted out of sync). The end state reads cleaner *and* shorter than what you started with.

This is a judgment task, not a mechanical sweep. The rules below tell you what "good" looks like; apply them with taste rather than pattern-matching.

## Workflow

### 1. Scope the input

Default to the files the current change touches — that's almost always what someone means by "do a doc pass". Use an explicit path/dir if the user names one.

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git diff --name-only "$base"...HEAD           # everything this branch changed
git diff --name-only HEAD                     # staged and unstaged work
git ls-files --others --exclude-standard      # new files
```

Filter to source files (`*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.vue`). Skip generated files (`*.generated.*`, `dist/`), config, and test files unless asked — tests are usually self-describing through their `describe`/`test` names, and over-documenting them adds noise.

When working from a diff, **focus on what the change introduced or touched**. Don't document every pre-existing undocumented function in a 600-line legacy file the PR barely grazed — that buries the actual change in unrelated churn. Mention you've scoped it that way; offer to do the whole file if they want.

### 2. Match the project's conventions first

This skill is project-agnostic. Before writing a single comment, read the file and a neighbour or two to learn the house style, then conform to it:

- **Formatting** — semicolons or not, quote style, line width. Defer to the project's Prettier/ESLint config and the surrounding code. Never impose a style the repo doesn't already use.
- **Existing JSDoc shape** — do they write one-line `/** ... */` blocks, or multi-line with tags? Do TS files include `{type}` in tags or rely on the type system? Follow what's there.
- **Language of comments** — terse and technical, or more narrative? Stay consistent within the file.

The fastest way to make documentation feel foreign is to format it differently from everything around it.

### 3. Know which job you're being asked to do

Two requests pull in opposite directions, and conflating them is the most common way a doc pass goes wrong:

- **"Document this" / "add JSDoc" / "these aren't documented"** — the deliverable is a proper JSDoc block per function: summary + `@param`/`@returns`. Tags are expected here.
- **"Clean up the comments" / "it's too verbose" / "trim the noise"** — the deliverable is *less* text, not more. The win is a single crisp summary line per function plus the removal of noise. **Don't bolt a full `@param`/`@returns` block onto a decluttering pass** — that just trades line-by-line noise for tag-shaped noise. Add a tag only when it captures something genuinely non-obvious (a thrown error, a unit, a foot-gun). A strong one-line summary is the whole point.

When it's ambiguous, follow what the file needs: undocumented functions want documenting; a file buried in noise wants decluttering.

### 4. Writing the JSDoc (when documenting)

Every function, method, and exported composable being documented should have a JSDoc block. The summary is the part that matters most — lead with a verb, say what the function does and (when not obvious) *why* it exists.

Include `@param` for each parameter and `@returns` for a non-void return, because they capture intent the signature alone doesn't — units, valid ranges, what `null` means, what's thrown. Keep each line terse **but not cryptic**: a `@param` should say what the argument is *for*, not just echo its name. `@param str The text to truncate` earns its place; `@param str Source string.` is so thin it adds nothing back. Cut filler, not meaning.

Keep the whole block tight — a summary plus its tags. Resist multi-paragraph prose, `@example` dumps, or `@typeParam` restatements unless the behaviour genuinely can't be grasped without them. A rough check: if the comment block is longer than the function it documents, you've probably over-explained.

**In TypeScript, never put `{type}` in a tag** — the type annotation already carries it, and a duplicated type is one more thing to drift out of sync. In plain `.js` files where there's no type system, including `{type}` is appropriate. Follow the file's existing pattern.

If a function is genuinely trivial and self-evident from its name and signature (`const isEmpty = (s: string) => s.length === 0`), a one-line summary is enough — don't manufacture `@param`/`@returns` ceremony that says nothing. Judgment over ritual.

**Good** (terse, full tags, no redundant types — TS):

```ts
/**
 * Resolves a dot-notation i18n key to its translated string.
 * @param key Translation key, e.g. 'services.steps.review'
 * @param vars Interpolation values keyed by placeholder name
 * @returns The translation, or `key` itself when no entry exists
 */
function translate(key: string, vars?: Record<string, string>): string
```

**Bad** (verbose, restates types, filler prose):

```ts
/**
 * This is a function that will take in a key and some variables and then
 * it is going to resolve the translation for you and return it back.
 * @param {string} key - the key that is a string
 * @param {object} vars - the vars object
 * @returns {string} returns a string
 */
```

The bad version is longer, repeats the types TypeScript already knows, and its summary says nothing a reader couldn't get from the name. The good one adds real information (the key format, the fallback behaviour) in fewer words.

### 5. Inline comments — trim and delete freely

On a decluttering pass this section *is* the work: a crisp summary line per function plus the cleanup below, and nothing more.

Inline comments should explain **why**, not narrate **what**. The code already says what it does; a comment that restates it is pure noise that rots the moment the code changes. Be willing to delete.

**Delete** comments that merely echo the next line:

```ts
// increment the counter
counter++                       // ← delete; the code is the comment

// set loading to true
isLoading.value = true          // ← delete

// loop over each user
for (const user of users) {     // ← delete
```

**Keep, but tighten** comments that explain intent, a workaround, a non-obvious constraint, or a business rule — these are the comments worth their weight. Shorten the prose; keep the substance:

```ts
// Before: "We need to debounce this function call here because otherwise the
// API endpoint gets hammered every single time the user presses a key which
// is bad for performance and could get us rate limited by the backend."
// After:
// Debounce keystrokes — avoids hammering the search API / hitting rate limits.

// Keep as-is — explains a non-obvious quirk the code can't:
// Safari fires `resize` before layout settles; defer a frame so offsetWidth is correct.
```

The test for whether a comment stays: **if you deleted it, would a competent reader lose information they couldn't recover from the code?** If no, delete it. If yes, keep it — but make it as short as it can be while still carrying that information.

Don't delete comment-flags that carry signal: `// TODO`, `// FIXME`, `// HACK`, `eslint-disable` justifications, license headers, and `@ts-expect-error` explanations all stay.

### 6. Vue single-file components

For `.vue` files, work inside `<script setup>` (or the script block):

- **Document functions and composables** in the script — event handlers, computed factories, helpers — same rules as above.
- **Leave `defineProps`/`defineEmits` alone** unless a prop's purpose is genuinely cryptic; prop names + types are usually self-documenting, and a comment per prop is the kind of noise this skill exists to remove. Add a short comment only for the rare prop with non-obvious semantics.
- **Don't add `<style>` blocks or template comments** as part of a doc pass — that's out of scope.

### 7. Verify

Documentation edits are low-risk, but a `@param` whose name no longer matches the signature, or a stray syntax slip in a block comment, can trip lint or type checks. After editing, run the repo's own typecheck and lint commands (`package.json` scripts, an Nx or Turbo target, or `npx tsc --noEmit` and `npx eslint <files>` when there is nothing else) on the affected files, and report the results honestly.

If you changed JSDoc `@param` names, double-check they still match the parameter names — that's the most common way a doc pass breaks lint.
