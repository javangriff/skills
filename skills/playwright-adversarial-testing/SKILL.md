---
name: playwright-adversarial-testing
description: Drive a running app with Playwright to adversarially test the changes on a branch/PR/diff — hunt for edge cases, failure paths, race conditions, and UX problems a happy-path demo would miss. Use whenever the user wants to adversarially test, stress-test, "try to break", or find edge cases / poor-UX scenarios in frontend changes via a real browser, or asks to test/verify a branch's UI changes in Playwright. Reach for this even when they just say "test my changes in the browser" or "find issues with this PR's UI".
---

# Playwright Adversarial Testing

Drive the **real running app** in a browser and actively try to break the changes on the current branch. The goal is not to confirm the happy path works — it's to find the edge cases, failure modes, and rough edges that ship to users when nobody pushed on them.

You are the only reviewer who actually *runs* the thing. A clean demo proves the author's intended path works. Your value is everything they didn't try.

## Mindset

- **Confirming is step one, not the job.** Once a state renders correctly, immediately ask "how do I make this break?" — then go do it.
- **Probe at the same surface a user touches.** Click the button, don't call the function. Bugs live in the seams between pieces that each pass in isolation.
- **Evidence over impression.** A snapshot showing text is weaker than dumping `innerText`/`innerHTML` and reading the actual DOM. Capture the raw output; your memory and the a11y tree both lie by omission.
- **Lower the bar for "worth mentioning".** Not just bugs — friction, surprises, a confusing transient state, an odd default. If it made you pause, it's a finding.

## Workflow

The browser tools named below (`browser_navigate`, `browser_snapshot`, and the rest) are the **Playwright MCP server's** tools. Call them under that server's prefix in your harness, not a same-named tool from another browser server.

Copy this checklist and tick it off as you go:

```
Adversarial test progress:
- [ ] 1. Scope: read every changed file, list states, inputs, async actions
- [ ] 2. App running, port read from the log
- [ ] 3. Sign-in path checked: third-party login works in this browser, or the user chose another route
- [ ] 4. Every state renders (mock the backend where needed)
- [ ] 5. Adversarial probes the change points at
- [ ] 6. Console and network triaged: change errors vs ambient noise
- [ ] 7. Report written
- [ ] 8. Dev server killed, artifacts removed
```

### 1. Establish scope — what actually changed

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git log --oneline "$base"..HEAD        # commits on the branch
git diff "$base"...HEAD --stat         # files touched
```

Read **every** changed component, page, query, and mutation. You can't adversarially test what you don't understand. As you read, build a mental (or written) list of:

- **Every UI state the code can render.** For a page driven by `status`/`if`/`switch`, enumerate each branch: loading, empty/invalid input, error, and each success variant. This list *is* your test matrix — each state is a render to verify, and each transition between states is a race to probe.
- **Every input the code trusts.** Query params, props, API response fields rendered into the DOM. Each is an injection point for boundary values.
- **Every async action and what it depends on.** Mutations, refetches, cache invalidation. These are where races hide.

### 2. Get the app running

If the repo or harness has its own skill for launching the app, use its launch recipe. Otherwise find the dev command (`package.json` scripts, an Nx or Turbo target), start it in the background, and read the port from its log — don't assume it (Vite picks the next free port, so it drifts between runs). Poll for the port rather than sleeping a fixed time, since startup time varies by machine and cache state:

```bash
log=$(mktemp)
(<dev command, e.g. nx dev app or npm run dev> > "$log" 2>&1 &)
for _ in $(seq 60); do                # give up after about a minute
  port=$(grep -oE 'localhost:[0-9]+' "$log" | head -1) && [ -n "$port" ] && break
  sleep 1
done
echo "${port:-no port found, see $log}"
```

### 3. Check the sign-in path

Before testing anything behind a login, find out how the app signs users in. Search the repo for a third-party identity provider:

```bash
git grep -nIiE 'accounts\.google\.com|gsi/client|GoogleAuthProvider|signInWithPopup|signInWithRedirect|oauth2|openid|oidc|@auth0|msal|okta|keycloak|cognito|next-auth|@auth/|passport-google|sign in with (google|microsoft|github|apple)' \
  -- ':!*.lock' ':!*lock.json' | head -20
```

Then open the login page in the browser and look for a "Sign in with …" button or a redirect to the provider's domain.

**No third-party login** (a username and password form, or no auth at all): continue to step 4.

**Third-party login found:** Google and most other providers refuse to sign in a browser they detect as automated, with a message such as "This browser or app may not be secure". The browser the Playwright MCP server launches by default usually fails this check, and you cannot relaunch the server from inside the session. Read `references/third-party-login.md` and follow it. It covers how to test whether sign-in works in the current browser, the ways to relaunch the server so it does, and the alternatives to a real sign-in.

Never type the user's credentials yourself, and never ask for them. The user signs in by hand, in the browser window the server opens.

### 4. Verify each state renders

Walk your state list from step 1, signed in by the route step 3 settled. For states reachable by URL alone (missing params, bad route), just `browser_navigate`. For states behind a backend you can't satisfy (you have no valid token, the record doesn't exist, the API is auth'd), **mock the backend** — this is the core technique, see `references/playwright-recipes.md`.

After each navigation, take a `browser_snapshot` to confirm the right branch rendered, and for anything subtle dump the actual DOM text/HTML. Screenshot the states a reviewer would want to see.

### 5. Push on it — the adversarial pass

This is where the value is. Pick the probes the change points at; don't run all of them mechanically. For each, capture what you observed even when it holds — "🔍 500 on submit → clean inline error, buttons stay" tells the author what's covered.

- **Failure injection.** Make each network call fail: `500`, `403`, network error, timeout, **malformed/empty body**, a response that violates the schema. Watch what the UI does. Common finds: a transient error replaces the whole view with a dead-end (no retry); an error is swallowed silently; a schema mismatch throws and white-screens.
- **Race conditions & transitions.** Delay a response to widen the window (see recipes). Classic bug: after a mutation resolves, the UI re-enables actions *before* the refetch lands, so stale data is showing with live buttons — the user can fire a second, contradictory action. Prove it by counting which endpoints actually got hit.
- **Double-action / idempotency.** Double-click submit. Click during pending. Click the *opposite* action mid-transition. Fire the same action twice. Does the UI guard it, or does the server get two calls?
- **Boundary inputs.** Render-into-DOM fields with: a very long unbroken string (overflow/clipping), an empty string (does `{{ name }}` leave a dangling label?), unicode/emoji/RTL, and an XSS probe like `<img src=x onerror=alert(1)>` (confirm it renders as text, never executes). Measure overflow with `boundingBox`/`scrollWidth` vs `clientWidth` rather than eyeballing.
- **Persistence & multiplicity.** Reload mid-flow. Browser back/forward. Do the action, then reload — is the new state reflected? Open the flow in two tabs.
- **Viewport.** `browser_resize` to a phone width (e.g. 375px) and re-check layout for the states that matter.

### 6. Separate signal from noise

Read the console (`browser_console_messages`) and network. But **distinguish the change's errors from ambient noise** — third-party widgets (chat, analytics, Sentry), CORS in dev, devtools sandbox warnings are usually pre-existing environment noise, not your finding. Call them out as noise so the author isn't misled, but don't bury a real error under them. A genuinely new console error or failed request caused by the change *is* a finding.

### 7. Report

Lead with a verdict, then steps, then findings ordered by severity. For each real issue: what the user does, what happens, why (point at `file:line` and the root cause), and a suggested fix. Mark probes that held too — coverage the author can't see from a green demo. Flag claim/diff mismatches and any path you couldn't exercise (e.g. a live destructive action) and why.

### 8. Clean up

Kill the dev server you started (`pkill -f` on its command), remove screenshot artifacts you created, and note any leftover (e.g. `.playwright-mcp/`). Leave the working tree as you found it.

## A note on fixing

If asked to fix what you found: fix the root cause, then **re-verify in the browser** by re-running the exact scenario that exposed the bug (e.g. the same delayed-refetch race) and show the before/after — `['confirm','reject']` becoming `['confirm','blocked']` is proof; a passing unit test is not. Unit tests can pass under jsdom while the real browser fails (e.g. `<template>` text renders in jsdom but is inert in a real DOM), which is exactly why this skill drives the real thing.

## Recipes

Concrete Playwright-MCP code for mocking, stateful backends, delays, race detection, overflow measurement, and sandbox gotchas (e.g. `setTimeout` is undefined — use `page.waitForTimeout`) live in `references/playwright-recipes.md`. Read it before step 4 — most adversarial scenarios are unreachable without these patterns.
