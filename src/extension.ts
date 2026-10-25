// Claude Code Usage (by Bumeter): the 5-hour and weekly quota and this workspace's context in the
// status bar, nothing else. It bundles its own `bum` and sets up the statusLine hook that records the
// quota numbers, so it works without the Bumeter app. Next to the full Bumeter extension it hides its
// item (Bumeter shows the same one) and keeps its commands.
import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { ensureExecutable, findBum, langOf, projectOf, RpcClient, StatusBar, t as shared } from '@bumeter/vscode-kit';
import type { Lang } from '@bumeter/vscode-kit';
import { ALERT_AT, dueAlerts } from './alerts';
import { coalesce, latest } from './coalesce';
import { usageOptions } from './options';
import type { Look } from './options';
import { UsagePanel } from './panel';
import { chooseStyle } from './picker';
import { t } from './strings';
import { styleSetting } from './styles';
import { isTracked, needsRepoint } from './tracking';
import type { StatuslineStatus } from './tracking';
import { fetchUsage, isRange, tooltipExtra } from './usage';
import type { Range, UsageData } from './usage';

/** The full Bumeter extension. */
export const FULL_ID = 'bumkom.bumeter';

type Mode = 'record' | 'show';
interface Settings { statusline: StatuslineStatus; statusline_show: boolean }

let rpc: RpcClient | undefined;
/** The alert keys already shown (see alerts.ts), in globalState. */
const ALERTED = 'claudeUsage.alerted';

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
    item.tooltip = shared(lang, 'noBum');
    item.command = { title: 'Settings', command: 'workbench.action.openSettings', arguments: ['claudeUsage.binaryPath'] };
    item.show();
    ctx.subscriptions.push(item, vscode.commands.registerCommand('claudeUsage.open', () => void vscode.window.showWarningMessage(shared(lang, 'noBum'))));
    return;
  }
  if (bin.startsWith(ctx.extensionPath)) ensureExecutable(bin);
  const c = (rpc = RpcClient.forBinary(bin));
  const look = (): Look => {
    const cfg = vscode.workspace.getConfiguration('claudeUsage');
    return { style: styleSetting(cfg.get('style')), template: cfg.get<string>('customFormat', '') };
  };
  const project = projectOf(vscode.workspace.workspaceFolders);
  const saved = ctx.workspaceState.get('claudeUsage.range');
  let range: Range = isRange(saved) ? saved : 'today';
  let data: UsageData | undefined;
  let dataFull = false;
  let tracked = false;
  const extra = () => (data ? tooltipExtra(data, lang, project) : '');
  const opts = usageOptions(false, lang, look(), extra);
  const status = new StatusBar(c, project, lang, opts);

  const push = () => {
    if (data && dataFull) panel.post({ type: 'data', state: { data, tracked, project } });
  };
  /** Reads every number again, for the tooltip and, while it is open, the page. A sequence guard
   * drops a slower, older fetch that resolves after a newer one. */
  const reload = latest(
    async () => {
      const full = panel.isOpen;
      return { d: await fetchUsage(c, project, range, Date.now(), full), full };
    },
    ({ d, full }) => {
      data = d;
      dataFull = full;
      status.redraw();
      push();
      notify(d);
    },
  );
  const load = coalesce(reload, 2_000);
  // With the page closed only the tooltip needs these numbers: read them less often.
  const loadSlow = coalesce(reload, 15_000);
  const panel = new UsagePanel(ctx.extensionUri, lang, {
    ready: push,
    range: (r) => {
      range = r;
      void ctx.workspaceState.update('claudeUsage.range', r);
      void reload();
    },
    setup: () => void vscode.commands.executeCommand('claudeUsage.setupTracking'),
    getFull: () => void vscode.commands.executeCommand('claudeUsage.getFull'),
  });

  /** Reads the hook's state, points an outdated hook at our `bum`, then redraws. */
  const sync = async () => {
    const s = await settings(c);
    if (s && needsRepoint(s.statusline, bin, (p) => fs.existsSync(p))) {
      const mode: Mode = s.statusline.kind === 'hooked' && s.statusline.show ? 'show' : 'record';
      await c.call('settings:statusline_apply', { mode }).catch(() => undefined);
    }
    tracked = isTracked(s?.statusline);
    Object.assign(opts, usageOptions(tracked, lang, look(), extra));
    await status.refresh();
    load();
  };
  const full = () => vscode.extensions.getExtension(FULL_ID) !== undefined;
  status.setHidden(full());
  /** Shows the quota and context alerts that are due, each once: what was shown is kept across restarts.
   * None while full Bumeter is installed, which has its own. */
  const notify = (d: UsageData) => {
    const cfg = vscode.workspace.getConfiguration('claudeUsage');
    if (!cfg.get<boolean>('alerts', true) || full()) return;
    const at = (cfg.get<unknown[]>('alertAt') ?? ALERT_AT).filter((x): x is number => typeof x === 'number' && x > 0 && x <= 100);
    const shown = ctx.globalState.get<string[]>(ALERTED, []);
    const due = dueAlerts(d, lang, at, (k) => shown.includes(k));
    if (!due.length) return;
    void ctx.globalState.update(ALERTED, [...shown, ...due.flatMap((a) => a.keys)].slice(-100));
    for (const a of due) {
      const show = a.level === 'warning' ? vscode.window.showWarningMessage : vscode.window.showInformationMessage;
      void show(`Claude Code Usage: ${a.text}`, t(lang, 'openUsage'), t(lang, 'alertMute')).then(async (pick) => {
        if (pick === t(lang, 'openUsage')) await vscode.commands.executeCommand('claudeUsage.open');
        else if (pick === t(lang, 'alertMute')) {
          await cfg.update('alerts', false, vscode.ConfigurationTarget.Global);
          void vscode.window.showInformationMessage(t(lang, 'alertMuted'));
        }
      });
    }
  };
  /** Claude Code wrote something: read again, often while the page is open, not at all while full Bumeter hides our item. */
  const wake = () => (panel.isOpen ? load() : full() ? undefined : loadSlow());
  const poll = setInterval(wake, 60_000);

  ctx.subscriptions.push(
    status,
    panel,
    { dispose: () => clearInterval(poll) },
    { dispose: () => rpc?.dispose() },
    vscode.extensions.onDidChange(() => status.setHidden(full())),
    vscode.commands.registerCommand('claudeUsage.refresh', () => void sync()),
    vscode.commands.registerCommand('claudeUsage.open', () => {
      panel.open();
      void reload();
    }),
    vscode.commands.registerCommand('claudeUsage.chooseStyle', () => chooseStyle(status, opts, lang, look())),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration('claudeUsage.style') && !e.affectsConfiguration('claudeUsage.customFormat')) return;
      Object.assign(opts, look());
      status.redraw();
    }),
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
      else if (e.event === 'host' || e.event === 'data_changed') {
        void status.refresh();
        wake();
      }
    }) as unknown as vscode.Disposable,
  );
  void sync();
}

export function deactivate(): void {
  rpc?.dispose();
  rpc = undefined;
}
