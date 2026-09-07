---
name: improve-code-organisation
description: Reorganise a Vue 3 `<script setup>` component so its code reads by logical concern instead of by option/API type. Use when a component feels hard to follow, has refs/computeds/watchers/handlers for unrelated features interleaved, mixes concerns in one file, or when the user asks to "improve code organisation", "tidy up this component", "clean up the script", "group related logic", or "extract a composable". Reach for this whenever a Vue component's `<script setup>` is long, scattered, or hard to scan — even if the user only vaguely says it "needs a cleanup".
---

# Improve Code Organisation (Vue 3 Composition API)

Reorganise a Vue 3 `<script setup>` component so the code is grouped by **logical concern**, not scattered by API type. This is the core lesson of the [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq): the Options API forced you to split one feature's `data`, `computed`, `methods`, and `watch` across separate blocks; Composition API lets you keep everything for one concern together. The win is that someone can read top-to-bottom and follow a feature without scrolling between sections.

This skill is **behaviour-preserving**. You are moving and grouping code, optionally lifting a concern into a composable — never changing what the component does. The template, props, emits, and runtime behaviour stay identical.

## When NOT to extract

Default to organising **in place**. Extracting into a `use*.ts` composable is only worth it when the logic is genuinely reusable, or a concern is large and self-contained enough that lifting it out makes the component meaningfully easier to read. Creating a new file for one-off logic just adds indirection. **Always ask the user before creating a new composable file** — propose it, explain why, and let them decide.

If the component is still Options API (has `export default { data() {...} }`), this skill does not apply — point the user at `refactor-to-script-setup` / `refactor-to-setup-method` first, then come back.

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

If a concern is reusable or large/self-contained, propose lifting it into a composable. Conventions in this repo:

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

Behaviour preservation is the whole contract, so prove it:

- `nx typecheck <project>` — types still resolve (catches a missed import or a binding the template relies on)
- `nx test:unit <project> -- <path/to/Component.test.ts>` — existing tests still pass
- `nx lint <project>` — no new lint issues (the repo bans `eslint-disable` without permission)
- Re-read the template: every binding it uses must still be defined and exported from `<script setup>`

Report what you ran and the result. If you extracted a composable, mention the new file and why it earned its place.

## Principles to apply (from the FAQ)

- **By concern, not by type.** "Code dealing with the same logical concern can now be grouped together — we no longer need to jump between different options blocks." That sentence is the entire point of this skill.
- **Normal JS best practices apply.** Composition API removes the Options API "guard rails", so ordinary code-organisation judgement is yours to apply: cohesion, small focused functions, meaningful names.
- **Reuse is a benefit, not an obligation.** Composables are the mechanism for reuse — use them when there's reuse (or clarity) to be had, not reflexively.
- **Don't fight the framework.** Keep `defineProps`/`defineEmits` at the top, keep template bindings intact, preserve reactivity (don't destructure reactive objects in a way that drops reactivity).

## Repo specifics (Vue 3 + Nx + Tailwind)

- Components are `<script setup lang="ts">`, no `<style>` blocks (Tailwind `tw:` classes inline).
- Server state is TanStack Query, client state is Pinia or Vuex — a "fetching" concern is usually a `useQuery`; don't reshuffle it into ad-hoc refs.
- Run checks via `nx` (`nx typecheck|test:unit|lint <project>`), not the underlying tools directly.
- No semicolons, single quotes, 120-col lines — match the surrounding file.
