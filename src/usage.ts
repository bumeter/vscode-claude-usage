// The numbers of the Usage view and the tooltip: what to ask `bum`, and the sums over the answers.
// Claude Code only. No `vscode` here, so it is tested in plain Node.
import type { LimitState, ProjectNow } from '@bumeter/vscode-kit/status';

export const TOOL = 'claude_code';
export type Range = 'today' | '7d' | '30d';
export const RANGES: Range[] = ['today', '7d', '30d'];
const DAYS: Record<Range, number> = { today: 1, '7d': 7, '30d': 30 };
export const isRange = (v: unknown): v is Range => RANGES.includes(v as Range);

export interface DayStat { day: string; from: string; to: string; tokens: number; prompts: number; cost_usd: number }
export interface Share { key: string; weighted: number }
export interface TokenUsage { input: number; cache_write_5m: number; cache_write_1h: number; cache_read: number; output: number }
export interface PromptRow { stats: { tool: string; ts: string; usage: TokenUsage } }
export interface ConversationList { days: { conversations: { session_id: string; project: string; tokens: number }[] }[]; total_conversations: number }
export interface Effect { economics: { breakdown: { by_model: Share[] } } | null }
export interface SessionEconomics { calls: number; weighted: number }

export interface Totals { tokens: number; prompts: number; cost: number }
export interface Part { key: string; label: string; pct: number; tokens: number }

/** Everything the tooltip and the page draw. A part is null when its RPC failed. */
export interface UsageData {
  range: Range;
  /** Unix ms when it was read. */
  at: number;
  limits: LimitState | null;
  now: ProjectNow | null;
  session: SessionEconomics | null;
  /** Every day `day_stats` knows, for any range. */
  days: DayStat[] | null;
  /** Tokens per hour over the last 30 minutes. */
  burn: number | null;
  modelsToday: Part[] | null;
  /** For `range`; the same as `modelsToday` for Today or when the page is closed. */
  models: Part[] | null;
  /** Only while the page is open. */
  projects: { parts: Part[]; sessions: number; capped: boolean } | null;
}

export const dayKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Local midnight of the range's first day; `back` ranges earlier for the one before. */
export function rangeStart(range: Range, nowMs: number, back = 0): Date {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - DAYS[range] * (back + 1) + 1);
  return d;
}

/** The last `n` days up to today (`back` periods earlier), oldest first; a day without a row is zero. */
export function lastDays(days: DayStat[], n: number, nowMs: number, back = 0): DayStat[] {
  const byDay = new Map(days.map((x) => [x.day, x]));
  const out: DayStat[] = [];
  for (let i = n * (back + 1) - 1; i >= n * back; i--) {
    const d = new Date(nowMs);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push(byDay.get(key) ?? { day: key, from: '', to: '', tokens: 0, prompts: 0, cost_usd: 0 });
  }
  return out;
}

export const sum = (days: DayStat[]): Totals =>
  days.reduce((a, x) => ({ tokens: a.tokens + x.tokens, prompts: a.prompts + x.prompts, cost: a.cost + x.cost_usd }), { tokens: 0, prompts: 0, cost: 0 });

/** This range and the one before it; `change` is null when the one before had nothing. */
export function compare(days: DayStat[], range: Range, nowMs: number): { cur: Totals; prev: Totals; change: number | null } {
  const cur = sum(lastDays(days, DAYS[range], nowMs));
  const prev = sum(lastDays(days, DAYS[range], nowMs, 1));
  return { cur, prev, change: prev.tokens > 0 ? (cur.tokens - prev.tokens) / prev.tokens : null };
}

/** The Daily chart: 7 columns for Today and 7 days, 30 for 30 days. */
export const chartDays = (days: DayStat[], range: Range, nowMs: number): DayStat[] => lastDays(days, range === '30d' ? 30 : 7, nowMs);

const BURN_MS = 30 * 60_000;
const tokensOf = (u: TokenUsage) => u.input + u.cache_write_5m + u.cache_write_1h + u.cache_read + u.output;

/** Tokens per hour of the Claude Code prompts in the last 30 minutes. */
export function burnRate(rows: PromptRow[], nowMs: number): number {
  const since = nowMs - BURN_MS;
  const tokens = rows.filter((r) => r.stats.tool === TOOL && Date.parse(r.stats.ts) >= since).reduce((a, r) => a + tokensOf(r.stats.usage), 0);
  return tokens * (3_600_000 / BURN_MS);
}

function toParts(items: { key: string; label: string; tokens: number }[]): Part[] {
  const total = items.reduce((a, x) => a + x.tokens, 0);
  return items.filter((x) => x.tokens > 0).sort((a, b) => b.tokens - a.tokens).map((x) => ({ ...x, pct: Math.round((x.tokens / total) * 100) }));
}

const MODEL_NAMES: Record<string, string> = { opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku', other: 'Other' };
export const modelParts = (shares: Share[]): Part[] => toParts(shares.map((s) => ({ key: s.key, label: MODEL_NAMES[s.key] ?? s.key, tokens: s.weighted })));

export const shortProject = (p: string): string => p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || p;

/** Tokens per project, the top `top` and the rest as `other`; `capped` when the core returned fewer sessions than it has. */
export function projectParts(list: ConversationList, top = 5): { parts: Part[]; sessions: number; capped: boolean } {
  const by = new Map<string, number>();
  let sessions = 0;
  for (const d of list.days) {
    for (const c of d.conversations) {
      sessions++;
      by.set(c.project, (by.get(c.project) ?? 0) + c.tokens);
    }
  }
  const sorted = [...by].sort((a, b) => b[1] - a[1]);
  const rest = sorted.slice(top).reduce((a, [, n]) => a + n, 0);
  const items = sorted.slice(0, top).map(([key, tokens]) => ({ key, label: shortProject(key), tokens }));
  if (rest) items.push({ key: 'other', label: 'other', tokens: rest });
  const parts = toParts(items);
  // `toParts` sorts by size; keep `other` last.
  parts.sort((a, b) => (a.key === 'other' ? 1 : b.key === 'other' ? -1 : 0));
  return { parts, sessions, capped: list.total_conversations > sessions };
}
