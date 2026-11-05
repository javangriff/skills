import { cloneDeep, deleteIn, getIn, splitPath } from './helpers';
import type { DocData } from './helpers';

/**
 * Builds the local-only part of an accepted payload from document data.
 * Receives document data and returns values keyed by path.
 */
export type Collect = (data: DocData) => Record<string, unknown>;

/** A deep copy of `doc`, safe to hand to async work. */
export function takeSnapshot(doc: DocData): DocData {
  return cloneDeep(doc);
}

/** A deep copy of `data` with each of `paths` removed. */
export function omitPaths(data: DocData, paths: readonly string[]): DocData {
  const copy = cloneDeep(data);
  for (const path of paths) deleteIn(copy, splitPath(path));
  return copy;
}

/**
 * Copies the values at `paths` out of `data`, keyed by path. Paths with no
 * value are left out rather than reported as `undefined`.
 */
export function pickPaths(data: DocData, paths: readonly string[]): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const path of paths) {
    const value = getIn(data, splitPath(path));
    if (value !== undefined) picked[path] = cloneDeep(value);
  }
  return picked;
}

/** The default {@link Collect}: picks the given local-only paths. */
export function collectLocal(paths: readonly string[]): Collect {
  return (data) => pickPaths(data, paths);
}

/**
 * Paths among `paths` whose value differs between `before` and `after`.
 * Values are compared structurally.
 */
export function changedPaths(
  before: DocData,
  after: DocData,
  paths: readonly string[],
): string[] {
  return paths.filter((path) => {
    const segments = splitPath(path);
    return !structurallyEqual(getIn(before, segments), getIn(after, segments));
  });
}

function structurallyEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  const bKeys = Object.keys(bRecord);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key) => Object.hasOwn(bRecord, key) && structurallyEqual(aRecord[key], bRecord[key]),
  );
}
