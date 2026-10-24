// Claude Code Usage gets the 5h/7d numbers from Claude Code's statusLine hook, which `bum` sets up
// (`settings:statusline_*`). The hook names the `bum` it runs; ours lives in the extension folder,
// whose path changes with every version.

/** `settings:get` → `statusline`, as `bum` reports it. */
export type StatuslineStatus =
  | { kind: 'not_configured' }
  | { kind: 'custom'; command: string }
  | { kind: 'hooked'; command: string; show: boolean };

/** The quoted `bum` a Bumeter hook runs (`"<bum>" statusline …`), or null. */
export function hookBumPath(command: string): string | null {
  const m = /"([^"]+)"\s+statusline\b/.exec(command);
  return m ? m[1] : null;
}

/** Only a Bumeter hook records the numbers. */
export function isTracked(s: StatuslineStatus | null | undefined): boolean {
  return s?.kind === 'hooked';
}

/**
 * The hook runs a `bum` that no longer exists (this extension was updated or moved): set it up again
 * with ours. A `bum` that still exists is left alone: it may be the app's, or another editor's.
 */
export function needsRepoint(s: StatuslineStatus, ours: string, exists: (p: string) => boolean): boolean {
  if (s.kind !== 'hooked') return false;
  const p = hookBumPath(s.command);
  return p !== null && p !== ours && !exists(p);
}
