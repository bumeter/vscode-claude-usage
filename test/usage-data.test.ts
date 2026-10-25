import { describe, expect, it } from 'vitest';
import { burnRate, chartDays, compare, dayKey, isRange, lastDays, modelParts, projectParts, rangeStart, shortProject, sum } from '../src/usage';
import type { DayStat, PromptRow } from '../src/usage';

// Noon local time, so day boundaries do not depend on the machine's zone.
const NOW = new Date(2026, 9, 25, 12, 0, 0).getTime();
const day = (back: number, tokens: number, prompts = 1, cost = 1): DayStat => {
  const d = new Date(NOW); d.setDate(d.getDate() - back);
  return { day: dayKey(d), from: '', to: '', tokens, prompts, cost_usd: cost };
};

describe('ranges', () => {
  it('start at local midnight of the first day', () => {
    expect(rangeStart('today', NOW)).toEqual(new Date(2026, 9, 25));
    expect(rangeStart('7d', NOW)).toEqual(new Date(2026, 9, 19));
    expect(rangeStart('7d', NOW, 1)).toEqual(new Date(2026, 9, 12));
    expect(rangeStart('30d', NOW)).toEqual(new Date(2026, 8, 26));
    expect(isRange('7d')).toBe(true);
    expect(isRange('week')).toBe(false);
  });

  it('fill missing days with zero, oldest first', () => {
    const days = lastDays([day(0, 5), day(2, 7)], 3, NOW);
    expect(days.map((d) => d.tokens)).toEqual([7, 0, 5]);
    expect(lastDays([day(3, 9)], 3, NOW, 1).map((d) => d.tokens)).toEqual([0, 0, 9]);
  });

  it('compare this range with the one before', () => {
    const days = [day(0, 300, 3, 3), day(1, 100), day(7, 200, 2, 2)];
    const c = compare(days, '7d', NOW);
    expect(c.cur).toEqual({ tokens: 400, prompts: 4, cost: 4 });
    expect(c.prev).toEqual({ tokens: 200, prompts: 2, cost: 2 });
    expect(c.change).toBe(1);
    expect(compare([day(0, 5)], 'today', NOW).change).toBeNull();
    expect(sum([])).toEqual({ tokens: 0, prompts: 0, cost: 0 });
  });

  it('chart 7 columns for Today and 7 days, 30 for 30 days', () => {
    expect(chartDays([], 'today', NOW)).toHaveLength(7);
    expect(chartDays([], '7d', NOW)).toHaveLength(7);
    expect(chartDays([], '30d', NOW)).toHaveLength(30);
  });
});

describe('burn rate', () => {
  const row = (tool: string, minsAgo: number, tokens: number): PromptRow => ({
    stats: { tool, ts: new Date(NOW - minsAgo * 60_000).toISOString(), usage: { input: tokens, cache_write_5m: 0, cache_write_1h: 0, cache_read: 0, output: 0 } },
  });
  it('counts Claude Code prompts of the last 30 minutes, per hour', () => {
    expect(burnRate([row('claude_code', 5, 1_000), row('claude_code', 29, 500), row('claude_code', 31, 9_999), row('kiro', 1, 9_999)], NOW)).toBe(3_000);
    expect(burnRate([], NOW)).toBe(0);
  });
});

describe('shares', () => {
  it('models: names, rounded percentages, biggest first, zeros left out', () => {
    expect(modelParts([{ key: 'sonnet', weighted: 24 }, { key: 'opus', weighted: 71 }, { key: 'haiku', weighted: 5 }, { key: 'x', weighted: 0 }]))
      .toEqual([{ key: 'opus', label: 'Opus', pct: 71, tokens: 71 }, { key: 'sonnet', label: 'Sonnet', pct: 24, tokens: 24 }, { key: 'haiku', label: 'Haiku', pct: 5, tokens: 5 }]);
  });

  it('projects: summed per project, top 5 and the rest as other', () => {
    const conv = (project: string, tokens: number) => ({ session_id: `${project}-${tokens}`, project, tokens });
    const list = { total_conversations: 8, days: [{ conversations: [conv('/w/a', 50), conv('/w/b', 20), conv('/w/a', 10)] },
      { conversations: [conv('/w/c', 8), conv('/w/d', 6), conv('/w/e', 4), conv('/w/f', 2)] }] };
    const p = projectParts(list);
    expect(p.parts.map((x) => [x.label, x.tokens])).toEqual([['a', 60], ['b', 20], ['c', 8], ['d', 6], ['e', 4], ['other', 2]]);
    expect(p.sessions).toBe(7);
    expect(p.capped).toBe(true);
    expect(shortProject('C:\\work\\my-app\\')).toBe('my-app');
  });
});
