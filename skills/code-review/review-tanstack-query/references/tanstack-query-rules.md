# TanStack Query review checks (v5)

All rules below assume **v5**. Read the adapter and major version from the project's `package.json` before you start (`@tanstack/vue-query`, `@tanstack/react-query`, `@tanstack/solid-query`, `@tanstack/svelte-query`, `@tanstack/angular-query-experimental`). If the version is v5, flag v4 idioms as bugs, not as style. If it is v4, skip section D and treat the v4 column there as correct.

The examples are written for the Vue adapter. Rules A1, A3, A4, and A6 are adapter reactivity rules: with Vue they are about refs and getters; with React the equivalent defect is a key or `enabled` captured from a stale closure or a hook called conditionally; with Solid and Svelte they are about signals and stores. Apply the rule's intent to the adapter in use.

Distilled from the [Vue guides](https://tanstack.com/query/latest/docs/framework/vue/guides/). Most real defects here are **reactivity** defects: an option that was captured as a plain value at setup time and therefore never changes again. The query looks correct, fetches once, and then quietly serves the wrong data forever.

---

## A. Reactivity — the highest-value checks

### A1. A query key built from a plain value never refetches

This is the single most common TanStack Query bug in a Vue codebase.

```ts
// ❌ props.id is read once at setup; the key is frozen
useQuery({ queryKey: ['todo', props.id], queryFn: () => fetchTodo(props.id) })

// ❌ same problem — .value unwraps at setup time
useQuery({ queryKey: ['todo', selectedId.value], ... })
```

```ts
// ✅ the ref itself goes in the key
useQuery({ queryKey: ['todo', selectedId], queryFn: () => fetchTodo(selectedId.value) })

// ✅ or a computed key, which is required when the key is derived
useQuery({ queryKey: computed(() => ['todo', props.id]), queryFn: () => fetchTodo(props.id) })
```

**Symptom:** selecting a different item shows the first item's data. Navigating between detail pages of the same component shows stale content. Nobody notices in dev with an empty cache.

**How to spot it:** for every value inside a `queryKey` array, ask whether it can change over the component's life. If it can, it must reach the key as a ref, a `computed`, or a getter — never as `.value`, never as a bare `props.x`.

### A2. Every variable the query function reads must be in the key

> "Since query keys uniquely describe the data they are fetching, they should include any variables you use in your query function that **change**."

```ts
// ❌ page changes, key doesn't — page 2 serves page 1's cached data
useQuery({ queryKey: ['todos'], queryFn: () => fetchTodos({ page: page.value }) })
```

Read the query function body and match every reactive value it reads against the key. A filter, sort, page, search term, company UID, or locale read in the function but absent from the key is a cache-collision bug: two different requests share one cache entry.

### A3. `enabled` must be reactive

```ts
enabled: !!props.id                        // ❌ evaluated once, frozen
enabled: computed(() => !!props.id)        // ✅
enabled: () => !!props.id                  // ✅ getter also works
```

**Symptom:** a query gated on a value that arrives asynchronously (an id from a parent fetch, an authenticated user) never runs at all — or runs once with `undefined` and stays disabled forever.

### A4. Destructured or spread options lose reactivity

Options objects go through Vue's reactivity, so pulling values out or spreading a reactive object into a plain literal severs the link — the same trap as `reactive()` destructuring. A composable that takes `id: string` instead of `id: MaybeRefOrGetter<string>` has already lost it at the boundary. Prefer `toValue()` inside the composable and accept `MaybeRefOrGetter`.

### A5. `useQuery` must be called synchronously at setup top level

Never inside `watch`, `onMounted`, a conditional, an event handler, or after an `await` in `<script setup>`. After an await the component's effect scope is gone, so the query is never disposed and never unsubscribes.

**Fix:** call it unconditionally and gate it with a reactive `enabled`.

### A6. Returned values are refs

`data`, `isPending`, `error` etc. are refs — `.value` in script, auto-unwrapped in the template. Destructuring the top level is fine; destructuring *through* it is not:

```ts
const { data } = useQuery(...)            // ✅ still a ref
const { data: { items } } = useQuery(...) // ❌ undefined at setup, never updates
```

---

## B. Cache correctness

### B1. Key collisions — same key, different data

Two `useQuery` calls sharing a key must return the same shape from the same source. A key reused across a list endpoint and a detail endpoint means whichever mounts second overwrites the first. Also flag the reverse: two queries that should share a cache entry using differently-ordered keys.

Array **order** is significant (`['todos', status, page]` ≠ `['todos', page, status]`); object **key order** is not (`{ status, page }` === `{ page, status }`).

### B2. Keys must be serialisable and stable

Keys are hashed with a deterministic `JSON.stringify`. A class instance, a function, or a freshly-constructed object/array literal computed inline can hash differently on each render and thrash the cache. Keys must be arrays at the top level.

### B3. Invalidation must match the key prefix

`invalidateQueries({ queryKey: ['todos'] })` matches every key *starting* with `['todos']`. Check the mutation's invalidation against the actual keys in use:

- Invalidating `['todos', filters]` when the list is keyed `['todos', 'list', filters]` matches nothing — the UI silently keeps stale data after a successful save.
- Invalidating `['todos']` when the intent was one entry is usually fine, but `exact: true` exists if it matters.
- Invalidated **inactive** queries are marked stale but do not refetch until something mounts them. A detail page invalidated while unmounted will not be fresh on a synchronous `setQueryData`-free flow.

### B4. Return the invalidation promise when the UI depends on it

```ts
onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })   // awaited
onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['todos'] }) } // fire and forget
```

Returning the promise keeps the mutation `isPending` until the refetch settles. Dropping it means the dialog closes and the toast fires while the list still shows the old row. Either is defensible — flag it only when the surrounding code clearly assumes the refetch has landed.

### B5. `setQueryData` updates must be immutable

The updater must return a new object. Mutating the previous value in place corrupts the cache and defeats structural sharing, so nothing re-renders.

```ts
queryClient.setQueryData(key, old => ({ ...old, name }))   // ✅
queryClient.setQueryData(key, old => { old.name = name; return old })  // ❌
```

### B6. Optimistic updates need the full four-step shape

`onMutate` must `cancelQueries` (otherwise an in-flight refetch overwrites the optimistic value), snapshot the previous data, apply the update, and return the snapshot; `onError` must roll back from it; `onSettled` must invalidate. A partial implementation — commonly a missing `cancelQueries` or no rollback — leaves the UI showing a change that never persisted.

---

## C. Defaults that surprise people

- **Data is stale immediately.** `staleTime` defaults to `0`, so queries refetch on remount, window focus, and reconnect. A component that mounts a query in a loop or a frequently-remounted dialog will hammer the API. Setting a `staleTime` is usually the fix, not disabling refetching globally.
- **`gcTime` is 5 minutes**, and its timer only starts when the *last* observer unmounts.
- **Failed queries retry 3 times with exponential backoff.** Flag `retry` left at the default on a mutation-like or non-idempotent read, and on a query whose 404 is a legitimate expected state — the user waits through three retries before seeing the empty state.
- **Structural sharing only works on JSON-compatible values.** Responses containing `Date`s, `Map`s, or class instances register as changed every fetch and re-render everything downstream.

---

## D. v5 migration leftovers

Flag these as bugs — the code either fails to type-check or silently does nothing:

| v4 | v5 |
|---|---|
| `cacheTime` | `gcTime` |
| `useQuery(key, fn, options)` positional args | single options object only |
| `onSuccess` / `onError` / `onSettled` on `useQuery` | **removed** — use `select`, a watcher, or handle in the component |
| `keepPreviousData: true` | `placeholderData: keepPreviousData` |
| `isLoading` meaning "no data yet" | `isPending`; `isLoading` now means `isPending && isFetching` |
| `isInitialLoading` | `isLoading` |

`onSuccess` on `useQuery` is the dangerous one — it is accepted silently by loose typings in some setups and simply never fires.

---

## E. Query function hygiene

- **The query function must throw on failure.** A `fetch` wrapper that returns a non-ok response resolves successfully, so the error state never appears and the bad payload is cached. Axios throws by default; hand-rolled `fetch` usually does not.
- **Pass the `signal` through** for cancellation: `queryFn: ({ signal }) => api.get(url, { signal })`. Without it, an abandoned query's response still lands.
- **Dependent queries use `enabled`, not nested awaits.** Awaiting one request inside another query function hides the dependency from the cache — both results are cached under one key and neither can be invalidated independently.
- **No side effects in `queryFn`.** Toasts, navigation, and store writes belong in the component; a query function can be re-run at any time by a background refetch.
- **`select` must be a stable reference** when it matters — an inline arrow is fine, but it re-runs on every render, so keep it cheap.

---

## F. Not worth flagging

- A missing `staleTime` on a genuinely volatile resource.
- Default `retry` on a normal read.
- A query key without a shared key-factory, unless the file already has one and the new code bypasses it.
- `mutateAsync` used with a real `try/catch`.
- Sensible `queryKey` naming choices.
