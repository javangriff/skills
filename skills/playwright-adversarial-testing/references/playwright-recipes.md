# Playwright-MCP Recipes for Adversarial Testing

Concrete patterns for the Playwright MCP tools. Most adversarial states (errors,
races, server transitions) are unreachable by clicking alone — you reach them by
intercepting the network with `page.route()` inside `browser_run_code_unsafe`.

Every `browser_*` tool named here belongs to the **Playwright MCP server**. Harnesses prefix MCP tools with their server's name (`playwright:browser_navigate`, `mcp__playwright__browser_navigate`, or similar); call the tool under the Playwright server's prefix, not a same-named tool from another browser server.

## Table of contents

- [The core tool: `browser_run_code_unsafe`](#the-core-tool)
- [Sandbox gotchas](#sandbox-gotchas)
- [Mocking an API response](#mocking-an-api-response)
- [Stateful mocks (simulating a server)](#stateful-mocks)
- [Failure injection](#failure-injection)
- [Race conditions via delayed responses](#race-conditions-via-delayed-responses)
- [Proving a double-action with endpoint counting](#proving-a-double-action)
- [Dumping real DOM evidence](#dumping-real-dom-evidence)
- [Measuring layout overflow](#measuring-layout-overflow)
- [Resetting routes between scenarios](#resetting-routes-between-scenarios)
- [Which MCP tool for which job](#tool-cheat-sheet)

## The core tool

`browser_run_code_unsafe` runs a Playwright snippet with `page` in scope. This is
how you set up network interception, inject delays, drive multi-step flows, and
return structured evidence in one shot. Everything else (`browser_navigate`,
`browser_click`, `browser_snapshot`) is for simple steps once the mocks are in place.

Return a JSON string of observations so the result is greppable:

```js
async (page) => {
  // ... setup + drive ...
  return JSON.stringify({ whatHappened, evidence }, null, 2)
}
```

## Sandbox gotchas

- **`setTimeout` is NOT defined** in the snippet sandbox. To delay, use
  `await page.waitForTimeout(ms)` — including *inside* a route handler.
- `page.route()` registrations **persist across `page.goto()`** within the session.
  Reset them between unrelated scenarios (see [resetting](#resetting-routes-between-scenarios)).
- Register routes **before** the navigation that triggers the request, or set them
  up and `goto` in the same snippet.
- Match the API host/path with a glob, e.g. `'**/v3/market_email/status/**'`.

## Mocking an API response

Reach a state that needs a backend you can't satisfy (no valid token, record
doesn't exist, endpoint is authenticated). Fulfill the request yourself. Mirror
the app's real response envelope — many codebases wrap payloads (e.g.
`{ message, terms, data: {...} }`) and validate with a schema, so a bare object
may fail parsing and send you down the error path by accident.

```js
async (page) => {
  await page.route('**/api/v3/resource/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { companyName: 'Acme Pty Ltd', status: 'pending' } }),
    }))
  await page.goto('http://localhost:8182/some-page?token=abc')
  await page.waitForLoadState('networkidle').catch(() => {})
  return 'mocked'
}
```

## Stateful mocks

Simulate a server whose state changes after a write — essential for testing
accept→refetch, submit→reload, and similar transitions. Use a closure variable
that a POST handler flips, which the GET handler reads:

```js
async (page) => {
  let accepted = false
  await page.route('**/api/status/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: { status: accepted ? 'accepted' : 'pending' } }) }))
  await page.route('**/api/confirm/**', route => {
    accepted = true
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) })
  })
  await page.goto('http://localhost:8182/some-page?token=abc')
  await page.getByTestId('accept').click()
  await page.getByTestId('success-marker').waitFor({ timeout: 5000 })
  return 'accepted flow done'
}
```

## Failure injection

Make a call fail and watch the UI. Try each: server error, forbidden, malformed
body, and schema-violating body.

```js
// 500 server error
await page.route('**/api/confirm/**', route =>
  route.fulfill({ status: 500, contentType: 'application/json',
    body: JSON.stringify({ message: 'Internal Server Error' }) }))

// Network failure (DNS/connection level)
await page.route('**/api/confirm/**', route => route.abort('failed'))

// Malformed / non-JSON body — does the parser throw and white-screen?
await page.route('**/api/confirm/**', route =>
  route.fulfill({ status: 200, contentType: 'application/json', body: 'not json {' }))

// Schema-violating body — required field missing / wrong type
await page.route('**/api/status/**', route =>
  route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { status: 'some_unexpected_value' } }) }))
```

After triggering, check whether the action UI survived or got replaced by a
dead-end, and whether a retry path exists:

```js
const actionStillPresent = await page.getByTestId('submit').count()       // 0 ⇒ user is stranded
const errorShown = await page.getByText('Something went wrong').count()
```

## Race conditions via delayed responses

Widen the post-mutation refetch window by delaying the status GET that runs after
the write. While it's in flight, the UI often shows stale data with re-enabled
controls. Inspect the controls mid-window:

```js
async (page) => {
  let done = false
  await page.route('**/api/status/**', async route => {
    if (done) await page.waitForTimeout(2000)   // slow the post-write refetch
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: { status: done ? 'accepted' : 'pending' } }) })
  })
  await page.route('**/api/confirm/**', route => {
    done = true
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) })
  })
  await page.goto('http://localhost:8182/some-page?token=abc')
  await page.getByTestId('accept').click()
  await page.waitForTimeout(500)  // we're now inside the stale-data window
  return JSON.stringify({
    declineStillEnabled: await page.getByTestId('decline').isDisabled().then(d => !d).catch(() => 'gone'),
  }, null, 2)
}
```

## Proving a double-action

Don't just assert a button looks enabled — prove the consequence by counting which
endpoints actually fire. Push the opposite action during the stale window:

```js
async (page) => {
  let done = false
  const hits = []
  await page.route('**/api/status/**', async route => {
    if (done) await page.waitForTimeout(2000)
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: { status: done ? 'accepted' : 'pending' } }) })
  })
  await page.route('**/api/confirm/**', route => { done = true; hits.push('confirm')
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) }) })
  await page.route('**/api/reject/**', route => { hits.push('reject')
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) }) })
  await page.goto('http://localhost:8182/some-page?token=abc')
  await page.getByTestId('accept').click()
  await page.waitForTimeout(500)
  await page.getByTestId('reject').click({ timeout: 1500 }).catch(() => hits.push('reject-click-blocked'))
  await page.waitForTimeout(2500)
  return JSON.stringify({ endpointHits: hits }, null, 2)
  // BUG  → ['confirm','reject']            (contradictory double-action fired)
  // GOOD → ['confirm','reject-click-blocked']
}
```

## Dumping real DOM evidence

The accessibility snapshot can hide rendering bugs (e.g. an element present but
visually empty). Dump the real DOM to catch them:

```js
const html = await page.getByTestId('section').innerHTML()
const text = await page.getByTestId('section').innerText()  // what the user actually sees
return JSON.stringify({ html, text }, null, 2)
```

Example smoking gun: a list whose string items render as `<li><template></template></li>`
— `innerText` is empty even though the snapshot shows list items. (`h('template', str)`
in Vue puts text in the inert template `.content` fragment; it never displays.)

## Measuring layout overflow

Quantify overflow instead of guessing from a screenshot:

```js
const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
const clientW = await page.evaluate(() => document.documentElement.clientWidth)
const box = await page.getByTestId('card').boundingBox()
return JSON.stringify({ horizontalScroll: scrollW > clientW, cardWidth: box?.width }, null, 2)
```

Feed it a pathological value first:
`'Supercalifragilistic'.repeat(5)` for an unbroken string, or a 100-char email.

## Resetting routes between scenarios

```js
await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {})
```

Call this at the top of each new scenario snippet so stale handlers from the
previous test don't leak in.

## Tool cheat sheet

| Need | Playwright MCP tool |
| --- | --- |
| Set up mocks, delays, multi-step flows, return evidence | `browser_run_code_unsafe` |
| Go to a URL | `browser_navigate` |
| Confirm which state rendered (a11y tree) | `browser_snapshot` |
| Visual evidence of a state | `browser_take_screenshot` |
| Click / type a single step | `browser_click` / `browser_type` |
| Inspect console for real-vs-noise errors | `browser_console_messages` |
| Inspect/triage network calls | `browser_network_requests` |
| Test mobile layout | `browser_resize` |

Some harnesses defer MCP tool schemas until asked. If a tool above is not
callable yet, load it through the harness's tool search before the first call.
