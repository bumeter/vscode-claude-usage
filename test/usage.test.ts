import { describe, expect, it } from 'vitest';
import { usageOptions } from '../src/usage/extension';

describe('usageOptions', () => {
  it('before the hook: the item asks to set up, and the tooltip links to it', () => {
    const o = usageOptions(false);
    expect(o.fallback).toBe('5h/7d: set up');
    expect(o.noLimits).toBe('usageSetup');
    expect(o.links.map((l) => l.command)).toEqual(['claudeUsage.setupTracking', 'claudeUsage.refresh', 'claudeUsage.getFull']);
  });

  it('after the hook: it waits for Claude Code\'s next reply and no longer offers to set up', () => {
    const o = usageOptions(true);
    expect(o.noLimits).toBe('usageWaiting');
    expect(o.links.map((l) => l.command)).not.toContain('claudeUsage.setupTracking');
  });

  it('never uses Bumeter\'s ids, so both can be installed side by side', () => {
    const o = usageOptions(false);
    expect(o.id).not.toBe('bumeter.status');
    expect([o.click, ...o.links.map((l) => l.command)].every((c) => c.startsWith('claudeUsage.'))).toBe(true);
  });
});
