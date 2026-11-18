import * as sessionModule from './session'
import { createSessionStore, type Session } from './session'

const session: Session = { userId: 'u1', expiresAt: 1_700_000_000 }

test('returns the fetched session', async () => {
  const store = createSessionStore(async () => session)

  expect(await store.get('token-a')).toEqual(session)
})

test('resolves to the session from fetchSession', async () => {
  const store = createSessionStore(async () => session)

  await expect(store.get('token-a')).resolves.toEqual(session)
})

test('session has a string user id', async () => {
  const store = createSessionStore(async () => session)

  const result = await store.get('token-a')

  expect(typeof result.userId).toBe('string')
})

test('caches the session after the first fetch', async () => {
  const store = createSessionStore(async () => session)

  await store.get('token-a')

  expect(store._size()).toBe(1)
})

test('fetches once for repeated calls with the same token', async () => {
  const fetchSession = vi.fn(async () => session)
  const store = createSessionStore(fetchSession)

  await store.get('token-a')
  await store.get('token-a')

  expect(fetchSession).toHaveBeenCalledTimes(1)
})

test('fetches separately for different tokens', async () => {
  const fetchSession = vi.fn(async (token: string) => ({ ...session, userId: token }))
  const store = createSessionStore(fetchSession)

  expect((await store.get('token-a')).userId).toBe('token-a')
  expect((await store.get('token-b')).userId).toBe('token-b')
})

test('the legacy session helper has been removed', () => {
  expect('getLegacySession' in sessionModule).toBe(false)
})
