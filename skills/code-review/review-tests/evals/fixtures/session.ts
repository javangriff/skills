export type Session = { userId: string; expiresAt: number }

export type FetchSession = (token: string) => Promise<Session>

export function createSessionStore(fetchSession: FetchSession) {
  const cache = new Map<string, Session>()

  return {
    async get(token: string): Promise<Session> {
      const cached = cache.get(token)
      if (cached) return cached

      const session = await fetchSession(token)
      cache.set(token, session)
      return session
    },

    /** Exposed for tests. */
    _size(): number {
      return cache.size
    },
  }
}
