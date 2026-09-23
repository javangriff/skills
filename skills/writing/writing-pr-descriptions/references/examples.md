# Examples

One real PR, written two ways. The change: a one-line fix in a schema library, where a table kept references to the caller's namespace segment objects, plus three expected-failure tests switched to normal tests.

## Bad: a catalogue of the change

```markdown
## Summary

- Snapshot each authored relation namespace segment by value.
- Prevent later caller mutation from retargeting table or reference relation intent.
- Enable the three namespace-segment regression tests.

## Verification

- Focused schema action tests: 30 passed.
- Unit suite: 748 passed; 3 pre-existing expected failures.
- Coverage: 91.57% statements, 84.61% branches, 97.07% functions, 92.96% lines.
- Typecheck, lint, format check, build, and diff check passed.
- PostgreSQL integration suite unavailable because POSTGRESQL_URL is not configured; its 15 tests were skipped by the setup guard.

Closes #192
```

What is wrong with it:

- Each bullet is a line of the diff in other words. None says what goes wrong for a caller, or why the old code let it happen.
- "Retargeting relation intent" is the issue's jargon. A reviewer who has not read the issue cannot picture the bug.
- The whole Verification section is CI output, or tests the diff already shows.
- The headings are scaffolding on a body with nothing to organise.

## Good: the intent, shown

````markdown
`table()` copied the namespace array but kept the caller's segment objects. If the caller changed a segment's `spelling` after construction, the stored relation changed with it. The table, and any reference that targets it, then pointed at a schema nobody authored.

```ts
const segment = { role: 'schema' as const, spelling: 'audit' }
const Events = table({ name: 'events', primaryKey: 'id', namespace: [segment] })

segment.spelling = 'other'
// before: stored namespace is [{ role: 'schema', spelling: 'other' }]
// after:  stored namespace stays [{ role: 'schema', spelling: 'audit' }]
```

`createRelationInput` now builds a new object for each segment. Both fields are strings, so copying one level is enough. `defineTable` builds its metadata through `table()`, and `reference()` reads its target relation from that stored table metadata, so references built from a raw schema and from a table handle both get the copy.

Closes #192
````

Why it works:

- The first sentence names the cause (the array was copied, not its contents), which is the thing the reviewer needs to judge the fix.
- The code block makes the bug something you can see in four lines, with no knowledge of the issue.
- "Both fields are strings" answers the obvious question, "should this be a deep clone?", before the reviewer asks it.
- The last sentence says why one change is enough for every path. That explains the fix's completeness, not the diff's size.
- It does not mention the enabled tests or the CI results. The reviewer sees both without help.
