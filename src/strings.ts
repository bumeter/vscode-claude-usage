// Claude Code Usage's own wording; the shared strings (quota, context, errors) come from the kit.
import { localize } from '@bumeter/vscode-kit/format';

export const t = localize({
  vi: {
    usageSetup: 'Chưa có số 5h/7d. Bấm để mở Usage và bật theo dõi hạn mức: thêm một hook vào statusLine của Claude Code (có sao lưu, gỡ được).',
    usageWaiting: 'Đã bật theo dõi. Số 5h/7d hiện sau câu trả lời tiếp theo của Claude Code.',
    setupTracking: 'Bật theo dõi hạn mức', removeTracking: 'Gỡ theo dõi hạn mức', refresh: 'Làm mới', getFull: 'Bumeter đầy đủ: Overview, Skill, file',
    modeRecord: 'Chỉ ghi số', modeRecordDetail: 'Dòng statusline hiện tại của bạn giữ nguyên',
    modeShow: 'Ghi số và hiện trên statusline của Claude Code', modeShowDetail: 'Thêm quota và context vào cuối dòng statusline',
    apply: 'Áp dụng', alreadyOn: 'Đã bật theo dõi hạn mức, không cần đổi gì.', removed: 'Đã gỡ hook: statusLine của Claude Code về như trước.',
    notTracked: 'Chưa bật theo dõi hạn mức nên không có gì để gỡ.',
    chooseStyle: 'Chọn style', styleTitle: 'Claude Code Usage: chọn style status bar (↑ ↓ để xem trước)', custom: 'Tự viết…',
    customDesc: 'Template của riêng bạn', customPrompt: 'Ví dụ: $(flame) {5h} | {7d} | ctx {ctxPct}. Biến: {vars}',
    current: 'đang dùng',
    tipSession: '$(arrow-small-right) {turns} lượt · {tokens} token trong phiên này', tipToday: '**Hôm nay** {tokens} token · ≈${cost} · {prompts} prompt',
    tipBurn: '**Tốc độ** {rate} token/giờ (30 phút qua)', tipModels: '**Model hôm nay** {list}', openUsage: 'Mở Usage', panelTitle: 'Claude Code Usage',
  },
  en: {
    usageSetup: 'No 5h/7d numbers yet. Click to open Usage and set up quota tracking: it adds a hook to Claude Code\'s statusLine (backed up, undoable).',
    usageWaiting: 'Tracking is on. The 5h/7d numbers appear after Claude Code\'s next reply.',
    setupTracking: 'Set up quota tracking', removeTracking: 'Remove quota tracking', refresh: 'Refresh', getFull: 'Full Bumeter: Overview, skills, files',
    modeRecord: 'Record only', modeRecordDetail: 'Your current status line stays as it is',
    modeShow: 'Record and show on Claude Code\'s status line', modeShowDetail: 'Adds quota and context at the end of the status line',
    apply: 'Apply', alreadyOn: 'Quota tracking is already on; nothing to change.', removed: 'Hook removed: Claude Code\'s statusLine is back as it was.',
    notTracked: 'Quota tracking is not on, so there is nothing to remove.',
    chooseStyle: 'Choose style', styleTitle: 'Claude Code Usage: status bar style (↑ ↓ to preview)', custom: 'Custom…',
    customDesc: 'Your own template', customPrompt: 'For example: $(flame) {5h} | {7d} | ctx {ctxPct}. Values: {vars}',
    current: 'current',
    tipSession: '$(arrow-small-right) {turns} turns · {tokens} tokens in this session', tipToday: '**Today** {tokens} tokens · ≈${cost} · {prompts} prompts',
    tipBurn: '**Burn** {rate} tokens/h (last 30 min)', tipModels: '**Models today** {list}', openUsage: 'Open Usage', panelTitle: 'Claude Code Usage',
  },
});
