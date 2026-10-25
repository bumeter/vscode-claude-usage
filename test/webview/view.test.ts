// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { dayKey } from '../../src/usage';
import type { DayStat, UsageData } from '../../src/usage';
import type { FromPage, PageState } from '../../src/panel';
import { setLang } from '../../webview/strings';
import { mountUsage } from '../../webview/view';

const NOW = new Date(2026, 9, 25, 12, 0, 0).getTime();
const S = NOW / 1000;
const day = (back: number, tokens: number, prompts = 10, cost = 5): DayStat => {
  const d = new Date(NOW); d.setDate(d.getDate() - back);
  return { day: dayKey(d), from: '', to: '', tokens, prompts, cost_usd: cost };
};
const DATA: UsageData = {
  range: 'today', at: NOW - 11_000,
  limits: { five_hour: { used_percentage: 78, resets_at: S + 5_400 }, seven_day: { used_percentage: 41, resets_at: S + 300_000 }, stale: false, blocked: null,
    forecast_five_hour: { hits_at: S + 3_600, at_risk: true }, forecast_seven_day: { hits_at: null, at_risk: false } },
  now: { latest: { session_id: 's1', ts: new Date(NOW - 60_000).toISOString(), context: 312_000 }, context_threshold: 400_000 },
  session: { calls: 14, weighted: 1_800_000 },
  days: [day(0, 12_400_000, 46, 18.2), day(1, 9_100_000), day(3, 20_000_000)],
  burn: 2_100_000,
  modelsToday: null,
  models: [{ key: 'opus', label: 'Opus', pct: 71, tokens: 71 }, { key: 'sonnet', label: 'Sonnet', pct: 29, tokens: 29 }],
  projects: { parts: [{ key: '/w/my-app', label: 'my-app', pct: 100, tokens: 5 }], sessions: 3, capped: false },
};

function mount(state: Partial<PageState> = {}, data: Partial<UsageData> = {}) {
  const root = document.createElement('main');
  document.body.replaceChildren(root);
  const sent: FromPage[] = [];
  const v = mountUsage(root, { post: (m) => sent.push(m), now: () => NOW });
  v.show({ tracked: true, project: '/w/my-app', ...state, data: { ...DATA, ...data } });
  return { root, sent, text: () => root.textContent ?? '' };
}

beforeEach(() => setLang('en'));

describe('Usage page', () => {
  it('draws quota, the four numbers, this session, the chart and where the quota went', () => {
    const { root, text } = mount();
    expect(text()).toContain('Claude Code Usage');
    expect(text()).toContain('updated just now');
    expect(text()).toContain('78%');
    expect(text()).toContain('out ≈');
    expect(root.querySelector('.qrow.warn')).not.toBeNull();
    expect([...root.querySelectorAll('.stat .big')].map((e) => e.textContent)).toEqual(['12.4M', '≈$18.20', '46', '2.1M/h']);
    expect(text()).toContain('+36% vs previous period');
    expect(root.querySelector('.stat .sub span')!.className).toBe('up');
    expect(text()).toMatch(/resets [A-Z][a-z]{2} \d\d:\d\d · in 3d/);
    expect(text()).toMatch(/resets \d\d:\d\d · in 1h30/);
    expect(root.querySelectorAll('.qgrid > .qrow')).toHaveLength(2);
    expect(text()).toContain('This session · my-app');
    expect(text()).toContain('1.8M tokens · 14 turns · last reply 1 min ago');
    expect(root.querySelectorAll('.chart .col')).toHaveLength(7);
    expect(root.querySelector<HTMLElement>('.chart .slot:last-child .col')!.className).toBe('col today');
    expect(text()).toContain('peak 20.0M');
    expect([...root.querySelectorAll('.stack .part')].map((e) => e.textContent)).toEqual(['Opus 71%', 'Sonnet 29%', 'my-app 100%']);
  });

  it('a small change is plain; an old session is the latest, not this one; a narrow part shows only its share', () => {
    const { root, text } = mount({}, {
      days: [day(0, 10_500_000), day(1, 10_000_000)],
      now: { latest: { session_id: 's1', ts: new Date(NOW - 3 * 3_600_000).toISOString(), context: 312_000 }, context_threshold: 400_000 },
      models: [{ key: 'opus', label: 'Opus', pct: 95, tokens: 95 }, { key: 'haiku', label: 'Haiku', pct: 5, tokens: 5 }],
    });
    expect(text()).toContain('+5% vs previous period');
    expect(root.querySelector('.stat .sub span')!.className).toBe('');
    expect(text()).toContain('Latest session · my-app');
    const haiku = [...root.querySelectorAll<HTMLElement>('.stack .part')][1];
    expect(haiku.textContent).toBe('5%');
    expect(haiku.title).toBe('Haiku 5%');
  });

  it('range buttons ask the extension; Bumeter link and setup too', () => {
    const { root, sent } = mount({ tracked: false }, { limits: { five_hour: null, seven_day: null, stale: false, blocked: null } });
    root.querySelector<HTMLButtonElement>('[data-range="7d"]')!.click();
    root.querySelector<HTMLButtonElement>('.setup .btn')!.click();
    root.querySelector<HTMLButtonElement>('.foot .link')!.click();
    expect(sent).toEqual([{ type: 'range', range: '7d' }, { type: 'setup' }, { type: 'getFull' }]);
    expect(root.textContent).toContain('Set up tracking to see your 5-hour and weekly quota.');
  });

  it('a failed RPC shows a dash; no activity says so', () => {
    const failed = mount({}, { days: null, burn: null, models: null, projects: null });
    expect([...failed.root.querySelectorAll('.stat .big')].map((e) => e.textContent)).toEqual(['—', '—', '—', '—']);
    const quiet = mount({}, { days: [], models: [], projects: { parts: [], sessions: 0, capped: false } });
    expect(quiet.text()).toContain('No Claude Code activity in this range yet.');
  });

  it('30 days draws 30 columns; capped projects say so; Vietnamese', () => {
    setLang('vi');
    const { root, text } = mount({}, { range: '30d', projects: { parts: [{ key: 'a', label: 'a', pct: 100, tokens: 1 }], sessions: 1000, capped: true } });
    expect(root.querySelectorAll('.chart .col')).toHaveLength(30);
    expect(text()).toContain('1000 phiên gần nhất');
    expect(root.querySelector('[data-range="30d"]')!.className).toBe('on');
  });
});
