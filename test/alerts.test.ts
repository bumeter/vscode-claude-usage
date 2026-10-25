import { describe, expect, it } from 'vitest';
import { ALERT_AT, dueAlerts } from '../src/alerts';
import type { UsageData } from '../src/usage';

const NOW = new Date(2026, 9, 25, 12, 0, 0).getTime();
const S = NOW / 1000;
const RESET = S + 90 * 60;
const WEEK = S + 3 * 86_400;

function data(o: { five?: number; seven?: number; risk?: number | null; stale?: boolean; ctx?: number; age?: number; opus?: number } = {}): UsageData {
  return {
    range: 'today', at: NOW,
    limits: {
      five_hour: o.five == null ? null : { used_percentage: o.five, resets_at: RESET },
      seven_day: o.seven == null ? null : { used_percentage: o.seven, resets_at: WEEK },
      stale: !!o.stale, blocked: null,
      forecast_five_hour: { hits_at: o.risk ?? null, at_risk: o.risk != null }, forecast_seven_day: { hits_at: null, at_risk: false },
    },
    now: { latest: { session_id: 's1', ts: new Date(NOW - (o.age ?? 60) * 1000).toISOString(), context: o.ctx ?? 100_000 }, context_threshold: 400_000 },
    session: null, days: null, burn: null,
    modelsToday: o.opus == null ? null : [{ key: 'opus', label: 'Opus', pct: o.opus, tokens: 1 }],
    models: null, projects: null,
  };
}
const none = () => false;

describe('dueAlerts', () => {
  it('nothing below the first threshold', () => {
    expect(dueAlerts(data({ five: 79, seven: 41 }), 'en', ALERT_AT, none)).toEqual([]);
  });

  it('80% is info, 90% a warning; one alert per window that covers every threshold crossed', () => {
    const [a] = dueAlerts(data({ five: 82 }), 'en', ALERT_AT, none);
    expect(a.level).toBe('info');
    expect(a.text).toMatch(/^You have used 82% of the 5-hour quota; it resets \d\d:\d\d \(in 1h30\)\.$/);
    expect(a.keys).toEqual([`5h:${RESET}:80`]);
    const [b] = dueAlerts(data({ five: 91 }), 'en', ALERT_AT, none);
    expect(b.level).toBe('warning');
    expect(b.keys).toEqual([`5h:${RESET}:80`, `5h:${RESET}:90`]);
  });

  it('a key once seen is not shown again; the next threshold is', () => {
    const seen = new Set([`5h:${RESET}:80`]);
    expect(dueAlerts(data({ five: 85 }), 'en', ALERT_AT, (k) => seen.has(k))).toEqual([]);
    expect(dueAlerts(data({ five: 90 }), 'en', ALERT_AT, (k) => seen.has(k))).toHaveLength(1);
  });

  it('the forecast comes first and is a warning, with how long before the reset', () => {
    const [a] = dueAlerts(data({ five: 60, risk: S + 30 * 60 }), 'en', ALERT_AT, none);
    expect(a.level).toBe('warning');
    expect(a.text).toMatch(/^At this pace the 5-hour quota runs out ≈\d\d:\d\d, 1h00 before it resets\.$/);
    expect(a.keys).toEqual([`5h:${RESET}:risk`]);
  });

  it('the weekly window names its day; Opus at half of today gets a hint', () => {
    const [a] = dueAlerts(data({ seven: 85, opus: 71 }), 'en', ALERT_AT, none);
    expect(a.text).toMatch(/of the weekly quota; it resets [A-Z][a-z]{2} \d\d:\d\d \(in 3d0h\)\. Opus used 71% of today's quota: "\/model sonnet" uses less of it\.$/);
    expect(dueAlerts(data({ seven: 85, opus: 40 }), 'en', ALERT_AT, none)[0].text).not.toContain('Opus');
  });

  it('stale numbers alert nothing', () => {
    expect(dueAlerts(data({ five: 95, stale: true }), 'en', ALERT_AT, none)).toEqual([]);
  });

  it('context over the threshold, once per session and only while it is current', () => {
    const [a] = dueAlerts(data({ ctx: 412_000 }), 'en', ALERT_AT, none);
    expect(a).toEqual({ level: 'info', text: 'This session\'s context is 412K, over 400K: consider /compact.', keys: ['ctx:s1'] });
    expect(dueAlerts(data({ ctx: 412_000 }), 'en', ALERT_AT, (k) => k === 'ctx:s1')).toEqual([]);
    expect(dueAlerts(data({ ctx: 412_000, age: 3600 }), 'en', ALERT_AT, none)).toEqual([]);
  });

  it('Vietnamese', () => {
    expect(dueAlerts(data({ five: 82 }), 'vi', ALERT_AT, none)[0].text).toMatch(/^Bạn đã dùng 82% hạn mức 5 giờ, reset \d\d:\d\d \(còn 1h30\)\.$/);
  });
});
