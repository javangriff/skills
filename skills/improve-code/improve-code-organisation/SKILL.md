---
name: improve-code-organisation
description: Reorganises a Vue 3 script setup component so its code reads by logical concern instead of by option/API type. Use when a component feels hard to follow, has refs/computeds/watchers/handlers for unrelated features interleaved, mixes concerns in one file, or when the user asks to "improve code organisation", "tidy up this component", "clean up the script", "group related logic", or "extract a composable". Reach for this whenever a Vue component's script setup block is long, scattered, or hard to scan — even if the user only vaguely says it "needs a cleanup".
---

# Improve Code Organisation (Vue 3 Composition API)

Reorganise a Vue 3 `<script setup>` component so the code is grouped by **logical concern**, not scattered by API type. The win is that someone can read top-to-bottom and follow a feature without scrolling between sections.

This skill is **behaviour-preserving**. You are moving and grouping code, optionally lifting a concern into a composable — never changing what the component does. The template, props, emits, and runtime behaviour stay identical.

## When NOT to extract

Default to organising **in place**. Extracting into a `use*.ts` composable is only worth it when the logic is genuinely reusable, or a concern is large and self-contained enough that lifting it out makes the component meaningfully easier to read. Creating a new file for one-off logic just adds indirection. **Always ask the user before creating a new composable file** — propose it, explain why, and let them decide.

If the component is still Options API (has `export default { data() {...} }`), this skill does not apply. Say so, and suggest migrating it to `<script setup>` first.

## Process

### 1. Identify the logical concerns

Read the whole `<script setup>` and the template. Name the distinct features the component handles. A "concern" is a thing the component *does*, e.g. "date-range filtering", "row selection", "modal open/close state", "fetching the activity log". A single concern usually owns some mix of: refs, computeds, watchers, lifecycle hooks, and handler functions.

List them back to the user briefly before you start moving code, so you agree on the grouping. Cheap to confirm, expensive to guess wrong.

### 2. Decide ordering within the file

Keep a predictable top-to-bottom shape so the file scans well. A reliable order:

1. Imports
2. `defineProps` / `defineEmits` / `defineModel`
3. Injected dependencies, stores, route, query clients (the component's external wiring)
4. **One block per logical concern** — each block holds *all* of that concern's state, derived values, watchers, and handlers together
5. Anything genuinely cross-cutting that doesn't belong to a single concern

Within a concern block, a natural reading order is: state → derived (`computed`) → side effects (`watch`, lifecycle) → handlers.

### 3. Group the code by concern

Move related code so each concern is contiguous — all of one concern's state, derived values, side effects, and handlers sitting together, in that reading order. Let the grouping itself carry the structure:

```ts
const startDate = ref<Date>()
const endDate = ref<Date>()
const dateRange = computed(() => ({ start: startDate.value, end: endDate.value }))
watch(dateRange, () => refetch())
function clearDates() {
  startDate.value = undefined
  endDate.value = undefined
}

const selectedIds = ref<Set<string>>(new Set())
const hasSelection = computed(() => selectedIds.value.size > 0)
function toggleRow(id: string) { /* ... */ }
```

Don't add section-header comments to mark the boundaries. Well-grouped code shows its own seams, and structural headers drift out of date the moment code moves. If a concern is genuinely hard to follow without a label, that's a signal it should become a composable (step 4), not get a comment. Preserve comments that are already in the file — relocate them with their code — but don't introduce new structural ones.

### 4. Extract a composable only when it earns it (ask first)

If a concern is reusable or large/self-contained, propose lifting it into a composable. Follow where the repo already keeps composables; absent a convention:

- File: `useThing.ts`, co-located with the component (or in a shared `composables/` dir if reused across components)
- Exported function `useThing(...)` returns an object of the refs/computeds/functions the component needs
- Keep the return shape minimal — only expose what the template or other concerns actually use
- Preserve types; the composable is plain TypeScript, which is exactly why the Composition API infers well

```ts
// useDateRangeFilter.ts
export function useDateRangeFilter(onChange: () => void) {
  const startDate = ref<Date>()
  const endDate = ref<Date>()
  const dateRange = computed(() => ({ start: startDate.value, end: endDate.value }))
  watch(dateRange, onChange)
  function clearDates() {
    startDate.value = undefined
    endDate.value = undefined
  }
  return { startDate, endDate, dateRange, clearDates }
}
```

The component then reads as a summary of its concerns:

```ts
const { startDate, endDate, clearDates } = useDateRangeFilter(refetch)
const { selectedIds, hasSelection, toggleRow } = useRowSelection()
```

### 5. Verify nothing changed

Behaviour preservation is the whole contract, so prove it. Find the repo's own typecheck, unit-test, and lint commands (`package.json` scripts, an Nx or Turbo target, the CI config) and run them on the affected project:

- Typecheck: types still resolve, which catches a missed import or a binding the template relies on.
- Unit tests for the component: existing tests still pass.
- Lint: no new issues. Never suppress a rule to get there.
- Re-read the template: every binding it uses must still be defined in `<script setup>`.

Report what you ran and the result. If you extracted a composable, mention the new file and why it earned its place.

## Guard rails

- **Preserve reactivity across a move.** Do not destructure a `reactive()` object or a composable's return in a way that drops reactivity.
- **Leave server state where it is.** A fetching concern built on a query library (`useQuery` and friends) stays one; do not reshuffle it into ad-hoc refs.
- **Match the file's formatting.** Semicolons, quotes, and line width follow the surrounding code and the repo's formatter.
