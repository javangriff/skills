# Watcher smells — when a `watch` should not exist

A `watch` is a side effect. Most watchers in a Vue codebase are not side effects at all — they are derived state or a missing event listener, written imperatively. Every watcher in a diff should have to justify itself.

The question to ask each one: **is this synchronising, or is this reacting?** Synchronising is a `computed`, a prop, or a `v-model`. Only genuine side effects — network calls, DOM work, storage, logging, navigation — earn a watcher.

Report each finding with the concrete replacement code, not just the category name.

## 1. Mirroring a prop into a local ref

```js
const localValue = ref(props.modelValue)
watch(() => props.modelValue, v => { localValue.value = v })
```

The watcher exists only to keep two values equal. Worse, it is one-directional and creates two sources of truth that drift the moment the child writes to `localValue`.

**Fix, in order of preference:**
- `defineModel()` — if the child writes back, this is what it is for, and it deletes both the ref and the watcher.
- `computed(() => props.modelValue)` — if the child only reads.
- A `computed` with a getter/setter pair that emits `update:modelValue` on write.

## 2. Deriving a value imperatively

```js
const fullName = ref('')
watch([first, last], () => { fullName.value = `${first.value} ${last.value}` }, { immediate: true })
```

**Tell:** the watcher body's only statement assigns to a ref, and nothing else in the component writes to that ref. `{ immediate: true }` is a strong signal — needing the effect to run once at setup usually means the value is derived, not reacted to.

**Fix:** `const fullName = computed(() => ...)`.

## 3. Watching state a child component already emits

```js
watch(selectedRegion, region => { onRegionChange(region) })
```

…where `selectedRegion` is only ever written by `<RegionSelect v-model="selectedRegion" />`. The watcher is a roundabout event listener that also fires on programmatic changes the author did not intend.

**Fix:** listen to the component's own event instead — `@update:model-value="onRegionChange"`, or whatever the child emits (`@change`, `@select`, `@submit`). Read the child's `defineEmits` to find the right event; do not assume `update:modelValue` is the only one.

**Why it matters beyond tidiness:** a watcher fires for *every* change to the value, including resets, programmatic seeding, and route-driven restores. An event listener fires only on actual user interaction. Conflating the two causes duplicate API calls and spurious form-dirty state.

## 4. Watching something a parent should have passed as a prop

A watcher reaching into a store, the route, or an injected value to recompute local state is often a component that should simply receive that value as a prop and stay presentational.

**Fix:** lift the concern to the container, pass the result down as a prop. This matches the container/presentational split — leaves should not own side effects.

## 5. Watching the route or query params

```js
watch(() => route.query.tab, tab => { activeTab.value = tab ?? 'overview' })
```

**Fix:** `const activeTab = computed(() => route.query.tab ?? 'overview')`. `route` is reactive; deriving from it needs no watcher. A watcher is only warranted when navigation must trigger a real side effect, such as a refetch.

## 6. A watcher wrapping a data fetch

TanStack Query's `useQuery` takes reactive keys and refetches on its own. A watcher that calls `refetch()`, or manually reassigns `data.value`, is reimplementing that.

**Fix:** make the changing value part of the query key.

## 7. Watching a non-reactive source

```js
watch(props.filters, ...)        // ❌ watches the current object, not the prop
watch(props.count, ...)          // ❌ watches a number — fires never
watch(someObject.value, ...)     // ❌ unwrapped at call time
```

A watch source must be a ref, a reactive object, a getter, or an array of those. Passing a value means the watcher silently never fires — the worst failure mode, because it looks correct.

**Fix:** `watch(() => props.filters, ...)`. Add `{ deep: true }` only if nested mutation must be observed, and note that a getter returning the same object reference will not fire on nested change without it.

## 8. `deep: true` used as a blunt instrument

Deep watching a large object to react to one field costs a full traversal on every change and fires for edits that are irrelevant.

**Fix:** watch the specific getter — `watch(() => form.email, ...)` — or an array of getters.

## 9. A watcher that mutates its own source

```js
watch(items, () => { items.value = items.value.filter(Boolean) })
```

Self-triggering. At best it runs twice; at worst it loops. Flag any watcher writing to something in its own source list, directly or through a function call.

## 10. Async watchers with no cleanup

```js
watch(searchTerm, async term => { results.value = await search(term) })
```

Responses can resolve out of order, so a slow early request overwrites a fast later one.

**Fix:** use `onWatcherCleanup()` (or the `onCleanup` third argument) to abort the in-flight request, or let TanStack Query handle it.

## 11. `watchEffect` where `watch` was meant

`watchEffect` tracks every reactive value read in its body, including ones read incidentally inside a called function. It re-runs for dependencies the author never intended and cannot see. Prefer an explicit `watch` source whenever the dependencies are known.

Also flag `watchEffect` whose body has a conditional early return — dependencies read only on some branches are tracked inconsistently between runs.

## 12. Watchers that should be lifecycle hooks

A watcher with `{ immediate: true }` on a value that never changes afterwards is `onMounted` written obliquely. Say so.

---

## When a watcher **is** correct

Do not flag these:

- Genuine side effects: firing a request, writing to `localStorage`, imperative DOM work, analytics, navigation, toasts.
- Reacting to a change with something that is not a value — opening a dialog, focusing an input, scrolling.
- Bridging to non-reactive external systems: a chart instance, a map SDK, a websocket subscription.
- Effects that need the old value — `watch(x, (next, prev) => ...)` has no `computed` equivalent.
