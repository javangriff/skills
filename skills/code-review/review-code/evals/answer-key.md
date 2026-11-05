# Answer key: document collaboration cache fixture

Files are in `fixtures/`. Line numbers refer to the files as committed. Every bug below was
reproduced against the code with a throwaway script driving only the public API.

## Planted bugs

### 1. Per-entry run stamp keyed by a path that `moveEntries` changes

- `documentStore.ts:188` and `:193`: `checkEntry` begins its stamp under `path` and checks
  `isCurrent(path, token)`, but it publishes onto the `entry` object it captured at `:186`.
- `documentStore.ts:270-306`: `moveEntries` relocates entries (`:299`) and invalidates only
  `documentRuns` (`:305`). It never touches `entryRuns`.
- Trigger: entries at `sections.0.body` and `sections.1.body` (call the second one E, value `''`).
  `checkEntry('sections.1.body')` (run A, pending) → `moveEntries('sections', [1, 0])` (E is now at
  `sections.0.body`) → `setValue('sections.0.body', 'fixed')` (run B, stamped under
  `sections.0.body`) → B settles, E shows `[]` → A settles.
- What goes wrong: A's stamp key `sections.1.body` was never re-begun, so A is still "current" and
  publishes the issues for E's old value onto E, overwriting B's newer result. E shows `["empty"]`
  while its value is `'fixed'`.

### 2. Publish guard blind to writes that skip the stamp

- `documentStore.ts:168` returns before the invalidation at `:169-172`, so
  `setValue(path, v, { check: false })` bumps neither stamp.
- `entry.ts:59-65`: `Entry.set` (public on the object `getEntry` returns) changes the value without
  touching any stamp.
- Guards that miss these writes: `documentStore.ts:193` (`checkEntry`) and `:215` (`checkAll`).
- Trigger: `checkEntry('sections.0.body')` while the value is `''` → `setValue('sections.0.body',
  'ok', { check: false })` (or `getEntry('sections.0.body').set('ok')`) → the check settles.
- What goes wrong: the stamp is still current, so the old snapshot's issues are published onto the
  new value (`value = 'ok'`, issues `["empty"]`). The same applies to `checkAll`: its result is
  published onto every entry even though one changed mid-flight. A related consequence of the
  local-only exemption at `:169`: a plain `setValue` on a local-only path during `checkAll` doesn't
  invalidate the document run either, so `checkAll` can overwrite the newer `checkEntry` result for
  that entry.

### 3. One-way entry → document mirror; replacing a parent leaves child entries stale

- `documentStore.ts:142-145` subscribes each entry to `writeThrough` (`:359-363`), which copies the
  entry into `doc`. Nothing copies `doc` back into entries.
- `documentStore.ts:163-167`: `setValue` writes through the entry at that exact path, or straight
  into `doc`. It never refreshes entries registered beneath the path.
- Trigger: `getEntry('projects.alpha.title')` (value `'old'`) →
  `setValue('projects.alpha', { title: 'new' })`.
- What goes wrong: `doc.projects.alpha.title` is `'new'`, but the registered entry still reports
  `'old'`. The next edit through that entry (or any re-render showing it) is based on the stale
  value. `checkEntry`/`checkAll` check `'new'` while the UI shows `'old'`.

### 4. Deferred removal re-checks only "still unregistered", which `restore` can undo

- `documentStore.ts:321-324`: `release(path, { keepValue: false })` queues a microtask whose only
  guard is `!this.index.has(path)`.
- `documentStore.ts:331-341`: `restore` swaps in a new `doc` but does not register the released
  path again, and doesn't cancel the queued removal.
- Trigger: `getEntry('notes')` → `const saved = snapshot()` → `release('notes', { keepValue: false })`
  → `restore(saved)` in the same tick.
- What goes wrong: the microtask runs against the restored `doc`, finds `notes` unregistered, and
  deletes it. The restored document lacks `notes` (`{}`), even though `restore` was the later intent.

### 5. `checkEntry` and `checkAll` route parent/child issues differently

- `documentStore.ts:192` + `issueRouting.ts:91-101` (`routeToDeclared`): `checkEntry` sends each
  issue to the nearest *declared* path.
- `documentStore.ts:218` + `issueRouting.ts:70-85` (`routeToRegistered`): `checkAll` sends each issue
  to the nearest *registered* ancestor.
- Trigger: `declared: ['projects.alpha', 'projects.alpha.title']`, only `projects.alpha` registered,
  server reports `{ path: ['projects','alpha','title'] }`. Call `checkEntry('projects.alpha')`, then
  `checkAll()`.
- What goes wrong: `checkEntry` routes the issue to `projects.alpha.title` (declared, unregistered).
  It returns `[]` and publishes the parent as clean. `checkAll` puts the same issue on
  `projects.alpha`. One entry gets two different verdicts depending on which check ran.

### 6. `checkAll` builds the accepted payload from live data after the await

- `documentStore.ts:230`: `local: collect(this.doc)` reads the live document after the `await` at
  `:214`. Compare `document: omitPaths(sent, ...)`, which correctly uses the checked snapshot.
- `documentStore.ts:169-172`: editing a local-only path doesn't invalidate the document run, so the
  stale guard at `:215` doesn't catch it.
- Trigger: `localOnly: ['draft']`, `draft = 'v1'`. `checkAll()` (pending) →
  `setValue('draft', 'v2-unchecked')` → server resolves `[]`.
- What goes wrong: the result is `valid: true` with `accepted.local.draft === 'v2-unchecked'`, but
  the server checked `draft: 'v1'`. The caller persists or acts on a value nothing checked. A custom
  `collect` gets the same live data.

### 7. Prototype keys in plain-object maps

- `entryIndex.ts:13` (`byPath: Record<string, Entry> = {}`), `:18` (`return this.byPath[path]`),
  `:23` (`path in this.byPath`).
- `issueRouting.ts:25` (`patterns: Record<string, true> = {}`) and `:53`
  (`generalise(segments) in this.patterns`).
- Trigger: `getEntry('toString')` returns `Object.prototype.toString` (a function, typed as
  `Entry`). Calling `.set(...)` on it throws. `hasEntry('constructor')` is true on an empty store.
  With `declared: ['projects.*.title']`, `isDeclared('constructor')` is `true`, so
  `setValue('constructor', x)` passes the declared-shape guard.
- Knock-on effects: `register('valueOf')` throws "already registered". In `checkAll`, an issue at
  `['toString']` is routed to "registered" `toString` (`:218`), but the publish loop (`:219`) only
  walks own keys, so the issue is neither shown nor retained. `helpers.getIn` correctly uses
  `Object.hasOwn`, and `splitPath` only blocks `__proto__`.

### 8. Lazy entry creation hides a retained issue

- `documentStore.ts:150-152`: `getEntry` creates an entry with empty issues (`entry.ts:27`).
  `register` (`:138-147`) never consults `this.retained`.
- `documentStore.ts:241-245` (`issuesFor`) and `:248-258` (`allIssues`): a registered entry takes
  precedence over the retained result (`allIssues` deletes the retained key when the entry is clean).
- Trigger: `checkAll()` reports `projects.beta.title: required` with nothing registered, so
  `issuesFor('projects.beta.title')` is `["required"]`. Then `getEntry('projects.beta.title')`.
- What goes wrong: `issuesFor` now returns `[]` and `isClean()` returns `true`, but nothing fixed the
  value or re-checked it. Merely looking at the path hides the problem.

### 9. Two independent writers of `entry.syncing`

- `entry.ts:101` and `:108`: `Entry.check` sets `syncing = true`, then in its `finally` sets it to
  `this.localChecks > 0`. That count only covers local checks.
- `syncTracker.ts:20` and `:47`: `SyncTracker` sets `syncing = true` and clears it when its own
  count reaches zero. That count only covers store checks (`documentStore.ts:189`, `:212`).
- Trigger: `checkAll()` (pending) → `await getEntry('title').check(async () => [])`. At this point
  `syncing` is `false` while `checkAll` is still in flight. The reverse also fails: start a slow
  `entry.check`, then let `checkAll` settle; the tracker clears `syncing` while the local check runs.
- What goes wrong: the spinner or save-blocking UI driven by `syncing` reports idle while a check is
  still outstanding.

## Near-misses (correct code that looks suspicious)

1. **`Entry.check` stale-result guard (`entry.ts:97-110`).** It captures `revision` and the value
   before awaiting, and publishes only if `this.revision === revision`. Every value change goes
   through `Entry.set`, which bumps `revision` (`entry.ts:63`), including the store's writes and
   `restore`. Moves don't change the value, so an entry-local result can't land on a value it didn't
   check. Its local counter correctly handles overlapping *local* checks. Only the interaction with
   `SyncTracker` (bug 9) is wrong.
2. **Deferred stamp compaction in `RunStamps.retire` (`runStamps.ts:41-61`).** Unlike bug 4, this is
   safe for three reasons:
   - `retire` supersedes in-flight runs synchronously.
   - Tokens come from one counter and never repeat.
   - The sweep deletes a key only if it still holds the exact token `retire` wrote
     (`current.get(key) === token`).

   A key begun again before the sweep keeps its new stamp. A key deleted early only makes stale
   tokens non-current, which is the intended outcome. `clear()` in `restore` (`documentStore.ts:333`)
   is safe for the same reasons.
3. **`checkAll` after `moveEntries`.** `checkAll` routes issues by path after the await, which would
   misroute issues for moved entries. But `moveEntries` invalidates the document run
   (`documentStore.ts:305`), so such a run returns `stale: true` without publishing.
4. **`writeThrough` resolves the path at write time (`documentStore.ts:359-363`).** It looks up
   `index.pathOf(entry)` on each write rather than capturing the registration path, so moved
   entries mirror into their new location. Released entries are detached and also guarded by
   `path === undefined`.
5. **`EntryIndex.relocate` (`entryIndex.ts:83-103`).** It detaches all sources before writing
   destinations, so swaps and rotations don't collide.
6. **`restore` supersedes per-entry runs (`documentStore.ts:333`).** This contrasts with
   `moveEntries`, which doesn't (bug 1). Here the per-entry invalidation is present and correct.
