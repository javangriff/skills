# Simplicity rules

Rules for making a change as small as it can be while still doing its job. One section per theme.

Three rules bind every section:

- **The repo overrides.** A documented repo standard always wins. Where it requires something a rule below would cut, keep it.
- **The diff is the scope.** Apply these to code the change introduced, or to code the change made dead. Pre-existing code that the change merely touched is out of scope.
- **Behaviour is preserved.** A cut that changes what the program does for any current caller is not a simplification. It is a different change, and it needs its own justification.

## YAGNI

The question for every unit of new code: **what, present in the repo right now, needs this?** A caller, a requirement in the spec or ticket, a failing test, or a documented standard. Search for the answer; do not assume it. If nothing answers, the code goes.

Each entry reads *what it is* → *what to do*.

- **Abstraction with one caller.** A helper, wrapper, base class, higher-order function, or generic parameter used with exactly one concrete type or from exactly one place. → Inline it at the call site. Extract again when a second caller appears, and not before.
- **Parameter, option, prop, or config nothing sets.** An argument every caller passes the same value for, an optional prop no parent binds, a config key with one value, a feature flag with one state. → Remove it and hard-code the value that is used.
- **Export nothing imports.** → Remove the `export`. If the symbol also has no local use, delete it.
- **Branch for an impossible state.** A check the types or callers already rule out, a `default` that cannot be reached, a null check on a value the compiler proves present, a catch for an error the callee never throws. → Delete the branch. If the compiler cannot see the guarantee, tighten the type instead of adding a runtime check.
- **Premature extensibility.** A registry with one entry, a strategy pattern with one strategy, an event bus with one listener, a plugin point with no plugin, an interface with one implementation, a factory that builds one thing. → Replace with the direct call or the concrete type.
- **Future-proofing.** Fields in a type that nothing reads, placeholder functions, `TODO` stubs, compatibility shims for callers that do not exist, versioned names (`v2`) with no v1 in use. → Delete. Version control remembers.
- **Reimplementation.** A utility the repo, the standard library, or an installed dependency already provides: date formatting, deep clone, debounce, `groupBy`, URL parsing, a fetch wrapper beside an existing API client. → Use the existing one. Check `package.json` and the repo's `utils`/`lib`/`composables` directories before accepting any new utility.
- **Test that tests nothing.** A test that only exercises the framework (a component renders, a function is defined), or that duplicates another test's assertions with different wording. → Delete it. Keep every test that asserts a behaviour the change introduced.
- **Indirection with no decision.** A function that calls one other function with the same arguments, a component that renders one child with the same props, a composable that returns another composable unchanged. → Cut the middle layer.
- **Configuration for a constant.** An environment variable, settings entry, or injection token for a value that is the same in every environment. → A constant in the module that uses it.

### Kept on purpose

These look speculative and are not. Do not cut them:

- **Validation at input boundaries.** Request bodies, form input, URL parameters, environment variables, third-party responses, file contents. Anything that enters from outside the type system.
- **Error handling on failure paths** that can actually fail: network, IO, parsing, permissions. Includes the logging or user feedback on those paths.
- **Accessibility attributes** and semantic markup.
- **Type annotations and types**, even when inference would do. Removing them is a style change, not a simplification.
- **Anything a documented repo standard requires**, such as a return type on every exported function.
