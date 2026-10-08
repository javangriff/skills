# Third-party login (Google and other identity providers)

Google, Microsoft, and most other identity providers refuse to sign in a browser
they detect as automated. The Playwright MCP server's default browser usually
fails that check. The server's launch flags are fixed when the harness starts
it, so a browser that cannot sign in stays that way until the user changes the
server configuration and restarts it.

## Contents

- Check whether sign-in already works
- Choose a route
- Route A: a dedicated Chrome profile over CDP (default)
- Route B: the user's own browser through the extension
- Route C: a saved session (storage state)
- Route D: no real sign-in, mock the session
- Redirect URI and port
- After testing

## Check whether sign-in already works

Do this before you ask the user to change anything. The server may already be
set up for it.

1. Navigate to the app's login page and click the provider's button.
2. Take a `browser_snapshot` of the provider's page.
3. Read the result:
   - **The provider's sign-in form, or an account picker:** sign-in can work.
     Ask the user to sign in by hand in the browser window, then wait for them
     to confirm. Continue with step 4 of the skill.
   - **"This browser or app may not be secure", "Couldn't sign you in", or a
     similar block:** the browser is detected as automated. Choose a route below.
   - **No visible window to sign in through** (the server runs `--headless`):
     the user cannot sign in by hand. Choose a route below.

## Choose a route

Stop and present the routes to the user. Do not edit the harness's MCP server
configuration yourself unless the user asks you to. It is the user's
configuration, and the change needs a restart that ends or interrupts this
session.

Recommend a route based on what the change needs:

| The change needs | Recommend |
| --- | --- |
| A real backend session, repeatable across runs | **A**, a dedicated Chrome profile over CDP |
| The account the user is already signed in to, in their own browser | **B**, the extension |
| A real session, but the browser must stay isolated and clean each run | **C**, a saved session |
| Only the UI behind the login, against mocked APIs | **D**, mock the session |

When the change does not touch auth and every API call in scope can be mocked,
recommend **D**. It needs no restart and no real account.

## Route A: a dedicated Chrome profile over CDP (default)

The user starts Chrome with a remote debugging port and a profile kept only for
testing. Google treats this as a normal browser, because the user launched it
and no automation flags are set. The profile keeps its sign-in between runs.

1. The user quits any Chrome that uses the same profile directory, then starts
   Chrome with a dedicated profile. Chrome refuses remote debugging on the
   default profile, so `--user-data-dir` is required:

   ```bash
   # macOS
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --remote-debugging-port=9222 \
     --user-data-dir="$HOME/.cache/playwright-signin-profile"

   # Linux
   google-chrome --remote-debugging-port=9222 \
     --user-data-dir="$HOME/.cache/playwright-signin-profile"
   ```

2. The user signs in to the app in that window, through the provider, once.
3. The user changes the Playwright MCP server's arguments to connect to it, then
   restarts the server:

   ```json
   "args": ["@playwright/mcp@latest", "--cdp-endpoint", "http://localhost:9222"]
   ```

4. Confirm with a `browser_snapshot` of the app that the session is signed in.

Port 9222 is the conventional debugging port. Any free port works if the Chrome
flag and the `--cdp-endpoint` value match.

## Route B: the user's own browser through the extension

The server connects to the user's running Chrome or Edge, where they are already
signed in. This needs the "Playwright Extension" (the server's `--help` names it so)
installed in that browser.

```json
"args": ["@playwright/mcp@latest", "--extension"]
```

Warn the user before they choose this route: you will act in their real browser,
with their real sessions. In this route, do not run probes that send real
messages, payments, or deletions. Do not close tabs you did not open.

## Route C: a saved session (storage state)

The app's own session cookie is what keeps the user signed in, not the
provider's. A file that holds the app's cookies and local storage signs the
browser in without touching the provider again, until the session expires.

1. The user signs in once, through Route A or B, or in any Playwright browser
   that the provider accepts.
2. Save the state with `browser_run_code_unsafe`:

   ```js
   async (page) => {
     await page.context().storageState({ path: '/absolute/path/to/auth-state.json' })
     return 'saved'
   }
   ```

3. The user starts the server isolated, with that state:

   ```json
   "args": ["@playwright/mcp@latest", "--isolated", "--storage-state", "/absolute/path/to/auth-state.json"]
   ```

The file holds live session tokens. Keep it outside the repo, and tell the user
where it is so they can delete it.

## Route D: no real sign-in, mock the session

Mock the endpoint the app asks "who am I?" (often `/me`, `/session`,
`/api/auth/session`, or a token refresh call) with `page.route()`, as shown in
`playwright-recipes.md`. The app then renders its signed-in states without a
provider. Name the endpoint you mocked in the report. Real auth behaviour such
as an expired token or a revoked session is then out of reach, unless you mock
it on purpose.

## Redirect URI and port

The provider sends the user back only to redirect URIs registered for the OAuth
client. The dev server port can drift between runs (step 2 of the skill), and a
drifted port fails sign-in with `redirect_uri_mismatch` or a similar error.
Find the port the client is registered for (a `.env` file, the auth
configuration, or the user) and start the dev server on that port.

## After testing

Say in the report which route you used. For Route A, the user can close the
debugging Chrome and keep the profile for next time. For Routes A, B, and C,
remind the user that the MCP server is still configured for that route, and say
what to remove to restore the default.
