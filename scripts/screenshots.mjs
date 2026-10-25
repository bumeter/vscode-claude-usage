// Screenshots for the README: the real status bar texts and tooltip (from @bumeter/vscode-kit) on made-up
// numbers, drawn like VS Code's status bar, in a headless Chrome.
//   CHROME=/path/to/chrome node scripts/screenshots.mjs        (Node 23+: it imports src/styles.ts)
// Writes media/screenshots/*.png. Fonts (codicons, emoji) come from jsDelivr and Google Fonts.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleList } from '../src/styles.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'media', 'screenshots');
const chrome = process.env.CHROME;
if (!chrome) {
  console.error('set CHROME to a Chrome or chrome-headless-shell binary');
  process.exit(1);
}

// status.js needs `vscode` only for the StatusBar class; renderStatus is pure.
const load = Module._load;
Module._load = function (request, ...rest) { return request === 'vscode' ? {} : load.call(this, request, ...rest); };
const require = createRequire(import.meta.url);
const { styleSegments, STYLE_IDS } = require('@bumeter/vscode-kit/styles');
const { renderStatus } = require('@bumeter/vscode-kit/status');

const now = Math.floor(Date.now() / 1000);
const usage = (five, seven, ctx = 312_000, atRisk = false) => ({
  five: { pct: five, resetsAt: now + 80 * 60, hitsAt: atRisk ? now + 50 * 60 : null, atRisk },
  seven: { pct: seven, resetsAt: now + 3 * 86_400 + 4 * 3600, hitsAt: null, atRisk: false },
  ctx: { tokens: ctx, threshold: 400_000 }, blockedUntil: null,
});
const u = usage(62, 41);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const icons = (s) => esc(s).replace(/\$\((\w[\w-]*)\)/g, '<i class="codicon codicon-$1"></i>');
const item = (seg) => `<span class="item ${seg.level}">${icons(seg.text)}</span>`;
const bar = (segs, extra = '') => `<div class="bar"><div><span class="item"><i class="codicon codicon-git-branch"></i> main</span><span class="item"><i class="codicon codicon-error"></i> 0 <i class="codicon codicon-warning"></i> 0</span></div><div>${extra}<span class="item">Ln 12, Col 4</span><span class="item">UTF-8</span>${segs.map(item).join('')}<span class="item"><i class="codicon codicon-bell"></i></span></div></div>`;

const HEAD = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=block">
<style>
body{margin:0;background:#1f1f1f;color:#ccc;font:13px -apple-system,"Segoe UI",Ubuntu,sans-serif,"Noto Color Emoji"}
.bar{height:22px;background:#181818;border-top:1px solid #2b2b2b;display:flex;align-items:center;justify-content:space-between;padding:0 6px;font-size:12px}
.bar>div{display:flex}.item{padding:0 6px;display:inline-flex;align-items:center;gap:3px;height:22px;white-space:pre}
.item .codicon{font-size:14px}.item.warning{background:#7a6400;color:#fff}.item.error{background:#c72e0f;color:#fff}.item.hover{background:#ffffff1f}
</style></head><body>`;

// 1. Every style, as the status bar draws it.
const rows = styleList('en').map((s) => `<div class="row"><div class="name"><b>${s.name}</b><span>${esc(s.description)}</span></div>${bar(styleSegments(s.id, u, now, 'en'))}</div>`);
rows.push(`<div class="row"><div class="name"><b>Custom…</b><span>Your own template: $(flame) {5h} | {7d} | ctx {ctxPct}</span></div>${bar(styleSegments('custom', u, now, 'en', '$(flame) {5h} | {7d} | ctx {ctxPct}'))}</div>`);
const styles = `${HEAD}<style>body{padding:18px 22px}.row{display:grid;grid-template-columns:300px 1fr;gap:18px;align-items:center;margin-bottom:10px}
.name{display:grid}.name span{color:#9d9d9d;font-size:12px}.bar{border:1px solid #2b2b2b;border-radius:4px}</style>${rows.join('')}</body></html>`;

// 2. Colours: normal, yellow from 70% (or a forecast that runs out), red from 90%.
const levels = `${HEAD}<style>body{padding:18px 22px}.row{display:grid;grid-template-columns:300px 1fr;gap:18px;align-items:center;margin-bottom:10px}.name{display:grid}.name span{color:#9d9d9d;font-size:12px}.bar{border:1px solid #2b2b2b;border-radius:4px}</style>
${[['Plenty left', usage(38, 22, 120_000)], ['Yellow from 70%', usage(76, 48)], ['Red from 90%', usage(93, 71)]].map(([n, x]) =>
  `<div class="row"><div class="name"><b>${n}</b></div>${bar(styleSegments('classic', x, now, 'en'))}</div>`).join('')}</body></html>`;

// 3. The tooltip on hover.
const limits = { five_hour: { used_percentage: 62, resets_at: now + 80 * 60 }, seven_day: { used_percentage: 41, resets_at: now + 3 * 86_400 + 4 * 3600 }, stale: false, blocked: null,
  forecast_five_hour: { hits_at: null, at_risk: false }, forecast_seven_day: { hits_at: null, at_risk: false } };
const project = { latest: { session_id: 's', ts: new Date((now - 60) * 1000).toISOString(), context: 312_000 }, context_threshold: 400_000 };
const view = renderStatus(limits, project, '~/work/my-app', 'en', now, { id: 'x', name: 'Claude Code Usage', title: 'Claude Code Usage', html: true, click: '', fallback: '', noLimits: '',
  extra: () => ['---', '**This session** · my-app: 14 turns · 1.8M tokens', '**Today** 12.4M tokens · ≈$18.20 · 46 prompts', '**Burn** 2.1M tokens/h (last 30 min)', '**Models today** Opus 71% · Sonnet 24% · Haiku 5%'].join('\n\n'),
  links: [{ label: 'Open Usage', command: '' }, { label: 'Refresh', command: '' }, { label: 'Choose style', command: '' }, { label: 'Get Bumeter', command: '' }] });
const md = (s) => s.split(/(<span style="[^"]*">|<\/span>)/).map((p, i) => (i % 2 ? p : esc(p))).join('')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[(.+?)\]\(.*?\)/g, '<a>$1</a>')
  .replace(/^---$/gm, '<hr>').split(/\n{2,}/).filter((p) => p.trim()).map((p) => (p.trim() === '<hr>' ? '<hr>' : `<p>${p.trim()}</p>`)).join('');
const tooltip = `${HEAD}<style>body{height:100vh;display:flex;flex-direction:column;justify-content:flex-end}
.tip{position:absolute;right:70px;bottom:30px;width:420px;background:#202020;border:1px solid #454545;border-radius:4px;box-shadow:0 2px 8px #0000005c;padding:10px 12px;line-height:1.5}
.tip p{margin:0 0 8px}.tip p:last-child{margin:0}.tip a{color:#4daafc}.tip code{font-family:Consolas,"DejaVu Sans Mono",monospace;color:#ffb27a}
.tip hr{border:0;border-top:1px solid #454545;margin:8px 0}</style>
<div class="tip">${md(view.tooltip)}</div>${bar(view.items.map((s) => ({ ...s, level: 'hover' })))}</body></html>`;

// 4. Choose Status Bar Style: the list, and the status bar already showing the highlighted one.
const pick = 'smooth';
const picker = `${HEAD}<style>body{height:100vh;display:flex;flex-direction:column;justify-content:space-between}
.qp{margin:8px auto 0;width:620px;background:#252526;border:1px solid #454545;border-radius:6px;box-shadow:0 0 12px #0000008c;padding:6px}
.qp .title{text-align:center;color:#ccc;font-size:12px;padding:2px 0 6px}.qp input{width:100%;box-sizing:border-box;background:#313131;border:1px solid #0078d4;color:#ccc;padding:4px 6px;font:inherit;border-radius:2px}
.qp ul{list-style:none;margin:6px 0 0;padding:0}.qp li{display:flex;gap:8px;padding:3px 8px;border-radius:3px;align-items:baseline}.qp li span{color:#9d9d9d;font-size:12px}
.qp li.on{background:#04395e;outline:1px solid #0078d4}.qp li.on span{color:#ccc}.check{width:14px}</style>
<div class="qp"><div class="title">Claude Code Usage: status bar style (↑ ↓ to preview)</div><input value="" placeholder="Type to filter">
<ul>${styleList('en').slice(0, 9).map((s) => `<li class="${s.id === pick ? 'on' : ''}"><i class="codicon ${s.id === 'classic' ? 'codicon-check' : ''} check"></i>${s.name} <span>${esc(s.description)}</span></li>`).join('')}</ul></div>
${bar(styleSegments(pick, u, now, 'en'))}</body></html>`;

// 5. The Usage view: the real page (dist/) on demo numbers, dark and light.
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const demoDays = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  const tokens = [0, 6].includes(d.getDay()) ? 1_200_000 : Math.round((6 + 14 * Math.abs(Math.sin(i * 1.3))) * 1_000_000);
  return { day: dayKey(d), from: '', to: '', tokens, prompts: Math.round(tokens / 270_000), cost_usd: tokens / 680_000 };
});
const state = {
  tracked: true, project: '~/work/my-app',
  data: { range: '7d', at: Date.now() - 11_000, limits, now: project, session: { calls: 14, weighted: 1_800_000 }, days: demoDays, burn: 2_100_000,
    modelsToday: null,
    models: [{ key: 'opus', label: 'Opus', pct: 71, tokens: 71 }, { key: 'sonnet', label: 'Sonnet', pct: 24, tokens: 24 }, { key: 'haiku', label: 'Haiku', pct: 5, tokens: 5 }],
    projects: { parts: [{ key: 'a', label: 'my-app', pct: 52, tokens: 52 }, { key: 'b', label: 'api', pct: 30, tokens: 30 }, { key: 'c', label: 'docs', pct: 18, tokens: 18 }], sessions: 23, capped: false } },
};
state.data.limits = { ...limits, five_hour: { used_percentage: 78, resets_at: now + 90 * 60 }, forecast_five_hour: { hits_at: now + 60 * 60, at_risk: true } };
const dist = join(root, 'dist');
const usagePage = (theme) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="file://${dist}/webview.css"></head>
<body class="vscode-${theme}"><main id="app"></main><script>window.acquireVsCodeApi = () => ({ postMessage() {} });</script>
<script src="file://${dist}/webview.js"></script><script>window.postMessage({ type: 'data', state: ${JSON.stringify(state)} }, '*');</script></body></html>`;

const dir = mkdtempSync(join(tmpdir(), 'usage-shots-'));
mkdirSync(out, { recursive: true });
const shots = [['styles', styles, 980, 50 + (STYLE_IDS.length + 1) * 39], ['levels', levels, 980, 150], ['tooltip', tooltip, 900, 380], ['picker', picker, 900, 330],
  ['usage', usagePage('dark'), 1100, 870], ['usage-light', usagePage('light'), 1100, 870]];
for (const [name, html, w, h] of shots) {
  const file = join(dir, `${name}.html`);
  writeFileSync(file, html);
  execFileSync(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--virtual-time-budget=5000',
    `--window-size=${w},${h}`, `--screenshot=${join(out, `${name}.png`)}`, `file://${file}`], { stdio: 'ignore' });
  console.log(`media/screenshots/${name}.png`);
}
