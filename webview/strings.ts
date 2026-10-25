// The page's wording, en/vi. `{name}` is replaced by params.name.
const EN = {
  title: 'Claude Code Usage', today: 'Today', '7d': '7 days', '30d': '30 days', loading: 'Reading usage…',
  quota: 'Quota', updated: 'updated {ago}', justNow: 'just now', minAgo: '{n} min ago', hAgo: '{n}h ago',
  waiting: 'Tracking is on. The 5h/7d numbers appear after Claude Code\'s next reply.',
  setupText: 'Set up tracking to see your 5-hour and weekly quota.', setup: 'Set up',
  fiveHour: '5-hour', weekly: 'Weekly', resets: 'resets {time} · in {left}', out: 'out ≈{time}',
  tokens: 'Tokens', cost: 'Est. cost', apiPricing: 'API pricing', prompts: 'Prompts', sessions: '{n} sessions', burn: 'Burn rate now', last30: 'last 30 min, any range',
  up: '+{pct}% vs previous period', down: '−{pct}% vs previous period',
  session: 'This session · {project}', sessionLatest: 'Latest session · {project}', sessionNone: 'This session', noSession: 'No Claude Code session in this workspace yet.',
  context: 'Context', sessionLine: '{tokens} tokens · {turns} turns', lastReply: 'last reply {ago}',
  daily: 'Daily', peak: 'peak {peak} · average {avg}', dayTip: '{day}: {tokens} tokens · {prompts} prompts', noActivity: 'No Claude Code activity in this range yet.',
  where: 'Where the quota went', byModel: 'By model', byProject: 'By project', capped: 'From the latest 1000 sessions.',
  moreText: 'Want the prompts, skills and files behind it?', getFull: 'Get Bumeter',
};
type Key = keyof typeof EN;
const VI: Record<Key, string> = {
  title: 'Claude Code Usage', today: 'Hôm nay', '7d': '7 ngày', '30d': '30 ngày', loading: 'Đang đọc số liệu…',
  quota: 'Hạn mức', updated: 'cập nhật {ago}', justNow: 'vừa xong', minAgo: '{n} phút trước', hAgo: '{n} giờ trước',
  waiting: 'Đã bật theo dõi. Số 5h/7d hiện sau câu trả lời tiếp theo của Claude Code.',
  setupText: 'Bật theo dõi để xem hạn mức 5 giờ và hằng tuần.', setup: 'Bật',
  fiveHour: '5 giờ', weekly: 'Tuần', resets: 'reset {time} · còn {left}', out: 'cạn ≈{time}',
  tokens: 'Token', cost: 'Chi phí ước tính', apiPricing: 'theo giá API', prompts: 'Prompt', sessions: '{n} phiên', burn: 'Tốc độ hiện tại', last30: '30 phút qua, mọi khoảng',
  up: '+{pct}% so với kỳ trước', down: '−{pct}% so với kỳ trước',
  session: 'Phiên này · {project}', sessionLatest: 'Phiên gần nhất · {project}', sessionNone: 'Phiên này', noSession: 'Chưa có phiên Claude Code nào trong workspace này.',
  context: 'Context', sessionLine: '{tokens} token · {turns} lượt', lastReply: 'trả lời cuối {ago}',
  daily: 'Theo ngày', peak: 'cao nhất {peak} · trung bình {avg}', dayTip: '{day}: {tokens} token · {prompts} prompt', noActivity: 'Chưa có hoạt động Claude Code trong khoảng này.',
  where: 'Hạn mức đi đâu', byModel: 'Theo model', byProject: 'Theo dự án', capped: 'Tính trên 1000 phiên gần nhất.',
  moreText: 'Muốn xem prompt, skill và file đứng sau những con số này?', getFull: 'Cài Bumeter',
};

let lang: 'en' | 'vi' = 'en';
export const setLang = (l: string): void => {
  lang = l.toLowerCase().startsWith('vi') ? 'vi' : 'en';
};
/** Short weekday of a Unix time, in the page's language. */
export const weekday = (secs: number): string => new Date(secs * 1000).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
export const s = (k: Key, p: Record<string, string | number> = {}): string =>
  (lang === 'vi' ? VI : EN)[k].replace(/\{(\w+)\}/g, (_, n: string) => String(p[n] ?? ''));
