// Notifications before the quota runs out: which ones are due, from the numbers already read. No `vscode`
// here, so it is tested in plain Node; the extension shows them and remembers which were shown.
import { fmtClock, fmtCountdown, fmtTokens } from '@bumeter/vscode-kit/format';
import type { Lang } from '@bumeter/vscode-kit/format';
import type { Forecast, Window as QuotaWindow } from '@bumeter/vscode-kit/status';
import { t } from './strings';
import { isActive } from './usage';
import type { UsageData } from './usage';

export interface Alert {
  level: 'info' | 'warning';
  text: string;
  /** What it covers: a key once shown is not shown again (a window's keys carry its reset time). */
  keys: string[];
}

export const ALERT_AT = [80, 90];
/** From this share the alert is a warning. */
const WARN_PCT = 90;
/** Opus at this share of today's quota or more gets a hint to switch. */
const OPUS_HINT = 50;

/** A clock time, with the weekday when it is not within the next 20 hours. */
function when(secs: number, nowSecs: number, lang: Lang): string {
  if (secs - nowSecs <= 20 * 3600) return fmtClock(secs);
  const day = new Date(secs * 1000).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
  return `${day} ${fmtClock(secs)}`;
}

/** The alerts due now and not yet `seen`: at most one per quota window (the forecast first, then the highest
 * threshold crossed), and one per session whose context is over the threshold. */
export function dueAlerts(d: UsageData, lang: Lang, thresholds: number[], seen: (key: string) => boolean): Alert[] {
  const out: Alert[] = [];
  const nowSecs = d.at / 1000;
  const l = d.limits;
  if (l && !l.stale) {
    const opus = d.modelsToday?.find((p) => p.key === 'opus');
    const hint = opus && opus.pct >= OPUS_HINT ? ` ${t(lang, 'alertOpus', { pct: opus.pct })}` : '';
    const win = (id: string, name: string, w: QuotaWindow | null | undefined, f: Forecast | null | undefined) => {
      if (!w) return;
      const pct = Math.round(w.used_percentage);
      const base = `${id}:${w.resets_at}`;
      const crossed = thresholds.filter((x) => pct >= x).map((x) => `${base}:${x}`);
      const risk = f?.at_risk && f.hits_at != null && f.hits_at < w.resets_at ? f.hits_at : null;
      const keys = risk != null ? [...crossed, `${base}:risk`] : crossed;
      if (keys.every(seen)) return;
      const warnRisk = risk != null && !seen(`${base}:risk`);
      const text = warnRisk
        ? t(lang, 'alertRisk', { name, time: when(risk, nowSecs, lang), before: fmtCountdown(w.resets_at, risk) })
        : t(lang, 'alertPct', { name, pct, time: when(w.resets_at, nowSecs, lang), left: fmtCountdown(w.resets_at, nowSecs) });
      out.push({ level: warnRisk || pct >= WARN_PCT ? 'warning' : 'info', text: text + hint, keys });
    };
    win('5h', t(lang, 'alert5h'), l.five_hour, l.forecast_five_hour);
    win('7d', t(lang, 'alert7d'), l.seven_day, l.forecast_seven_day);
  }
  const latest = d.now?.latest;
  if (latest && d.now && isActive(d) && latest.context > d.now.context_threshold) {
    const key = `ctx:${latest.session_id}`;
    if (!seen(key)) out.push({ level: 'info', text: t(lang, 'alertCtx', { ctx: fmtTokens(latest.context), limit: fmtTokens(d.now.context_threshold) }), keys: [key] });
  }
  return out;
}
