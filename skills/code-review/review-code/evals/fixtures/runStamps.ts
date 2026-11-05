/**
 * Issues tokens for async runs so a run can tell, when it settles, whether a
 * newer run for the same key has started since.
 *
 * Tokens come from one counter shared by every key and never repeat, so a
 * token is only ever current for the run that received it.
 */
export class RunStamps {
  private next = 0;
  private readonly current = new Map<string, number>();
  private readonly retiring = new Map<string, number>();
  private sweepScheduled = false;

  /** Starts a run for `key`, superseding any run already in flight for it. */
  begin(key: string): number {
    const token = ++this.next;
    this.current.set(key, token);
    return token;
  }

  /** True when `token` belongs to the latest run started for `key`. */
  isCurrent(key: string, token: number): boolean {
    return this.current.get(key) === token;
  }

  /** Supersedes any run in flight for `key` without starting a new one. */
  invalidate(key: string): void {
    if (this.current.has(key)) this.current.set(key, ++this.next);
  }

  /** Supersedes every run in flight. */
  clear(): void {
    this.current.clear();
  }

  /**
   * Supersedes any run for `key` now and forgets the key on the next
   * microtask. Retiring is batched so releasing many keys costs one sweep.
   * A key that is begun again before the sweep keeps its new stamp.
   */
  retire(key: string): void {
    const token = ++this.next;
    this.current.set(key, token);
    this.retiring.set(key, token);
    if (this.sweepScheduled) return;
    this.sweepScheduled = true;
    queueMicrotask(() => this.sweep());
  }

  /** Number of keys with a live stamp. */
  get size(): number {
    return this.current.size;
  }

  private sweep(): void {
    this.sweepScheduled = false;
    for (const [key, token] of this.retiring) {
      if (this.current.get(key) === token) this.current.delete(key);
    }
    this.retiring.clear();
  }
}
