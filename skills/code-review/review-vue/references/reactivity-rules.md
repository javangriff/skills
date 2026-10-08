# Vue reactivity rules — review checks

Distilled from [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html). Each rule below is a thing to look for in a diff, with the runtime symptom it produces. Fetch the page only if you need detail beyond what is here.

## Contents

1. `reactive()` loses the connection on destructure
2. `reactive()` breaks when the whole object is replaced
3. `reactive()` cannot hold primitives
4. Refs do not unwrap inside reactive arrays or collections
5. Assigning a new ref over an unwrapped ref property severs the original
6. Templates only unwrap top-level refs
7. The proxy is not the raw object
8. State is deeply reactive by default
9. DOM updates are asynchronous
10. Props are reactive; destructured props may not be
11. Prefer `ref()` over `reactive()`

## 1. `reactive()` loses the connection on destructure

`reactive()` tracks over property access, so pulling a primitive property out into a local variable — or passing it into a function — hands over a plain value with no link back.

```js
const state = reactive({ count: 0 })
let { count } = state        // ❌ disconnected
count++                      // state.count is still 0
callSomeFunction(state.count) // ❌ the function receives a plain number
```

**Symptom:** the UI never updates, or a composable's argument is permanently frozen at its initial value.
**Fix:** use `ref()` for the state, or pass a getter (`() => state.count`), or `toRefs(state)`.

## 2. `reactive()` breaks when the whole object is replaced

```js
let state = reactive({ count: 0 })
state = reactive({ count: 1 })  // ❌ the template still tracks the first proxy
```

**Symptom:** replacing a whole object after a fetch renders nothing new.
**Fix:** `const state = ref({...})` and assign `state.value = ...`, or mutate properties in place with `Object.assign`.

## 3. `reactive()` cannot hold primitives

It only works for objects, arrays, and collections (`Map`, `Set`). A `string`, `number`, or `boolean` passed to it is not reactive at all.

## 4. Refs do **not** unwrap inside reactive arrays or collections

Refs unwrap when accessed as a property of a **deep** reactive object. They do not unwrap as an array element or a `Map` value, and they do not unwrap inside a `shallowReactive`.

```js
const books = reactive([ref('Vue 3 Guide')])
books[0].value            // ✅ .value required
const map = reactive(new Map([['count', ref(0)]]))
map.get('count').value    // ✅ .value required
```

**Symptom:** rendering `[object Object]`, or comparisons that are always false.

## 5. Assigning a new ref over an unwrapped ref property severs the original

```js
const count = ref(0)
const state = reactive({ count })
state.count = otherCount   // replaces the ref; `count` is now disconnected
```

**Symptom:** two values that used to move together silently drift apart.

## 6. Templates only unwrap **top-level** refs

```js
const object = { id: ref(1) }
```

```vue
{{ object.id + 1 }}  <!-- ❌ renders "[object Object]1" -->
{{ object.id }}      <!-- ✅ text interpolation does unwrap -->
```

**Symptom:** arithmetic or string concatenation in the template produces `[object Object]`.
**Fix:** destructure to a top-level binding (`const { id } = object`), or expose a `computed`.

Watch for this in `<script setup>` where a plain object literal groups several refs together and the template reaches into it.

## 7. The proxy is not the raw object

```js
const raw = {}
const proxy = reactive(raw)
proxy === raw   // false
```

Only the proxy is reactive. Mutating the raw object triggers nothing. `reactive()` is idempotent — calling it on the same object, or on the proxy, returns the same proxy.

**Symptom:** identity comparisons (`item === selectedItem`, `indexOf`, `Set.has`) failing when one side came from the raw object and the other from the proxy. Common when a raw object is captured before being put into reactive state.

## 8. State is deeply reactive by default

Nested mutations and array `push`/`splice` are all tracked. Flag two opposite mistakes:

- Defensive deep-cloning or manual reassignment "to make it react" — unnecessary, and it usually breaks identity comparisons (rule 7).
- `shallowRef` / `shallowReactive` on a value whose nested properties the template reads — those mutations are not tracked. Only `.value` access is.

## 9. DOM updates are asynchronous

Vue buffers updates until the next tick so a component renders once regardless of how many changes were made.

```js
count.value++
await nextTick()   // only now is the DOM updated
```

**Symptom:** reading `element.offsetHeight`, measuring, focusing an element, or scrolling immediately after a state change and getting the pre-update value. Flag any DOM read or measurement that follows a state mutation in the same synchronous block.

## 10. Props are reactive; destructured props may not be

In `<script setup>`, `const { foo } = defineProps()` is compiled to keep reactivity in Vue 3.5+, but a prop destructured elsewhere — or spread into a plain object, or passed by value into a composable — loses it.

**Fix:** pass `toRef(props, 'foo')` or a getter `() => props.foo`. This matters most as a watch source: `watch(props.foo, ...)` watches the current value, not the prop (see `watch-smells.md`).

## 11. Prefer `ref()` over `reactive()`

`ref()` is the primary API. It holds any value type, survives whole-value replacement, and survives being passed around. When a diff introduces `reactive()`, check whether it is being used specifically for property-level ergonomics; if not, `ref()` is the safer default and rules 1–3 stop applying.
