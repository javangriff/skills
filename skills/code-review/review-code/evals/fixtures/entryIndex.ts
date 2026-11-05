import type { Entry } from './entry';
import { isWithin } from './helpers';

/**
 * Path-keyed lookup of registered entries.
 *
 * Entries can change path (see {@link EntryIndex.relocate}), so the index
 * also keeps a reverse map from entry to its current path. Anything that
 * needs "where does this entry live now" should ask {@link EntryIndex.pathOf}
 * rather than capturing a path at registration time.
 */
export class EntryIndex {
  private byPath: Record<string, Entry> = {};
  private readonly paths = new Map<Entry, string>();

  /** The entry registered at `path`, if any. */
  get(path: string): Entry | undefined {
    return this.byPath[path];
  }

  /** True when an entry is registered at `path`. */
  has(path: string): boolean {
    return path in this.byPath;
  }

  /** The current path of `entry`, or `undefined` once it has been removed. */
  pathOf(entry: Entry): string | undefined {
    return this.paths.get(entry);
  }

  /**
   * Registers `entry` at `path`.
   *
   * @throws when the path is taken or the entry is already registered elsewhere.
   */
  add(path: string, entry: Entry): void {
    if (this.has(path)) {
      throw new Error(`Entry already registered at "${path}"`);
    }
    if (this.paths.has(entry)) {
      throw new Error(`Entry is already registered at "${this.paths.get(entry)}"`);
    }
    this.byPath[path] = entry;
    this.paths.set(entry, path);
  }

  /** Removes and returns the entry at `path`. */
  remove(path: string): Entry | undefined {
    const entry = this.byPath[path];
    if (entry === undefined) return undefined;
    delete this.byPath[path];
    this.paths.delete(entry);
    return entry;
  }

  /** All registered paths, in registration order. */
  keys(): string[] {
    return Object.keys(this.byPath);
  }

  /** All registered entries. */
  values(): Entry[] {
    return this.keys().map((path) => this.byPath[path]);
  }

  /** `[path, entry]` pairs for every registered entry. */
  entries(): Array<[string, Entry]> {
    return this.keys().map((path) => [path, this.byPath[path]]);
  }

  /** Registered paths equal to or beneath `prefix`. */
  within(prefix: string): string[] {
    return this.keys().filter((path) => isWithin(path, prefix));
  }

  /**
   * Moves entries to new paths in one step. Every source is detached before
   * any destination is written, so swaps and rotations are safe.
   *
   * @param moves map of current path to new path.
   * @throws when a destination is occupied by an entry that is not itself moving.
   */
  relocate(moves: ReadonlyMap<string, string>): void {
    const moving: Array<[string, Entry]> = [];
    for (const [from, to] of moves) {
      const entry = this.byPath[from];
      if (entry === undefined) {
        throw new Error(`No entry registered at "${from}"`);
      }
      moving.push([to, entry]);
    }
    for (const from of moves.keys()) delete this.byPath[from];
    for (const [to] of moving) {
      if (this.has(to)) {
        throw new Error(`Cannot move an entry onto occupied path "${to}"`);
      }
    }
    for (const [to, entry] of moving) {
      this.byPath[to] = entry;
      this.paths.set(entry, to);
    }
  }

  /** Number of registered entries. */
  get size(): number {
    return this.paths.size;
  }
}
