# Test quality rules

A test earns its cost when it detects a meaningful behaviour change, survives an internal refactor, and gives a trustworthy, diagnostic result. Apply these rules with the repository's documented conventions and the risk of the change.

## Contents

- [Behaviour and seams](#behaviour-and-seams)
- [Assertions and oracles](#assertions-and-oracles)
- [Case selection](#case-selection)
- [Choosing a test level](#choosing-a-test-level)
- [Test doubles](#test-doubles)
- [Reliability and isolation](#reliability-and-isolation)
- [Clarity and organisation](#clarity-and-organisation)
- [Sources](#sources)

## Behaviour and seams

- **Test observable behaviour.** Describe what a caller or user can observe, not which method, component, query, or branch performed it.
- **Use the public seam.** A seam is the supported interface of the unit under test, which may be a function, module, service API, UI, or adapter contract. Language visibility alone does not define it.
- **Prefer state and results over interactions.** Assert returned values, emitted events, persisted/retrievable state, or user-visible output. Calls and call order usually describe the implementation.
- **Allow interaction assertions when interaction is the contract.** Examples include sending a command, enforcing a retry ceiling, avoiding a duplicate charge, or preserving an externally required order. State why the interaction matters.
- **Use the right observation point.** Querying a database is a side channel when testing a service API, but it is a legitimate observation when the persistence adapter itself is the unit.
- **Apply the refactor test.** If renaming, extracting, inlining, or replacing an internal collaborator breaks the test without changing behaviour, the test is coupled to structure.

## Assertions and oracles

- **Use an independent oracle.** Derive the expected result from a specification, worked example, invariant, fixture, or independently known value. Do not recompute it with the algorithm under test.
- **Make the assertion discriminating.** A render-without-crashing check, `isDefined`, broad truthiness, or an unchanged mock response often passes when the important behaviour is broken. Assert the consequence that matters.
- **Keep one logical outcome per test.** Several assertions are appropriate when together they specify one outcome or invariant. Split when failures represent independent behaviours or need different setup.
- **Avoid assertion roulette.** A failure should identify which expectation failed and show useful actual and expected values.
- **Treat snapshots as assertions, not recordings.** Keep them focused, stable, reviewed, and small enough that a meaningful change is visible. An accepted wall of output is weak evidence.
- **Use coverage as a map, not a score.** Coverage can locate unexercised code but cannot show that assertions would detect a fault. Ask what plausible faulty implementation would still pass; use configured mutation testing when execution is in scope.

## Case selection

- Cover the representative normal case, relevant invalid inputs, boundaries, and failure paths.
- Partition inputs by behaviour and choose one representative from each meaningful equivalence class. For ordered boundaries, exercise the boundary and its relevant neighbours.
- Cover state transitions, not just states, when history affects behaviour.
- Add a regression test for a discovered defect at the lowest faithful level. It should fail for the defect and pass for the correction.
- Prefer property or invariant tests when many examples express the same general rule. Keep generated failures reproducible and the property independently stated.
- Avoid exhaustive permutations with no distinct risk. Add a case because it can fail differently, not because another value exists.

## Choosing a test level

Use the smallest scope that can faithfully observe the risk. Test size (runtime/resources) and test scope (how much system is exercised) are related but separate.

| Level | Use it for | Keep out |
| --- | --- | --- |
| Unit or narrow | Domain rules, transformations, decisions, invariants, input partitions, and edge cases | Infrastructure whose contract is not under test |
| Integration or component | Database queries and mappings, serialization, filesystem, queues, framework wiring, HTTP clients/handlers, and one controlled boundary | Unrelated remote systems and full user journeys |
| Contract | Compatibility between independently deployed consumers and providers | Internal implementation details on either side |
| End-to-end | A few critical user journeys and deployment/wiring checks that lower levels cannot prove | Exhaustive edge cases already covered below |

- Do not enforce fixed percentages for the levels. Architecture, risk, speed, and fidelity determine the portfolio.
- Do not duplicate every scenario across levels. Repeat a behaviour only when the higher level adds a distinct risk, such as wiring, schema fidelity, browser behaviour, or deployment configuration.
- Prefer many fast narrow tests, enough integration tests to cover every important boundary, and few end-to-end tests for irreplaceable journeys.

## Test doubles

- Prefer the real implementation when it is fast, deterministic, and simple to construct.
- Prefer a maintained fake when the real boundary is unsuitable but realistic stateful behaviour matters.
- Use a stub to control inputs, rare failures, time, randomness, or an external response.
- Use an interaction-verifying mock only when the interaction itself is observable behaviour.
- Replace boundaries outside the test's control, not owned internals merely because mocking is convenient.
- Ensure a fake or stub honours the real contract. Impossible values or stale copied behaviour create false confidence.
- Pair a double-based test with an integration or contract test where divergence from the real dependency is a material risk.

## Reliability and isolation

- Make every test independent of execution order and other tests' success.
- Start from controlled state. Use unique data or reset state rather than relying on shared mutable fixtures.
- Control clocks, randomness, environment, locale, network responses, and concurrency when they affect the result.
- Await asynchronous work and assertions. A test that finishes before its assertion is a false pass.
- Wait for observable conditions rather than sleeping for guessed durations.
- Keep cleanup reliable even after failure. Prefer disposable/hermetic resources over fragile global cleanup.
- A flaky test is a defect. Do not hide it with retries unless the test is explicitly verifying retry behaviour.

## Clarity and organisation

- Name the behaviour and circumstance so a failure reads as a broken specification. Avoid names that only repeat a method or ticket number.
- Arrange, act, then assert. Prefer one action under test; setup calls are not additional acts.
- Make the body complete and concise: show details essential to the behaviour and hide only irrelevant construction noise.
- Prefer DAMP (descriptive and meaningful phrases) over aggressively DRY helpers. Some duplication is cheaper than indirection in tests.
- Keep logic out of tests. Avoid loops, branching, and calculations that make the test's correctness require mental execution. Use parameterized cases when the framework reports each case distinctly.
- Extract helpers around domain concepts, not generic mechanics. A helper name should reveal intent, and important inputs should remain visible at the call site.
- Group tests by public behaviour or feature. Split files when fixtures, environments, ownership, or test levels differ; do not split at an arbitrary line count.
- Keep unit, integration, and end-to-end suites separately runnable when their cost or environment differs.

## Sources

These rules synthesize Matt Pocock's [Good and Bad Tests](https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/tests.md), Google's chapters on [unit testing](https://abseil.io/resources/swe-book/html/ch12.html), [test doubles](https://abseil.io/resources/swe-book/html/ch13.html), and [larger tests](https://abseil.io/resources/swe-book/html/ch14.html), Kent Beck's [Test Desiderata](https://testdesiderata.com/), the [Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), and the ISTQB discussion of [equivalence partitioning and boundary-value analysis](https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf).
