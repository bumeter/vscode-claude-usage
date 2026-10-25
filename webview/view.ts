// The Usage page: quota, the range's numbers, this session, a daily chart and where the quota went, in
// Bumeter's Overview look. Plain DOM; the CSP forbids style attributes, so sizes go through `el.style`.
import { fmtClock, fmtCountdown, fmtTokens } from '@bumeter/vscode-kit/format';
import type { Forecast, Window as QuotaWindow } from '@bumeter/vscode-kit/status';
import type { FromPage, PageState } from '../src/panel';
import { chartDays, compare, isActive, RANGES, shortProject } from '../src/usage';
import type { Part, Range, UsageData } from '../src/usage';
import { h } from './dom';
import { s, weekday } from './strings';

const level = (pct: number) => (pct >= 90 ? 'err' : pct >= 70 ? 'warn' : 'ok');
const clamp = (pct: number) => `${Math.min(100, Math.max(0, pct))}%`;
/** A clock time, with the weekday when it is not within the next 20 hours. */
const when = (secs: number, nowSecs: number) => (secs - nowSecs > 20 * 3600 ? `${weekday(secs)} ${fmtClock(secs)}` : fmtClock(secs));
/** A change smaller than this is drawn plain, not red or green. */
const NOTABLE = 0.2;
/** A part this narrow shows only its percentage; the name is in its title. */
const NARROW = 15;

function fill(pct: number): HTMLElement {
  const f = h('div', { class: 'fill' });
  f.style.width = clamp(pct);
  return f;
}

export function mountUsage(root: HTMLElement, o: { post(m: FromPage): void; now?: () => number }) {
  const now = o.now ?? Date.now;
  let state: PageState | undefined;

  const ago = (ms: number) => {
    const m = Math.floor(ms / 60_000);
    return m < 1 ? s('justNow') : m < 60 ? s('minAgo', { n: m }) : s('hAgo', { n: Math.floor(m / 60) });
  };

  const head = (range: Range) => h('header', { class: 'top' },
    h('h1', {}, h('span', { class: 'logo' }), s('title')),
    h('nav', { class: 'seg' }, RANGES.map((r) => h('button', { class: r === range ? 'on' : '', 'data-range': r, onclick: () => o.post({ type: 'range', range: r }) }, s(r)))));

  const panel = (title: string, aside?: string) => h('section', { class: 'panel' }, h('div', { class: 'ph' }, h('h2', {}, title), aside ? h('span', { class: 'muted' }, aside) : null));

  function quota(d: UsageData, tracked: boolean): HTMLElement {
    const box = panel(s('quota'), s('updated', { ago: ago(now() - d.at) }));
    const l = d.limits;
    if (!l?.five_hour && !l?.seven_day) {
      box.append(tracked
        ? h('p', { class: 'muted' }, s('waiting'))
        : h('div', { class: 'setup' }, h('p', {}, s('setupText')), h('button', { class: 'btn', onclick: () => o.post({ type: 'setup' }) }, s('setup'))));
      return box;
    }
    const row = (name: string, w: QuotaWindow | null, f: Forecast | null | undefined) => {
      if (!w) return null;
      const pct = Math.round(w.used_percentage);
      return h('div', { class: `qrow ${level(pct)}` },
        h('span', { class: 'qname' }, name),
        h('div', { class: 'track' }, fill(pct)),
        h('b', { class: 'qpct' }, `${pct}%`),
        h('span', { class: 'muted' }, s('resets', { time: when(w.resets_at, now() / 1000), left: fmtCountdown(w.resets_at, now() / 1000) })),
        f?.at_risk && f.hits_at != null ? h('span', { class: 'out' }, s('out', { time: when(f.hits_at, now() / 1000) })) : null);
    };
    // One grid for both rows, so their bars line up whatever the texts beside them.
    box.append(h('div', { class: 'qgrid' }, [row(s('fiveHour'), l.five_hour, l.forecast_five_hour), row(s('weekly'), l.seven_day, l.forecast_seven_day)]));
    return box;
  }

  const stat = (label: string, value: string, sub: Node | string | null, cls = '') =>
    h('div', { class: `stat ${cls}`.trim() }, h('span', { class: 'label' }, label), h('b', { class: 'big' }, value), h('span', { class: 'sub' }, sub));

  function cards(d: UsageData): HTMLElement {
    const c = d.days ? compare(d.days, d.range, now()) : null;
    const change = c?.change == null || Math.round(c.change * 100) === 0 ? null
      : h('span', { class: Math.abs(c.change) < NOTABLE ? '' : c.change > 0 ? 'up' : 'down' }, s(c.change > 0 ? 'up' : 'down', { pct: Math.abs(Math.round(c.change * 100)) }));
    return h('section', { class: 'stats' },
      stat(s('tokens'), c ? fmtTokens(c.cur.tokens) : '—', change, 'flame'),
      stat(s('cost'), c ? `≈$${c.cur.cost.toFixed(2)}` : '—', s('apiPricing')),
      stat(s('prompts'), c ? String(c.cur.prompts) : '—', d.projects ? s('sessions', { n: d.projects.sessions }) : null),
      stat(s('burn'), d.burn ? `${fmtTokens(d.burn)}/h` : '—', s('last30')));
  }

  function session(d: UsageData, project: string | null): HTMLElement {
    const latest = d.now?.latest;
    const title = isActive(d) || !latest ? 'session' : 'sessionLatest';
    const box = panel(project ? s(title, { project: shortProject(project) }) : s('sessionNone'));
    if (!latest || !d.now) {
      box.append(h('p', { class: 'muted' }, s('noSession')));
      return box;
    }
    const th = d.now.context_threshold;
    const pct = Math.round((latest.context / th) * 100);
    const line = [d.session ? s('sessionLine', { tokens: fmtTokens(d.session.weighted), turns: d.session.calls }) : null, s('lastReply', { ago: ago(now() - Date.parse(latest.ts)) })];
    box.append(
      h('div', { class: `qrow ${level(pct)}` }, h('span', { class: 'qname' }, s('context')), h('div', { class: 'track' }, fill(pct)), h('b', { class: 'qpct' }, `${pct}%`),
        h('span', { class: 'muted' }, `${fmtTokens(latest.context)} / ${fmtTokens(th)}`)),
      h('p', { class: 'muted' }, line.filter(Boolean).join(' · ')));
    return box;
  }

  function daily(d: UsageData): HTMLElement {
    const days = d.days ? chartDays(d.days, d.range, now()) : null;
    const max = days ? Math.max(0, ...days.map((x) => x.tokens)) : 0;
    const box = panel(s('daily'), days && max ? s('peak', { peak: fmtTokens(max), avg: fmtTokens(days.reduce((a, x) => a + x.tokens, 0) / days.length) }) : undefined);
    if (!days || !max) {
      box.append(h('p', { class: 'muted' }, d.days ? s('noActivity') : '—'));
      return box;
    }
    const today = days[days.length - 1].day;
    box.append(h('div', { class: 'chart' }, days.map((x) => {
      const col = h('div', { class: x.day === today ? 'col today' : 'col', title: s('dayTip', { day: x.day, tokens: fmtTokens(x.tokens), prompts: x.prompts }) });
      col.style.height = `${Math.max(2, (x.tokens / max) * 100)}%`;
      return h('div', { class: 'slot' }, h('div', { class: 'bar' }, col), h('span', { class: 'dlabel' }, x.day.slice(8)));
    })));
    return box;
  }

  const stack = (parts: Part[]) => h('div', { class: 'stack' }, parts.map((p, i) => {
    const seg = h('div', { class: `part p${Math.min(i, 3)}`, title: `${p.label} ${p.pct}%` }, p.pct < NARROW ? `${p.pct}%` : `${p.label} ${p.pct}%`);
    seg.style.flexGrow = String(Math.max(p.pct, 1));
    return seg;
  }));

  function where(d: UsageData): HTMLElement {
    const box = panel(s('where'));
    const row = (label: string, parts: Part[] | null | undefined) =>
      h('div', { class: 'wrow' }, h('span', { class: 'wlabel' }, label), parts == null ? h('span', { class: 'muted' }, '—') : parts.length ? stack(parts) : h('span', { class: 'muted' }, s('noActivity')));
    box.append(row(s('byModel'), d.models), row(s('byProject'), d.projects?.parts));
    if (d.projects?.capped) box.append(h('p', { class: 'muted small' }, s('capped')));
    return box;
  }

  const foot = () => h('footer', { class: 'foot' }, s('moreText'), ' ', h('button', { class: 'link', onclick: () => o.post({ type: 'getFull' }) }, s('getFull')));

  function render(): void {
    if (!state) {
      root.replaceChildren(h('p', { class: 'muted' }, s('loading')));
      return;
    }
    const { data, tracked, project } = state;
    root.replaceChildren(head(data.range), quota(data, tracked), cards(data), session(data, project), daily(data), where(data), foot());
  }

  render();
  return {
    show(st: PageState): void {
      state = st;
      render();
    },
    /** Redraw the "ago" texts. */
    tick: render,
  };
}
