import { describe, expect, it } from 'vitest';
import { hookBumPath, needsRepoint, isTracked } from '../src/usage/tracking';

const UNIX = '{ "/home/u/.vscode/extensions/bumkom.claude-usage-0.1.0-linux-x64/bin/linux-x64/bum" statusline --tee 2>/dev/null || cat; } | { npx ccstatusline; }';
const WIN = '"C:\\Users\\u\\.vscode\\extensions\\bumkom.claude-usage-0.1.0-win32-x64\\bin\\win32-x64\\bum.exe" statusline --tee | ( npx ccstatusline )';

describe('hookBumPath', () => {
  it('is the quoted bum the hook runs, on Unix and Windows', () => {
    expect(hookBumPath(UNIX)).toBe('/home/u/.vscode/extensions/bumkom.claude-usage-0.1.0-linux-x64/bin/linux-x64/bum');
    expect(hookBumPath(WIN)).toBe('C:\\Users\\u\\.vscode\\extensions\\bumkom.claude-usage-0.1.0-win32-x64\\bin\\win32-x64\\bum.exe');
    expect(hookBumPath('"/usr/bin/bum" statusline --around \'x\'')).toBe('/usr/bin/bum');
  });

  it('is null for a hand-written `bum statusline` or a custom command', () => {
    expect(hookBumPath('bum statusline --tee | cat')).toBeNull();
    expect(hookBumPath('npx ccstatusline')).toBeNull();
  });
});

describe('needsRepoint', () => {
  const ours = '/home/u/.vscode/extensions/bumkom.claude-usage-0.2.0-linux-x64/bin/linux-x64/bum';
  const hooked = (command: string) => ({ kind: 'hooked' as const, command, show: false });

  it('a hook whose bum is gone (the extension was updated) is set up again with ours', () => {
    expect(needsRepoint(hooked(UNIX), ours, () => false)).toBe(true);
  });

  it('leaves a hook alone when its bum still exists: it may be the app\'s /usr/bin/bum', () => {
    expect(needsRepoint(hooked('"/usr/bin/bum" statusline --tee 2>/dev/null || cat; } | { x; }'), ours, () => true)).toBe(false);
  });

  it('leaves hooks that already use ours, hand-written ones, and no hook at all', () => {
    expect(needsRepoint(hooked(`{ "${ours}" statusline --tee 2>/dev/null || cat; } | { x; }`), ours, () => false)).toBe(false);
    expect(needsRepoint(hooked('bum statusline --tee | cat'), ours, () => false)).toBe(false);
    expect(needsRepoint({ kind: 'not_configured' }, ours, () => false)).toBe(false);
    expect(needsRepoint({ kind: 'custom', command: 'x' }, ours, () => false)).toBe(false);
  });
});

describe('isTracked', () => {
  it('only a Bumeter hook records the 5h/7d numbers', () => {
    expect(isTracked({ kind: 'hooked', command: UNIX, show: true })).toBe(true);
    expect(isTracked({ kind: 'custom', command: 'npx ccstatusline' })).toBe(false);
    expect(isTracked({ kind: 'not_configured' })).toBe(false);
    expect(isTracked(null)).toBe(false);
  });
});
