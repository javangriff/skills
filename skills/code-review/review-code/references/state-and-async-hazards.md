# State and async hazards

Bugs that no single hunk shows. Each lives in the gap between two pieces of code: a write and the
check that should have seen it, a queued callback and the call that changed its premise, two copies
of one value. Reading hunk by hunk misses them, so this method starts from an inventory instead.

## Step A: take the inventory

Across every changed file, list:

- **Await points.** Each `await`, `.then`, or callback that resumes after other code can run.
- **Publish guards.** Each check that decides whether a result resumed after an await may land:
  a run id, a token, a "latest" flag, a comparison.
- **Deferred work.** Each `nextTick`, `setTimeout`, `queueMicrotask`, debounce, or queue flushed
  later.
- **Shared mutable state.** Each flag, ref, field, or map written from more than one place.
- **Copies.** Each value held in two places that must agree: a cache, a store mirroring a
  model, a denormalised field, a sync between two objects.
- **Keyed lookups.** Each plain object used as a dictionary, each key built from a path, id, or
  index that can move, and each lookup that matches a key against its parent or children.
- **Lazy creation.** Each thing created on first access: a registration, a cache entry, a subscriber.

## Step B: walk each item through its checks

| Item | Ask | Bug when |
| --- | --- | --- |
| Publish guard | List every way the guarded input can change: the public setter, a direct write to a returned handle, a bulk setter, a reset, a remap or move. Does each one invalidate the guard? | Any path changes the input and leaves the guard passing, so a result about the old input lands on the new one. |
| Publish guard keyed by a path, index, or id | What happens to a run in flight when that key moves? Pair it with a newer run started at the new key that settles first. | The old run still passes its guard and overwrites the newer verdict, or publishes a verdict judged for the old slot. Holding the same entity reference does not make it clean: the result was computed from the old slot's neighbours and inputs. |
| Await point | Which state is read after it? Count reads inside callbacks the result is handed to (a collector, formatter, or mapper passed in as an argument), not only reads in the function's own body. Was each captured before the await? | Code reads live state after the await and reports it as what was checked. |
| Deferred work | Name the state the callback acts on (what it writes or deletes) and the condition it re-checks. Then pair it with every public operation, not only the ones that schedule it: reset, bulk set, clear, register, unregister. | An operation changes the state the callback acts on without changing what it re-checks, so the callback undoes it. A re-check covers only the operations that change the checked condition, so it never makes the item clean by itself. |
| Shared mutable state | List every writer. Do two independent writers each set and clear it? | One writer clears it while the other still needs it set. A boolean with two owners needs a count or one owner. |
| Copies | List every write path to each side. A write at a parent path is a write to every path below it, so count those as writes to each child's copy. Is each synced to the other? | A write to one side, often a parent object or array replaced whole, leaves the other side stale. |
| Plain-object dictionary | Can a key come from outside the code: a user, a schema, a path? | `map[key]` returns an `Object.prototype` member for `toString`, `constructor`, or `__proto__`. Use `Object.hasOwn`, a `Map`, or a null prototype. |
| Hierarchical key match | When asked about a parent, are its descendants' entries counted? Is that the same rule everywhere this match is made? | A parent reports clean while a child fails, or one code path counts descendants and another does not. |
| Lazy creation | What did the system report before the thing existed, and after? | Creating it hides, resets, or duplicates something no one changed. |

## Step C: interleave the public operations

List the public operations. For each one that awaits, pair it with every other operation that can
run while it waits, and write out the sequence:

> A starts → B runs → A resumes. What does A publish, and is it still true?

Do the same for deferred work: schedule → B runs → the callback fires. Every sequence that publishes
something false is a bug, and that sequence is its failure scenario.

Report each bug in the shape `review-code` already asks for: the claim, the sequence as the failure
scenario, the fix. Fixing one hazard often creates the next, such as a guard that now drops a valid
result or a sync that rebuilds a removed row. Run the fix back through Step B before proposing it.
