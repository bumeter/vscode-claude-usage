import { describe, expect, it } from 'vitest';
import { usageOptions } from '../src/options';

describe('usageOptions', () => {
  it('before the hook: the item asks to set up, and the tooltip links to it', () => {
    const o = usageOptions(false, 'en');
    expect(o.fallback).toBe('5h/7d: set up');
    expect(o.noLimits).toContain('Click to set up quota tracking');
    expect(o.links.map((l) => l.command)).toEqual(['claudeUsage.open', 'claudeUsage.setupTracking', 'claudeUsage.refresh', 'claudeUsage.chooseStyle', 'claudeUsage.getFull']);
  });

  it('after the hook: it waits for Claude Code\'s next reply and no longer offers to set up', () => {
    const o = usageOptions(true, 'en');
    expect(o.noLimits).toContain('next reply');
    expect(o.links.map((l) => l.command)).not.toContain('claudeUsage.setupTracking');
  });

  it('never uses Bumeter\'s ids, so both can be installed side by side', () => {
    const o = usageOptions(false, 'en');
    expect(o.id).not.toBe('bumeter.status');
    expect([o.click, ...o.links.map((l) => l.command)].every((c) => c.startsWith('claudeUsage.'))).toBe(true);
  });

  it('a click opens the Usage view; the tooltip has a title, colours and the extra lines', () => {
    const o = usageOptions(true, 'en', undefined, () => 'more');
    expect(o.click).toBe('claudeUsage.open');
    expect(o.title).toBe('Claude Code Usage');
    expect(o.html).toBe(true);
    expect(o.extra?.()).toBe('more');
    expect(o.links[0]).toEqual({ label: 'Open Usage', command: 'claudeUsage.open' });
  });
});
