export type LoadFlags = () => Promise<Record<string, boolean>>

export function createFlagClient(loadFlags: LoadFlags) {
  let flags: Record<string, boolean> | undefined

  return {
    async isEnabled(name: string): Promise<boolean> {
      flags ??= await loadFlags()
      return flags[name] ?? false
    },

    /** Exposed for tests. */
    _loadedFlags(): Record<string, boolean> | undefined {
      return flags
    },
  }
}
