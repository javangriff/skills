/**
 * Shared types and path utilities for the document collaboration cache.
 *
 * Paths are dot-separated strings such as `projects.alpha.title` or
 * `sections.0.body`. Numeric segments address array positions.
 */

/** Plain, structured-clone-safe document data held by the store. */
export type DocData = Record<string, unknown>;

/** A problem reported by a server check, addressed by path segments. */
export interface Issue {
  path: string[];
  message: string;
}

/** Server-side check over a full document snapshot. */
export type CheckDocument = (snapshot: DocData) => Promise<Issue[]>;

const INDEX_SEGMENT = /^(0|[1-9]\d*)$/;

/**
 * Splits a dotted path into segments. The empty string is the document root.
 *
 * @throws when a segment would address an object's prototype slot.
 */
export function splitPath(path: string): string[] {
  if (path === '') return [];
  const segments = path.split('.');
  for (const segment of segments) {
    if (segment === '') {
      throw new Error(`Path "${path}" contains an empty segment`);
    }
    if (segment === '__proto__') {
      throw new Error(`Path "${path}" addresses a prototype slot`);
    }
  }
  return segments;
}

/** Joins segments back into a dotted path. */
export function joinPath(segments: readonly string[]): string {
  return segments.join('.');
}

/** True when the segment addresses an array position. */
export function isIndexSegment(segment: string): boolean {
  return INDEX_SEGMENT.test(segment);
}

/** True when `path` equals `prefix` or sits beneath it. */
export function isWithin(path: string, prefix: string): boolean {
  if (prefix === '') return true;
  return path === prefix || path.startsWith(`${prefix}.`);
}

/**
 * Lists `segments` and each of its ancestors as dotted paths, longest first.
 * The root is not included.
 */
export function ancestorPaths(segments: readonly string[]): string[] {
  const paths: string[] = [];
  for (let length = segments.length; length > 0; length--) {
    paths.push(joinPath(segments.slice(0, length)));
  }
  return paths;
}

/** True for objects and arrays. */
export function isContainer(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Reads the value at `segments`, or `undefined` when any step is missing. */
export function getIn(root: unknown, segments: readonly string[]): unknown {
  let current: unknown = root;
  for (const segment of segments) {
    if (!isContainer(current) || !Object.hasOwn(current, segment)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

/**
 * Writes `value` at `segments`, creating intermediate containers. A missing
 * container becomes an array when the next segment is numeric.
 */
export function setIn(root: DocData, segments: readonly string[], value: unknown): void {
  if (segments.length === 0) {
    throw new Error('setIn requires a non-empty path');
  }
  let current: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    let next = Object.hasOwn(current, segment) ? current[segment] : undefined;
    if (!isContainer(next)) {
      next = isIndexSegment(segments[i + 1]) ? [] : {};
      current[segment] = next;
    }
    current = next as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
}

/**
 * Removes the value at `segments`. Returns whether anything was removed.
 * Array slots are cleared to `undefined` so sibling indices stay stable.
 */
export function deleteIn(root: DocData, segments: readonly string[]): boolean {
  if (segments.length === 0) return false;
  const parent = getIn(root, segments.slice(0, -1));
  const last = segments[segments.length - 1];
  if (!isContainer(parent) || !Object.hasOwn(parent, last)) return false;
  if (Array.isArray(parent)) {
    parent[Number(last)] = undefined;
  } else {
    delete parent[last];
  }
  return true;
}

/** Deep copy of plain document data. */
export function cloneDeep<T>(value: T): T {
  return structuredClone(value);
}

/** Order-sensitive equality for issue message lists. */
export function sameMessages(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((message, i) => message === b[i]);
}

/**
 * Validates that `permutation` reorders exactly `length` items.
 *
 * @throws when an index is missing, repeated or out of range.
 */
export function assertPermutation(permutation: readonly number[], length: number): void {
  if (permutation.length !== length) {
    throw new Error(`Permutation has ${permutation.length} items, expected ${length}`);
  }
  const seen = new Set<number>();
  for (const from of permutation) {
    if (!Number.isInteger(from) || from < 0 || from >= length || seen.has(from)) {
      throw new Error(`Invalid permutation [${permutation.join(', ')}]`);
    }
    seen.add(from);
  }
}
