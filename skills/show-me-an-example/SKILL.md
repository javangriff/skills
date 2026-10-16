---
name: show-me-an-example
description: Explain an existing codebase with concrete example code, data, or output at every meaningful step, tracing inputs to observable results. Use when the user asks "show me an example", "walk me through the lifecycle", or "show what happens when we change this" to understand a project's behavior and explore design choices. Capture the discussion in a ticket or handoff prompt when requested. This is an example-led walkthrough, not an implementation request.
---

# Show me an example

Build shared understanding through one concrete example that the user can question and evolve. Ground the explanation in the current implementation. Let design questions emerge from the example instead of starting an architecture interview.

## Ground the example

Read the project's agent instructions, domain vocabulary, and relevant architectural decisions. Trace the public entry point through the code paths needed to explain its result. Use existing tests to confirm supported behavior and important exceptions.

Resolve facts from the code rather than asking the user how their implementation works. State assumptions that affect the result, such as the selected adapter, existing data, or configuration. When the user gives enough context, choose a small representative example and proceed.

Verify uncertain output with an existing test or a small isolated execution when practical. Distinguish output observed in a real system, output from fixtures, and an illustration derived from code. Do not apply the illustrated operation to a live system just to explain it.

## Start with something concrete

Lead with usable public-interface code and representative input or initial state. A lifecycle walkthrough should provide the complete trace in the first answer. Do not stop at an overview and offer to supply the details later. Respect an explicit request for a shorter explanation.

At every meaningful stage, provide:

1. The concrete input, or a clear reference to the previous step's output.
2. A short explanation of the operation and why its result has that shape.
3. A fenced code/data/output block, or a precise state table, showing the resulting example values.

Carry the same names and values through the steps so the user can follow each transformation. One opening code sample followed by prose-only stages is insufficient. Source excerpts, file links, and diagrams support the worked example. They do not replace its intermediate values or generated output.

For example, do not just say "validation converts the page number". Show `{ page: "2" }` becoming `{ page: 2 }`, then trace that value into the actual downstream request. These illustrative fields are not a prescribed representation.

Cover the actual path from authored input through validation, normalization, decisions, generated operations, execution, and final state where those stages exist. Show concrete SQL, request parameters, plans, returned values, or errors as appropriate. If a stage emits no new representation, show the relevant state it reads or retains. Do not invent artifacts to fill the outline.

Label excerpts and simplified shapes. Include the fields that explain the transformation, with real example values. Keep decisive intermediate values visible instead of hiding them behind placeholders or ellipses. Omit only unrelated or unchanged detail.

For stateful workflows, show existing records and their resulting values. Include the actual return value or acknowledgment as well as the resulting stored state when these differ. If asked to change the example and run it again, show the before/after definition, resulting operations, affected records, and repeated-run outcome.

Before sending a walkthrough, check that each meaningful stage has a concrete artifact and connects to the next. Expand prose-only stages. The user should not need to ask what the intermediate object, generated operation, or final result looks like.

Link the relevant source when it supports a surprising result or lets the user inspect the implementation. Use a short diagram or comparison table when it makes the path easier to follow.

## Follow the user's questions

Answer the specific follow-up first. Reuse the example and inspect only the additional paths needed to establish the answer. Do not restart the full walkthrough on every turn.

Keep these distinctions explicit when they affect the answer:

- Authored intent, inferred types, validation, generated operations, and stored state.
- Proposed operations, permission to execute them, and operations that actually completed.
- Application behavior and database, service, or adapter behavior.
- Current support, historical behavior, and a proposed interface.

Do not assume two adapters behave alike because they share an interface. If the user remembers earlier behavior, inspect history before confirming or dismissing it. Correct an earlier explanation when the evidence changes it.

Stay in explanation and design mode during this walkthrough. A question such as "could we support this?" explores an option in this context. Do not turn it into a code change. An explicit implementation request changes the scope and takes priority.

## Explore alternatives through the example

When the user proposes a change, explain how it would affect the same example. Compare alternatives on observable behavior and the constraints that matter here. Check the implementation before claiming compatibility or feasibility. For external products, verify current behavior against their official documentation.

Follow consequences far enough to find material gaps. For stateful changes, these may include existing values, retries, partial failure, or concurrent writes. Avoid a generic risk checklist unrelated to the proposal.

Give a recommendation with its reason. Separate agreed decisions from open questions. Carry forward the user's corrections and constraints, including whether compatibility matters. Do not add compatibility scaffolding when the user has explicitly ruled it out.

## Capture the discussion when requested

Create a ticket, write a handoff prompt, or produce an implementation plan only when the user requests that deliverable. Do not create follow-up work automatically.

For a requested ticket, read `docs/agents/issue-tracker.md` first. Otherwise check `${XDG_CONFIG_HOME:-~/.config}/javan-skills/<host>/<owner>/<repo>/issue-tracker.md`, keyed by the repository's origin URL. If config is absent, say so, name the `setup-javan-skills` skill, and use the available project evidence. If the destination remains unknown, draft the ticket and ask where to publish it.

Check for existing related tickets before publishing. Make the ticket understandable without the conversation. Include:

- The current behavior and a concrete desired outcome.
- Agreed interface and behavior decisions, clearly separate from candidate designs.
- Relevant implementation findings and constraints, plus related tickets and architectural decisions.
- Observable acceptance criteria and useful verification scenarios.
- Remaining decisions, scope exclusions, and the requested deliverable.

An exploration ticket asks for a recommendation and concrete implementation plan. Do not present unresolved details as approved implementation decisions. A handoff prompt states the same scope and constraints so the next agent does not implement a planning-only task.

After publication, return the ticket link and a short account of its scope. Do not repeat the whole walkthrough.
