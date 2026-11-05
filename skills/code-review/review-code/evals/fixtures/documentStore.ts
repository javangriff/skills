import { Entry } from './entry';
import { EntryIndex } from './entryIndex';
import {
  assertPermutation,
  cloneDeep,
  deleteIn,
  getIn,
  isWithin,
  joinPath,
  setIn,
  splitPath,
} from './helpers';
import type { CheckDocument, DocData, Issue } from './helpers';
import { DeclaredShape, routeToDeclared, routeToRegistered } from './issueRouting';
import type { RoutedIssues } from './issueRouting';
import { RunStamps } from './runStamps';
import { changedPaths, collectLocal, omitPaths, takeSnapshot } from './snapshot';
import type { Collect } from './snapshot';
import { SyncTracker } from './syncTracker';

const DOCUMENT_RUN = 'document';

/** Options for creating a {@link DocumentStore}. */
export interface DocumentStoreOptions {
  /** Starting document. Copied, never mutated. */
  initial?: DocData;
  /** Server check run by {@link DocumentStore.checkEntry} and {@link DocumentStore.checkAll}. */
  checkDocument: CheckDocument;
  /**
   * Path patterns the document may contain (`*` matches an array index).
   * When given, registering or writing an undeclared path throws.
   */
  declared?: readonly string[];
  /** Paths kept on the client and returned separately from the persisted document. */
  localOnly?: readonly string[];
  /** Receives errors from checks the store starts on its own. Defaults to `console.error`. */
  onCheckError?: (error: unknown) => void;
}

/** Options for {@link DocumentStore.setValue}. */
export interface SetValueOptions {
  /** Start a check for the entry at this path. Defaults to `true`. */
  check?: boolean;
  /** Mark the entry as touched. Defaults to `true`. */
  touch?: boolean;
}

/** Options for {@link DocumentStore.release}. */
export interface ReleaseOptions {
  /** Leave the value in the document after the entry is released. Defaults to `true`. */
  keepValue?: boolean;
}

/** Options for {@link DocumentStore.checkAll}. */
export interface CheckAllOptions {
  /** Builds the local-only part of the accepted payload. Defaults to picking `localOnly` paths. */
  collect?: Collect;
}

/** The payload a clean {@link DocumentStore.checkAll} vouches for. */
export interface AcceptedPayload {
  /** The checked document without local-only paths, ready to persist. */
  document: DocData;
  /** Local-only values, keyed by path. */
  local: Record<string, unknown>;
}

/** Result of {@link DocumentStore.checkAll}. */
export interface CheckAllResult {
  /** True when the server reported no issues and the result was published. */
  valid: boolean;
  /** True when a newer change superseded this run before it settled. */
  stale: boolean;
  /** Everything the server reported, unrouted. */
  issues: Issue[];
  /** Present only when `valid` is true. */
  accepted?: AcceptedPayload;
}

/**
 * Client-side cache for a collaboratively edited document.
 *
 * The store owns a plain document object. Callers register entries at paths
 * they edit; each entry mirrors its value into the document, and server
 * checks publish issues back onto entries.
 */
export class DocumentStore {
  private doc: DocData;
  private retained: RoutedIssues = new Map();
  private readonly index = new EntryIndex();
  private readonly detachers = new Map<Entry, () => void>();
  private readonly entryRuns = new RunStamps();
  private readonly documentRuns = new RunStamps();
  private readonly sync = new SyncTracker();
  private readonly shape: DeclaredShape | undefined;
  private readonly localOnly: readonly string[];
  private readonly checkDocument: CheckDocument;
  private readonly onCheckError: (error: unknown) => void;

  constructor(options: DocumentStoreOptions) {
    this.doc = cloneDeep(options.initial ?? {});
    this.checkDocument = options.checkDocument;
    this.shape = options.declared ? new DeclaredShape(options.declared) : undefined;
    this.localOnly = [...(options.localOnly ?? [])];
    this.onCheckError = options.onCheckError ?? ((error) => console.error(error));
  }

  /** A deep copy of the current document. */
  snapshot(): DocData {
    return takeSnapshot(this.doc);
  }

  /** True when `path` is allowed by the declared shape, or no shape is configured. */
  isDeclared(path: string): boolean {
    return this.shape ? this.shape.isDeclared(path) : true;
  }

  /** True when `path` is, or sits beneath, a local-only path. */
  isLocalOnly(path: string): boolean {
    return this.localOnly.some((localPath) => isWithin(path, localPath));
  }

  /** True when an entry is registered at `path`. */
  hasEntry(path: string): boolean {
    return this.index.has(path);
  }

  /** Registered paths, in registration order. */
  paths(): string[] {
    return this.index.keys();
  }

  /**
   * Registers a new entry at `path`, seeded from the document.
   *
   * @throws when the path is already registered or not declared.
   */
  register(path: string): Entry {
    this.assertDeclared(path);
    const entry = new Entry<unknown>(getIn(this.doc, splitPath(path)));
    this.index.add(path, entry);
    this.detachers.set(
      entry,
      entry.subscribe((value) => this.writeThrough(entry, value)),
    );
    return entry;
  }

  /** The entry at `path`, registering one if none exists yet. */
  getEntry(path: string): Entry {
    return this.index.get(path) ?? this.register(path);
  }

  /**
   * Writes `value` at `path`. When an entry is registered there the write
   * goes through the entry, so its subscribers see it; otherwise it goes
   * straight into the document and is covered by the next {@link checkAll}.
   */
  setValue(path: string, value: unknown, options: SetValueOptions = {}): void {
    const { check = true, touch = true } = options;
    this.assertDeclared(path);
    const entry = this.index.get(path);
    if (entry) {
      entry.set(value, { touch });
    } else {
      setIn(this.doc, splitPath(path), value);
    }
    if (!check) return;
    if (!this.isLocalOnly(path)) {
      // A document-wide result in flight now describes an older persisted document.
      this.documentRuns.invalidate(DOCUMENT_RUN);
    }
    if (entry) {
      this.checkEntry(path).catch(this.onCheckError);
    }
  }

  /**
   * Runs the server check and publishes the issues that belong to `path`.
   * A result is published only if no newer check for `path` started first.
   *
   * @returns the messages this run found for `path`.
   * @throws when no entry is registered at `path`.
   */
  async checkEntry(path: string): Promise<string[]> {
    const entry = this.index.get(path);
    if (!entry) throw new Error(`No entry registered at "${path}"`);
    const token = this.entryRuns.begin(path);
    const release = this.sync.mark([entry]);
    try {
      const issues = await this.checkDocument(takeSnapshot(this.doc));
      const own = routeToDeclared(issues, this.shape).get(path) ?? [];
      if (this.entryRuns.isCurrent(path, token)) entry.setIssues(own);
      return own;
    } finally {
      release();
    }
  }

  /**
   * Checks the whole document and publishes every issue: each registered
   * entry receives the issues routed to it, and issues with no registered
   * owner are retained until the next run.
   *
   * A clean result carries the accepted payload: the document that was
   * checked, minus local-only paths, plus the local-only values.
   */
  async checkAll(options: CheckAllOptions = {}): Promise<CheckAllResult> {
    const collect = options.collect ?? collectLocal(this.localOnly);
    const token = this.documentRuns.begin(DOCUMENT_RUN);
    const sent = takeSnapshot(this.doc);
    const release = this.sync.mark(this.index.values());
    try {
      const issues = await this.checkDocument(sent);
      if (!this.documentRuns.isCurrent(DOCUMENT_RUN, token)) {
        return { valid: false, stale: true, issues };
      }
      const { routed, unrouted } = routeToRegistered(issues, (p) => this.index.has(p));
      for (const [path, entry] of this.index.entries()) {
        entry.setIssues(routed.get(path) ?? []);
      }
      this.retained = unrouted;
      if (issues.length > 0) {
        return { valid: false, stale: false, issues };
      }
      return {
        valid: true,
        stale: false,
        issues,
        accepted: { document: omitPaths(sent, this.localOnly), local: collect(this.doc) },
      };
    } finally {
      release();
    }
  }

  /**
   * Issues currently shown for `path`: the entry's issues when one is
   * registered, otherwise whatever the last {@link checkAll} retained.
   */
  issuesFor(path: string): readonly string[] {
    const entry = this.index.get(path);
    if (entry) return entry.issues;
    return this.retained.get(path) ?? [];
  }

  /** Every path with at least one issue. Registered entries take precedence. */
  allIssues(): Map<string, readonly string[]> {
    const all = new Map<string, readonly string[]>(this.retained);
    for (const [path, entry] of this.index.entries()) {
      if (entry.issues.length > 0) {
        all.set(path, entry.issues);
      } else {
        all.delete(path);
      }
    }
    return all;
  }

  /** True when nothing currently reports an issue. */
  isClean(): boolean {
    return this.allIssues().size === 0;
  }

  /**
   * Reorders the array at `prefix`. `permutation[i]` is the old index of the
   * item that ends up at index `i`. Entries registered under moved items
   * follow their item to its new index, keeping their value and issues.
   */
  moveEntries(prefix: string, permutation: readonly number[]): void {
    const prefixSegments = splitPath(prefix);
    const list = getIn(this.doc, prefixSegments);
    if (!Array.isArray(list)) {
      throw new Error(`"${prefix}" is not a list`);
    }
    assertPermutation(permutation, list.length);

    const destination = new Map<number, number>();
    permutation.forEach((from, to) => destination.set(from, to));

    const moves = new Map<string, string>();
    const depth = prefixSegments.length;
    for (const path of this.index.within(prefix)) {
      const segments = splitPath(path);
      if (segments.length <= depth) continue;
      const to = destination.get(Number(segments[depth]));
      if (to === undefined || String(to) === segments[depth]) continue;
      segments[depth] = String(to);
      moves.set(path, joinPath(segments));
    }

    const reordered = permutation.map((from) => list[from]);
    const listEntry = this.index.get(prefix);
    if (listEntry) {
      listEntry.set(reordered);
    } else {
      setIn(this.doc, prefixSegments, reordered);
    }
    this.index.relocate(moves);

    // Retained paths under the list no longer line up; the next checkAll repopulates them.
    for (const path of [...this.retained.keys()]) {
      if (isWithin(path, prefix) && path !== prefix) this.retained.delete(path);
    }
    this.documentRuns.invalidate(DOCUMENT_RUN);
  }

  /**
   * Unregisters the entry at `path`. With `keepValue: false` the value is
   * also removed from the document. Removal waits a microtask so that a
   * release followed by re-registration in the same tick (a list re-render)
   * keeps its value.
   */
  release(path: string, options: ReleaseOptions = {}): void {
    const { keepValue = true } = options;
    const entry = this.index.remove(path);
    if (!entry) return;
    this.detachers.get(entry)?.();
    this.detachers.delete(entry);
    this.entryRuns.retire(path);
    if (keepValue) return;
    queueMicrotask(() => {
      if (!this.index.has(path)) deleteIn(this.doc, splitPath(path));
    });
  }

  /**
   * Replaces the document with `snapshot` and resets every entry to match.
   * All in-flight checks are superseded and published issues are cleared.
   */
  restore(snapshot: DocData): void {
    this.doc = cloneDeep(snapshot);
    this.entryRuns.clear();
    this.documentRuns.invalidate(DOCUMENT_RUN);
    this.retained = new Map();
    for (const [path, entry] of this.index.entries()) {
      entry.set(getIn(this.doc, splitPath(path)));
      entry.setIssues([]);
      entry.touched = false;
    }
  }

  /** Registered paths whose value differs from `baseline`. */
  changedSince(baseline: DocData): string[] {
    return changedPaths(baseline, this.doc, this.index.keys());
  }

  /** Registered paths the user has edited. */
  touchedPaths(): string[] {
    return this.index.entries().flatMap(([path, entry]) => (entry.touched ? [path] : []));
  }

  /** Releases every entry, keeping the document as it is. */
  dispose(): void {
    for (const path of this.index.keys()) this.release(path);
    this.retained = new Map();
  }

  private writeThrough(entry: Entry, value: unknown): void {
    const path = this.index.pathOf(entry);
    if (path === undefined) return;
    setIn(this.doc, splitPath(path), value);
  }

  private assertDeclared(path: string): void {
    if (!this.isDeclared(path)) {
      throw new Error(`"${path}" is not a declared document path`);
    }
  }
}
