import { sameMessages } from './helpers';

/** Called synchronously after an entry's value changes. */
export type EntryListener<T> = (value: T) => void;

/** Called synchronously after an entry's issues change. */
export type IssueListener = (issues: readonly string[]) => void;

/** An entry-scoped async check over the entry's own value. */
export type LocalCheck<T> = (value: T) => Promise<string[]>;

/** Options for {@link Entry.set}. */
export interface EntrySetOptions {
  /** Mark the entry as touched by the user. Defaults to `false`. */
  touch?: boolean;
}

/**
 * A single cached value with the issues last published for it and its sync
 * state.
 *
 * Both local checks ({@link Entry.check}) and store checks publish to
 * `issues`; whichever settles last for the current value is what readers see.
 */
export class Entry<T = unknown> {
  /** Messages last published for this entry. */
  issues: readonly string[] = [];

  /** True while a check covering this entry is in flight. */
  syncing = false;

  /** True once the user has edited this entry. */
  touched = false;

  private current: T;
  private revision = 0;
  private localChecks = 0;
  private readonly valueListeners = new Set<EntryListener<T>>();
  private readonly issueListeners = new Set<IssueListener>();

  constructor(initial: T) {
    this.current = initial;
  }

  /** The entry's current value. */
  get value(): T {
    return this.current;
  }

  /** Increments on every value change; lets callers detect intervening writes. */
  get version(): number {
    return this.revision;
  }

  /**
   * Replaces the value and notifies subscribers. Writing the same value
   * (by `Object.is`) is a no-op apart from the touch flag.
   */
  set(value: T, options: EntrySetOptions = {}): void {
    if (options.touch) this.touched = true;
    if (Object.is(value, this.current)) return;
    this.current = value;
    this.revision++;
    for (const listener of [...this.valueListeners]) listener(value);
  }

  /** Replaces the published issues, notifying only when they differ. */
  setIssues(next: readonly string[]): void {
    if (sameMessages(this.issues, next)) return;
    this.issues = [...next];
    for (const listener of [...this.issueListeners]) listener(this.issues);
  }

  /** Subscribes to value changes. Returns an unsubscribe function. */
  subscribe(listener: EntryListener<T>): () => void {
    this.valueListeners.add(listener);
    return () => {
      this.valueListeners.delete(listener);
    };
  }

  /** Subscribes to issue changes. Returns an unsubscribe function. */
  subscribeIssues(listener: IssueListener): () => void {
    this.issueListeners.add(listener);
    return () => {
      this.issueListeners.delete(listener);
    };
  }

  /**
   * Runs `validate` against the current value and publishes its result,
   * unless the value changed while it ran. Overlapping local checks are
   * counted so `syncing` stays true until the last one settles.
   *
   * @returns the messages `validate` produced, whether or not they were published.
   */
  async check(validate: LocalCheck<T>): Promise<string[]> {
    const revision = this.revision;
    const checked = this.current;
    this.localChecks++;
    this.syncing = true;
    try {
      const messages = await validate(checked);
      if (this.revision === revision) this.setIssues(messages);
      return messages;
    } finally {
      this.localChecks--;
      this.syncing = this.localChecks > 0;
    }
  }

  /** Drops all listeners. The entry keeps its last value and issues. */
  dispose(): void {
    this.valueListeners.clear();
    this.issueListeners.clear();
  }
}
