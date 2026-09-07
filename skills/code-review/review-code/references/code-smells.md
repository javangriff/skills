# Code smell baseline

A fixed set of heuristics that applies to every diff, even when the repo documents no standards of its own. Three rules bind it:

- **The repo overrides.** A documented repo standard always wins. Where it endorses something this baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Data Clump"), never a violation. The single exception is marked below.
- **Skip what tooling enforces.** If the repo runs a linter, formatter, or strict type checker, do not repeat what it already catches.

Each entry reads *what it is* → *how to fix*. Match it against the diff, not against the whole file.

## Structure

Adapted from Fowler's *Refactoring*, chapter 3.

- **Mysterious Name.** A function, variable, or type whose name does not reveal what it does or holds. → Rename it. If no honest name comes, the design is murky.
- **Duplicated Code.** The same logic shape appears in more than one hunk or file in the change. → Extract the shared shape and call it from both.
- **Feature Envy.** A function that reaches into another object's data more than its own. → Move the function onto the data it envies.
- **Data Clumps.** The same few fields or parameters keep travelling together. → Bundle them into one type and pass that.
- **Primitive Obsession.** A primitive or string standing in for a domain concept that deserves its own type. → Give the concept its own small type.
- **Repeated Switches.** The same `switch` or `if` cascade on the same discriminator recurs across the change. → Replace with a lookup map or polymorphism that both sites share.
- **Shotgun Surgery.** One logical change forced scattered edits across many files in the diff. → Gather what changes together into one module.
- **Divergent Change.** One file or module is edited for several unrelated reasons. → Split so each module changes for one reason.
- **Speculative Generality.** Abstraction, parameters, or hooks added for needs nothing in the change requires. → Delete it. Inline until a real need shows.
- **Message Chains.** Long `a.b().c().d()` navigation the caller should not depend on. → Hide the walk behind one method on the first object.
- **Middle Man.** A class or function that mostly delegates onward. → Cut it and call the real target directly.

## Readability

- **Nested conditionals and if/else-if chains.** Logic that must be read inside out, or a chain where each branch is really a separate case. → Guard clauses and early returns for the exceptional paths. A lookup map when the branches select a value. The happy path should read top to bottom at the shallowest indentation.
- **High cyclomatic complexity.** Many branches, loops, and boolean operators in one function body. → Extract each branch's work into a named function so the parent reads as a sequence of decisions.
- **Side effects tangled with branching.** A function that both decides and acts, with writes, calls, or mutations scattered across branches. → Separate the decision into a pure function that returns what to do, then one place that does it. The pure part becomes trivially testable.
- **Boolean flag parameters.** A `true`/`false` argument that forks behaviour inside the callee. → Split into two functions, or pass the behaviour itself.
- **Long functions.** A body that needs scrolling to follow. → Extract named steps. The names become the documentation.
- **Negated or compound conditions.** `if (!isDisabled && !(a || b))` and similar that need a second read. → Name the condition (`const canSubmit = ...`) or invert the branch.
- **Result built by mutation.** A variable declared empty and then assigned to across many lines to build a result. → Direct construction, or a single expression, so the reader sees the final shape in one place.

## Comments

The test for every comment: **if it were deleted, would a competent reader lose information they cannot recover from the code?** No means delete. Yes means keep it, as short as it can be while still carrying that information.

- **Narrates the code.** A comment whose content the reader recovers from the next line (`// increment the counter`). → Delete it.
- **Longer than the code it explains.** Multi-sentence prose where one line of *why* would do. → Cut to the intent, workaround, or constraint and nothing else.
- **JSDoc that repeats the signature.** `{type}` in tags on TypeScript, or `@param` lines that echo the parameter name with no added meaning. → Keep the verb-led summary and any tag that carries something the signature cannot (a unit, a range, what `null` means, what is thrown). Drop the rest.
- **JSDoc drifted from the signature.** Parameter names, counts, or return descriptions that no longer match the code. → Fix it. **This one is a hard finding, not a judgement call**, because it actively misleads.
- **Commented-out code.** → Delete it. Version control has it.
- **Missing *why* on a genuine quirk.** A workaround, magic number, ordering constraint, or platform-specific branch with no explanation. → One line stating the reason.

Keep comment-flags that carry signal: `TODO`, `FIXME`, `HACK`, lint-suppression justifications, license headers, and `@ts-expect-error` explanations.

When a file has comment noise throughout rather than in a few places, report it once as a single finding and recommend the `improve-code-docs` skill for the sweep, rather than listing every comment.
