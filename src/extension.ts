// Claude Code Usage (by Bumeter): the 5-hour and weekly quota and this workspace's context in the
// status bar, nothing else. It bundles its own `bum` and sets up the statusLine hook that records the
// quota numbers, so it works without the Bumeter app. Next to the full Bumeter extension it hides its
// item (Bumeter shows the same one) and keeps its commands.
import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { ensureExecutable, findBum } from '../binary';
import { langOf, t } from '../format';
import type { Lang } from '../format';
import { projectOf } from '../project';
import { RpcClient } from '../rpc';
import { StatusBar } from '../status';
import type { StatusOptions } from '../status';
import { isTracked, needsRepoint } from './tracking';
import type { StatuslineStatus } from './tracking';

/** The full Bumeter extension. */
export const FULL_ID = 'bumkom.bumeter';

type Mode = 'record' | 'show';
interface Settings { statusline: StatuslineStatus; statusline_show: boolean }

let rpc: RpcClient | undefined;

export function usageOptions(tracked: boolean): StatusOptions {
  return {
    id: 'claudeUsage.status',
    name: 'Claude Code Usage',
    click: 'claudeUsage.click',
    fallback: tracked ? '5h/7d …' : '5h/7d: set up',
    noLimits: tracked ? 'usageWaiting' : 'usageSetup',
    links: [
      ...(tracked ? [] : [{ key: 'setupTracking' as const, command: 'claudeUsage.setupTracking' }]),
      { key: 'refresh', command: 'claudeUsage.refresh' },
      { key: 'getFull', command: 'claudeUsage.getFull' },
    ],
  };
}

async function settings(c: RpcClient): Promise<Settings | null> {
  return c.call<Settings>('settings:get').catch(() => null);
}

/** Asks how to hook, shows bum's own description of the change, applies it on confirm. */
async function setUp(c: RpcClient, lang: Lang): Promise<boolean> {
  const s = await settings(c);
  let mode: Mode = 'record';
  if (s?.statusline_show) {
    const pick = await vscode.window.showQuickPick(
      [
        { label: t(lang, 'modeRecord'), detail: t(lang, 'modeRecordDetail'), mode: 'record' as Mode },
        { label: t(lang, 'modeShow'), detail: t(lang, 'modeShowDetail'), mode: 'show' as Mode },
      ],
      { title: `Claude Code Usage: ${t(lang, 'setupTracking')}` },
    );
    if (!pick) return false;
    mode = pick.mode;
  }
  const plan = await c.call<{ description: string; noop: boolean }>('settings:statusline_plan', { mode });
  if (plan.noop) {
    void vscode.window.showInformationMessage(t(lang, 'alreadyOn'));
    return true;
  }
  const ok = await vscode.window.showInformationMessage(t(lang, 'setupTracking'), { modal: true, detail: plan.description }, t(lang, 'apply'));
  if (ok !== t(lang, 'apply')) return false;
  await c.call('settings:statusline_apply', { mode });
  void vscode.window.showInformationMessage(t(lang, 'usageWaiting'));
  return true;
}

export function activate(ctx: vscode.ExtensionContext): void {
  const lang = langOf(vscode.env.language);
  const bin = findBum({ setting: vscode.workspace.getConfiguration('claudeUsage').get<string>('binaryPath', ''), extensionPath: ctx.extensionPath });
  if (!bin) {
    const item = vscode.window.createStatusBarItem('claudeUsage.status', vscode.StatusBarAlignment.Right, 100);
    item.text = '$(flame) $(warning)';
    item.tooltip = t(lang, 'noBum');
    item.command = { title: 'Settings', command: 'workbench.action.openSettings', arguments: ['claudeUsage.binaryPath'] };
    item.show();
    ctx.subscriptions.push(item);
    return;
  }
  if (bin.startsWith(ctx.extensionPath)) ensureExecutable(bin);
  const c = (rpc = RpcClient.forBinary(bin));
  const opts = usageOptions(false);
  const status = new StatusBar(c, projectOf(vscode.workspace.workspaceFolders), lang, opts);
  let tracked = false;

  /** Reads the hook's state, points an outdated hook at our `bum`, then redraws. */
  const sync = async () => {
    const s = await settings(c);
    if (s && needsRepoint(s.statusline, bin, (p) => fs.existsSync(p))) {
      const mode: Mode = s.statusline.kind === 'hooked' && s.statusline.show ? 'show' : 'record';
      await c.call('settings:statusline_apply', { mode }).catch(() => undefined);
    }
    tracked = isTracked(s?.statusline);
    Object.assign(opts, usageOptions(tracked));
    await status.refresh();
  };
  const full = () => vscode.extensions.getExtension(FULL_ID) !== undefined;
  status.setHidden(full());

  ctx.subscriptions.push(
    status,
    { dispose: () => rpc?.dispose() },
    vscode.extensions.onDidChange(() => status.setHidden(full())),
    vscode.commands.registerCommand('claudeUsage.refresh', () => void sync()),
    vscode.commands.registerCommand('claudeUsage.click', () => (tracked ? void sync() : vscode.commands.executeCommand('claudeUsage.setupTracking'))),
    vscode.commands.registerCommand('claudeUsage.setupTracking', async () => {
      try {
        if (await setUp(c, lang)) await sync();
      } catch (e) {
        void vscode.window.showErrorMessage(`Claude Code Usage: ${(e as Error).message}`);
      }
    }),
    vscode.commands.registerCommand('claudeUsage.removeTracking', async () => {
      const s = await settings(c);
      if (!isTracked(s?.statusline)) {
        void vscode.window.showInformationMessage(t(lang, 'notTracked'));
        return;
      }
      try {
        await c.call('settings:statusline_undo');
        void vscode.window.showInformationMessage(t(lang, 'removed'));
        await sync();
      } catch (e) {
        void vscode.window.showErrorMessage(`Claude Code Usage: ${(e as Error).message}`);
      }
    }),
    vscode.commands.registerCommand('claudeUsage.getFull', () => vscode.commands.executeCommand('extension.open', FULL_ID)),
    c.onEvent((e) => {
      if (e.event === 'scanning') status.scanning();
      else if (e.event === 'host' || e.event === 'data_changed') void status.refresh();
    }) as unknown as vscode.Disposable,
  );
  void sync();
}

export function deactivate(): void {
  rpc?.dispose();
  rpc = undefined;
}
