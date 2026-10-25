import { describe, expect, it } from 'vitest';
import { burnRate, chartDays, compare, dayKey, isRange, lastDays, modelParts, projectParts, rangeStart, shortProject, sum, fetchUsage, isActive, tooltipExtra } from '../src/usage';
import type { DayStat, PromptRow, UsageData } from '../src/usage';

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

function fakeRpc(answers: Record<string, unknown>) {
  const calls: [string, unknown][] = [];
  return {
    calls,
    rpc: { call: async <T,>(m: string, p?: unknown): Promise<T> => {
      calls.push([m, p]);
      const a = answers[m];
      if (a instanceof Error) throw a;
      return a as T;
    } },
  };
}
const EFFECT = { economics: { breakdown: { by_model: [{ key: 'opus', weighted: 71 }, { key: 'sonnet', weighted: 29 }] } } };
const ANSWERS = {
  limit_state: { five_hour: { used_percentage: 62, resets_at: 1 }, seven_day: null, stale: false, blocked: null },
  project_now: { latest: { session_id: 's1', ts: new Date(NOW - 60_000).toISOString(), context: 312_000 }, context_threshold: 400_000 },
  session_economics: { calls: 14, weighted: 1_800_000 },
  day_stats: [day(0, 12_400_000, 46, 18.2)],
  recent_prompts: [],
  effectiveness: EFFECT,
  list_conversations: { total_conversations: 1, days: [{ conversations: [{ session_id: 's1', project: '/w/my-app', tokens: 5 }] }] },
};

describe('fetchUsage', () => {
  it('asks only for Claude Code, and for the range only while the page is open', async () => {
    const closed = fakeRpc(ANSWERS);
    const d = await fetchUsage(closed.rpc, '/w/my-app', '7d', NOW, false);
    const methods = closed.calls.map(([m]) => m);
    expect(methods).not.toContain('list_conversations');
    expect(methods.filter((m) => m === 'effectiveness')).toHaveLength(1);
    expect(closed.calls.find(([m]) => m === 'day_stats')![1]).toEqual({ tool: 'claude_code' });
    expect(closed.calls.find(([m]) => m === 'effectiveness')![1]).toEqual({ from: rangeStart('today', NOW).toISOString(), tool: 'claude_code' });
    expect(d.projects).toBeNull();
    expect(d.session).toEqual({ calls: 14, weighted: 1_800_000 });
    expect(d.models).toEqual(d.modelsToday);

    const open = fakeRpc(ANSWERS);
    const o = await fetchUsage(open.rpc, '/w/my-app', '7d', NOW, true);
    expect(open.calls.filter(([m]) => m === 'effectiveness').map(([, p]) => (p as { from: string }).from))
      .toEqual([rangeStart('today', NOW).toISOString(), rangeStart('7d', NOW).toISOString()]);
    expect(open.calls.find(([m]) => m === 'list_conversations')![1]).toEqual({ from: rangeStart('7d', NOW).toISOString(), tool: 'claude_code', limit: 1000 });
    expect(o.projects?.parts[0].label).toBe('my-app');
  });

  it('one failing RPC only empties its own part', async () => {
    const f = fakeRpc({ ...ANSWERS, day_stats: new Error('boom'), session_economics: new Error('gone') });
    const d = await fetchUsage(f.rpc, '/w/my-app', 'today', NOW, true);
    expect(d.days).toBeNull();
    expect(d.session).toBeNull();
    expect(d.limits).not.toBeNull();
    expect(d.models?.[0].label).toBe('Opus');
  });

  it('no workspace: no project or session calls', async () => {
    const f = fakeRpc(ANSWERS);
    const d = await fetchUsage(f.rpc, null, 'today', NOW, false);
    expect(f.calls.map(([m]) => m)).not.toContain('project_now');
    expect(d.now).toBeNull();
  });
});

describe('tooltipExtra', () => {
  const base: UsageData = { range: 'today', at: NOW, limits: null, now: ANSWERS.project_now, session: { calls: 14, weighted: 1_800_000 },
    days: [day(0, 12_400_000, 46, 18.2)], burn: 2_100_000, modelsToday: [{ key: 'opus', label: 'Opus', pct: 71, tokens: 71 }, { key: 'sonnet', label: 'Sonnet', pct: 29, tokens: 29 }],
    models: null, projects: null };

  it('the session under the kit context line, then today, burn and models after a rule', () => {
    expect(tooltipExtra(base, 'en', '/w/my-app')).toBe([
      '$(arrow-small-right) 14 turns · 1.8M tokens in this session',
      '---',
      '**Today** 12.4M tokens · ≈$18.20 · 46 prompts',
      '**Burn** 2.1M tokens/h (last 30 min)',
      '**Models today** Opus 71% · Sonnet 29%',
    ].join('\n\n'));
  });

  it('escapes a model name for the HTML tooltip', () => {
    expect(tooltipExtra({ ...base, modelsToday: [{ key: 'x', label: 'a<b', pct: 100, tokens: 1 }] }, 'en', '/w/my-app')).toContain('a&lt;b 100%');
  });

  it('no session line once the session is older than 30 minutes, as the kit drops its context line', () => {
    const old = { ...base, now: { ...ANSWERS.project_now, latest: { ...ANSWERS.project_now.latest, ts: new Date(NOW - 31 * 60_000).toISOString() } } };
    expect(tooltipExtra(old, 'en', '/w/my-app')).not.toContain('this session');
    expect(isActive(old)).toBe(false);
    expect(isActive(base)).toBe(true);
  });

  it('leaves out what it does not know; nothing at all is empty', () => {
    const v = tooltipExtra({ ...base, session: null, burn: 0, modelsToday: [] }, 'en', '/w/my-app');
    expect(v).toBe('---\n\n**Today** 12.4M tokens · ≈$18.20 · 46 prompts');
    expect(tooltipExtra({ ...base, session: null, days: null, burn: null, modelsToday: null }, 'en', null)).toBe('');
  });
});
