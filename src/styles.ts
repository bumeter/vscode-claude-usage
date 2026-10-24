// The styles the picker offers, in the order it lists them, with their names and one line each. No
// `vscode` here, so it is tested in plain Node.
import type { Lang } from '@bumeter/vscode-kit/format';
import { STYLE_IDS } from '@bumeter/vscode-kit/styles';
import type { StyleChoice, StyleId } from '@bumeter/vscode-kit/styles';

const NAMES: Record<Lang, Record<StyleId, [string, string]>> = {
  vi: {
    classic: ['Classic', 'Đủ 3 con số: 5h, 7d, context'],
    countdown: ['Countdown', 'Kèm thời gian còn lại đến lúc reset'],
    forecast: ['Forecast', 'Theo tốc độ đang dùng thì mấy giờ chạm 100%'],
    smooth: ['Smooth bar', 'Thanh tiến độ liền, chia 1/8 ô'],
    split: ['Tách ô', 'Ba ô riêng, mỗi ô tự đổi màu; chuột phải để ẩn từng ô'],
    compact: ['Compact', 'Chỉ hai con số'],
    bars: ['Bars', 'Thanh 10 nấc cho mỗi quota'],
    traffic: ['Đèn giao thông', 'Đèn xanh, vàng, đỏ cho từng quota'],
    resetclock: ['Reset clock', 'Giờ reset theo đồng hồ'],
    battery: ['Pin', 'Phần còn lại thay vì phần đã dùng'],
    peak: ['Peak', 'Chỉ quota đang gần trần nhất'],
    context: ['Context first', 'Context đứng đầu, cho người hay /compact'],
    minimal: ['Minimal', 'Một con số, còn lại trong tooltip'],
  },
  en: {
    classic: ['Classic', 'All three numbers: 5h, 7d, context'],
    countdown: ['Countdown', 'With the time left until each reset'],
    forecast: ['Forecast', 'When you hit 100% at the current pace'],
    smooth: ['Smooth bar', 'A smooth progress bar, in eighths of a cell'],
    split: ['Split', 'Three items, each with its own colour; right-click to hide one'],
    compact: ['Compact', 'Just the two numbers'],
    bars: ['Bars', 'A 10-step bar per window'],
    traffic: ['Traffic light', 'Green, yellow or red per window'],
    resetclock: ['Reset clock', 'The clock time of the reset'],
    battery: ['Battery', 'What is left instead of what is used'],
    peak: ['Peak', 'Only the window closest to its limit'],
    context: ['Context first', 'Context first, for heavy /compact users'],
    minimal: ['Minimal', 'One number; the rest is in the tooltip'],
  },
};

export interface StyleEntry { id: StyleId; name: string; description: string }

export const styleList = (lang: Lang): StyleEntry[] => STYLE_IDS.map((id) => ({ id, name: NAMES[lang][id][0], description: NAMES[lang][id][1] }));

/** The `claudeUsage.style` setting as a style; anything unknown is `classic`. */
export function styleSetting(value: unknown): StyleChoice {
  return value === 'custom' || STYLE_IDS.includes(value as StyleId) ? (value as StyleChoice) : 'classic';
}

/** What `custom` starts from when the template is still empty. */
export const DEFAULT_TEMPLATE = '$(flame) 5h {5h} · 7d {7d} · ctx {ctx}';
