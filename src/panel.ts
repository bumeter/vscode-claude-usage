// The Usage tab: a webview with our own page (webview/). The extension sends the numbers; the page
// only asks for another range, to set up tracking, or for Bumeter.
import * as vscode from 'vscode';
import type { Lang } from '@bumeter/vscode-kit/format';
import { t } from './strings';
import { isRange } from './usage';
import type { Range, UsageData } from './usage';

export type FromPage = { type: 'ready' } | { type: 'range'; range: Range } | { type: 'setup' } | { type: 'getFull' };
export interface PageState { data: UsageData; tracked: boolean; project: string | null }
export type ToPage = { type: 'data'; state: PageState };
export interface PanelDeps { ready(): void; range(r: Range): void; setup(): void; getFull(): void }

/** The page. Pure, for tests. */
export function buildHtml(o: { scriptUri: string; styleUri: string; cspSource: string; nonce: string; lang: Lang }): string {
  const csp = [`default-src 'none'`, `style-src ${o.cspSource}`, `img-src ${o.cspSource} data:`, `script-src 'nonce-${o.nonce}'`].join('; ');
  return `<!DOCTYPE html>
<html lang="${o.lang}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${o.styleUri}">
<title>Claude Code Usage</title>
</head>
<body>
<main id="app"></main>
<script nonce="${o.nonce}" src="${o.scriptUri}"></script>
</body>
</html>`;
}

/** One message from the page. Pure given `d`, for tests. */
export function handleMessage(m: FromPage, d: PanelDeps): void {
  switch (m.type) {
    case 'ready': return d.ready();
    case 'range': if (isRange(m.range)) d.range(m.range); return;
    case 'setup': return d.setup();
    case 'getFull': return d.getFull();
  }
}

function nonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 32; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

export class UsagePanel implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly extensionUri: vscode.Uri, private readonly lang: Lang, private readonly deps: PanelDeps) {}

  get isOpen(): boolean {
    return !!this.panel;
  }

  /** Opens the tab, or brings the open one to the front. */
  open(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }
    const dist = vscode.Uri.joinPath(this.extensionUri, 'dist');
    const panel = (this.panel = vscode.window.createWebviewPanel('claudeUsage.panel', t(this.lang, 'panelTitle'), vscode.ViewColumn.Active, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [dist],
    }));
    panel.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'icon.png');
    const w = panel.webview;
    w.html = buildHtml({
      scriptUri: w.asWebviewUri(vscode.Uri.joinPath(dist, 'webview.js')).toString(),
      styleUri: w.asWebviewUri(vscode.Uri.joinPath(dist, 'webview.css')).toString(),
      cspSource: w.cspSource,
      nonce: nonce(),
      lang: this.lang,
    });
    w.onDidReceiveMessage((m: FromPage) => handleMessage(m, this.deps));
    panel.onDidDispose(() => (this.panel = undefined));
  }

  post(m: ToPage): void {
    void this.panel?.webview.postMessage(m);
  }

  dispose(): void {
    this.panel?.dispose();
  }
}
