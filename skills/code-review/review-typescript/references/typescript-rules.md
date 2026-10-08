# TypeScript review checks

Type-level defects the compiler accepts but that lie to the reader or leak unsafety into the codebase. Each rule reads *what it is*, the *symptom*, and the *fix*. Match against changed lines only.

The compiler is the first reviewer. Read `tsconfig.json` before you start: with `strict` on, several of these are partly caught already, and your job is the remainder. With `strict` off, note that once at the top of your report and do not repeat it per finding.

## Contents

- A. Assertions that lie: unrelated `as` casts, non-null assertions, missing `as const` / `satisfies`
- B. `any` leakage: untyped boundaries, `any` in generics, `@ts-ignore`
- C. Narrowing that does not narrow: non-exhaustive unions, `Object.keys` / `in` / `includes`, optional discriminants
- D. Promises and async: floating promises, misplaced `await`, `async` callbacks where `void` is expected, sequential independent awaits
- E. Signatures that mislead: wide return types, "sometimes required" optionals, `enum`, index signatures, `Function` / `object`
- F. Shared mutable state: exported `let`, mutated parameters, missing `readonly`
- G. Tests: casts and `any` that hide real failures
- Not worth flagging

## A. Assertions that lie

### A1. `as` casts across unrelated or wider types

```ts
const user = response.data as User            // ❌ nothing checked the shape
const el = document.querySelector('.x') as HTMLInputElement  // ❌ may be null, may not be an input
```

**Symptom:** the code compiles, the runtime object lacks the fields, and the failure surfaces far from the cast as `undefined is not a function` or a silently wrong value.
**Fix:** validate at the boundary (a schema parser, a type guard, `instanceof`) and let inference carry the narrowed type. A cast is acceptable only when the surrounding code has already proven the type and the compiler cannot see the proof; say so in a one-line comment.

### A2. Non-null assertions on values that can be null

```ts
const name = map.get(id)!.name       // ❌
route.params.id!                     // ❌ absent on a sibling route
```

**Symptom:** a `TypeError` in production that the type system was designed to prevent.
**Fix:** handle the `undefined` case (early return, default, throw with a message). `!` is acceptable directly after a check the compiler cannot follow, such as a `Map` `has` followed by `get`.

### A3. `as const` or `satisfies` missing where a literal type is needed

A config object or array declared without `as const` widens `'GET'` to `string` and then needs a cast downstream.
**Fix:** `as const` at the declaration, or `satisfies T` to check the shape without widening.

## B. `any` leakage

### B1. Untyped boundaries

`JSON.parse`, `fetch().json()`, `localStorage.getItem` followed by parse, third-party callbacks typed `any`, `event.target` reads. The `any` spreads through every assignment and function it touches, switching off checking silently.

**Symptom:** a whole module that type-checks but has no actual type safety; refactors miss call sites.
**Fix:** type the boundary once. A parse-and-validate function that returns `T | null`, or `unknown` plus a type guard. Never let `any` escape a function's return type.

### B2. `any` in a generic default or constraint

`function pick<T = any>(...)` or `Record<string, any>` as a parameter type.
**Fix:** `unknown` for "I do not care", a proper constraint for "I care about this shape".

### B3. `@ts-ignore`

Suppresses the next line regardless of what error it has, so it keeps suppressing after the original error is gone.
**Fix:** `@ts-expect-error` with a reason, which fails the build when the error disappears.

## C. Narrowing that does not narrow

### C1. Non-exhaustive `switch` or `if` on a union

```ts
switch (status) {
  case 'active': return ...
  case 'paused': return ...
  // 'archived' added to the union later: falls through silently
}
```

**Symptom:** adding a union member compiles but produces `undefined` at runtime for the new case.
**Fix:** a `default` branch that assigns to `never` (`const _exhaustive: never = status`) or calls an `assertNever(status)` helper, so the compiler reports the missing case.

### C2. `Object.keys`, `in`, and `includes` that keep the wide type

`Object.keys(obj)` is `string[]`, so `obj[key]` is an implicit `any` or an error. `arr.includes(x)` on a literal-typed array does not narrow `x`.
**Fix:** a typed keys helper (`Object.keys(obj) as Array<keyof typeof obj>` with the proof adjacent), a type guard, or a `Set` with a guard.

### C3. Discriminated unions checked by an optional field

`if (result.error)` on `{ ok: boolean; data?: T; error?: E }` narrows nothing; `data` stays optional in the success branch.
**Fix:** a real discriminant: `{ ok: true; data: T } | { ok: false; error: E }`.

## D. Promises and async

### D1. Floating promises

A call that returns a promise, not awaited, not returned, not `.catch`ed, not explicitly `void`ed.
**Symptom:** a rejection becomes an unhandled-rejection crash or a silently skipped step; ordering assumptions break.
**Fix:** `await` it, return it, or `void` it with a one-line reason.

### D2. `await` on a non-promise, or a missing `await` in a `try`

```ts
try { return doAsync() } catch (e) { ... }   // ❌ catch never runs; the caller gets the rejection
```

**Fix:** `return await doAsync()` inside a `try`, so the catch applies.

### D3. `async` callbacks passed where `void` is expected

`array.forEach(async ...)`, an `async` event handler whose rejections nobody sees, an `async` function passed to a `watch`.
**Fix:** `for...of` with `await`, or `Promise.all(map(...))`; wrap event handlers so rejections are reported.

### D4. Sequential awaits that are independent

`const a = await getA(); const b = await getB();` where neither depends on the other.
**Fix:** `const [a, b] = await Promise.all([getA(), getB()])`. Flag only when both are network or IO calls.

## E. Signatures that mislead

### E1. Return type wider than the body

`function find(): User | undefined` where the body always returns a `User`, or `Promise<any>` on a function whose body is fully typed.
**Fix:** let inference decide, or tighten the annotation to what the body does.

### E2. Optional parameters and properties used as "sometimes required"

A parameter typed `?` that the body immediately asserts or throws on. A property that is optional in the type but every consumer treats as present.
**Fix:** make it required. Optionality is a promise to callers that they may omit it.

### E3. `enum` where a string-literal union suffices

Enums introduce a runtime object, awkward reverse mapping for numeric enums, and nominal typing that string literals do not need.
**Fix:** `type Status = 'active' | 'paused'`, with `as const` object if iteration is needed. Skip when the repo already uses enums consistently.

### E4. Index signatures for a known set of keys

`Record<string, T>` or `{ [key: string]: T }` when the keys are a fixed set.
**Fix:** `Record<KnownKey, T>` or an explicit object type, so a typo is a compile error.

### E5. `Function` and `object` as types

Both accept nearly anything and check nothing at call sites.
**Fix:** a specific signature (`(x: A) => B`) or a specific shape.

## F. Shared mutable state

### F1. Exported `let` or mutable module-level objects

Any importer can change it; there is no single owner and no way to observe the change.
**Fix:** export a function that reads it, or a `readonly` value, or move it into a store that owns mutation.

### F2. Mutating a parameter or a returned array

`items.sort()` on a passed-in array, `Object.assign(config, ...)` on an argument. The caller's data changes without its knowledge.
**Fix:** copy first (`[...items].sort()`, `{ ...config, ... }`), or accept `readonly T[]` so the compiler stops it.

### F3. `readonly` missing on data that is never meant to change

Props, config, and constants typed mutable invite accidental writes.
**Fix:** `readonly` fields and `ReadonlyArray`. Judgement call; flag when a nearby write already happens.

## G. Tests

### G1. Casts and `any` in tests that hide real failures

`render(Component as any)`, `expect(result as User).toEqual(...)`, `vi.fn() as unknown as X` when the real type would have caught a wrong shape.
**Fix:** typed factories and `satisfies`. A test that needs `as any` to compile is testing a shape the code does not have.

### G2. `expect.anything()` and loose matchers on the value under test

They pass for wrong values.
**Fix:** match the value that the behaviour under test should produce.

## Not worth flagging

- Anything `strict` already rejects when `strict` is on.
- Anything the repo's ESLint TypeScript rules already report (`no-floating-promises`, `no-explicit-any`, `switch-exhaustiveness-check`, `no-non-null-assertion`, `no-unsafe-*`). Read the ESLint config to know which apply.
- A `!` immediately after a check the compiler cannot follow, with the check on the adjacent line.
- Enums in a repo that uses enums throughout.
- Return type annotations on exported functions, even when inferable. Many repos require them for API stability.
- Style choices between `interface` and `type`, or between `T[]` and `Array<T>`.
