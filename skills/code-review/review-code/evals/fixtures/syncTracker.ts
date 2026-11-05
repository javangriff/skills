import type { Entry } from './entry';

/**
 * Marks entries as syncing for the lifetime of a store-level check.
 *
 * Marks are counted per entry, so when two store checks cover the same entry
 * it stays syncing until both have released.
 */
export class SyncTracker {
  private readonly holds = new Map<Entry, number>();

  /**
   * Marks `entries` syncing. The returned function releases this mark and is
   * safe to call more than once.
   */
  mark(entries: Iterable<Entry>): () => void {
    const marked = [...new Set(entries)];
    for (const entry of marked) {
      this.holds.set(entry, (this.holds.get(entry) ?? 0) + 1);
      entry.syncing = true;
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      for (const entry of marked) this.drop(entry);
    };
  }

  /** True while at least one store check holds `entry`. */
  isHeld(entry: Entry): boolean {
    return this.holds.has(entry);
  }

  /** Number of entries currently held. */
  get size(): number {
    return this.holds.size;
  }

  private drop(entry: Entry): void {
    const remaining = (this.holds.get(entry) ?? 1) - 1;
    if (remaining > 0) {
      this.holds.set(entry, remaining);
      return;
    }
    this.holds.delete(entry);
    entry.syncing = false;
  }
}
