import { ancestorPaths, isIndexSegment, joinPath, splitPath } from './helpers';
import type { Issue } from './helpers';

/** Issue messages grouped by the path they were routed to. */
export type RoutedIssues = Map<string, string[]>;

function generalise(segments: readonly string[]): string {
  return segments.map((segment) => (isIndexSegment(segment) ? '*' : segment)).join('.');
}

function append(target: RoutedIssues, path: string, message: string): void {
  const messages = target.get(path);
  if (messages) {
    messages.push(message);
  } else {
    target.set(path, [message]);
  }
}

/**
 * The set of paths a document is expected to contain, written as patterns
 * where `*` stands for any array index, e.g. `sections.*.body`.
 */
export class DeclaredShape {
  private readonly patterns: Record<string, true> = {};

  constructor(paths: readonly string[]) {
    for (const path of paths) {
      this.patterns[generalise(splitPath(path))] = true;
    }
  }

  /** True when `path` matches a declared pattern. */
  isDeclared(path: string): boolean {
    return this.matches(splitPath(path));
  }

  /** The deepest declared path at or above `segments`, if any. */
  nearestDeclared(segments: readonly string[]): string | undefined {
    for (let length = segments.length; length > 0; length--) {
      const candidate = segments.slice(0, length);
      if (this.matches(candidate)) return joinPath(candidate);
    }
    return undefined;
  }

  /** Number of declared patterns. */
  get size(): number {
    return Object.keys(this.patterns).length;
  }

  private matches(segments: readonly string[]): boolean {
    return generalise(segments) in this.patterns;
  }
}

/** Result of {@link routeToRegistered}. */
export interface RegisteredRouting {
  /** Messages keyed by the registered path that owns them. */
  routed: RoutedIssues;
  /** Messages with no registered owner, keyed by their own issue path. */
  unrouted: RoutedIssues;
}

/**
 * Routes each issue to the nearest registered path at or above it. An issue
 * on `projects.alpha.title` lands on `projects.alpha` when only the parent is
 * registered, so a whole-object editor still shows its children's problems.
 */
export function routeToRegistered(
  issues: readonly Issue[],
  isRegistered: (path: string) => boolean,
): RegisteredRouting {
  const routed: RoutedIssues = new Map();
  const unrouted: RoutedIssues = new Map();
  for (const issue of issues) {
    const owner = ancestorPaths(issue.path).find(isRegistered);
    if (owner === undefined) {
      append(unrouted, joinPath(issue.path), issue.message);
    } else {
      append(routed, owner, issue.message);
    }
  }
  return { routed, unrouted };
}

/**
 * Routes each issue to the nearest declared path at or above it. With no
 * shape configured, issues stay on their own path.
 */
export function routeToDeclared(
  issues: readonly Issue[],
  shape: DeclaredShape | undefined,
): RoutedIssues {
  const routed: RoutedIssues = new Map();
  for (const issue of issues) {
    const owner = shape?.nearestDeclared(issue.path) ?? joinPath(issue.path);
    append(routed, owner, issue.message);
  }
  return routed;
}

/** Total number of messages across a routing result. */
export function countMessages(routed: RoutedIssues): number {
  let total = 0;
  for (const messages of routed.values()) total += messages.length;
  return total;
}
