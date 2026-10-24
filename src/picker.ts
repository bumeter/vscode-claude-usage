// Choose Status Bar Style: a list like the color theme picker. Moving through it redraws the status bar
// with that style; Enter keeps it, Escape puts the old one back. Custom… takes a template, previewed as
// you type.
import * as vscode from 'vscode';
import type { Lang, StatusBar, StatusOptions } from '@bumeter/vscode-kit';
import { TEMPLATE_VARS } from '@bumeter/vscode-kit/styles';
import type { StyleChoice } from '@bumeter/vscode-kit/styles';
import type { Look } from './options';
import { t } from './strings';
import { DEFAULT_TEMPLATE, styleList } from './styles';

type Item = vscode.QuickPickItem & { style?: StyleChoice };

/** Shows `look` on the bar now, without saving it. */
function preview(bar: StatusBar, opts: StatusOptions, look: Look): void {
  opts.style = look.style;
  opts.template = look.template;
  bar.redraw();
}

async function save(look: Look): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('claudeUsage');
  await cfg.update('style', look.style, vscode.ConfigurationTarget.Global);
  if (look.style === 'custom') await cfg.update('customFormat', look.template, vscode.ConfigurationTarget.Global);
}

function customTemplate(bar: StatusBar, opts: StatusOptions, lang: Lang, saved: Look): Promise<void> {
  return new Promise((resolve) => {
    const box = vscode.window.createInputBox();
    let done = false;
    box.title = `Claude Code Usage: ${t(lang, 'custom')}`;
    box.value = saved.template || DEFAULT_TEMPLATE;
    box.prompt = t(lang, 'customPrompt', { vars: TEMPLATE_VARS.map((v) => `{${v}}`).join(' ') });
    const show = () => preview(bar, opts, { style: 'custom', template: box.value });
    box.onDidChangeValue(show);
    box.onDidAccept(async () => {
      done = true;
      box.hide();
      await save({ style: 'custom', template: box.value });
    });
    box.onDidHide(() => {
      if (!done) preview(bar, opts, saved);
      box.dispose();
      resolve();
    });
    box.show();
    show();
  });
}

export function chooseStyle(bar: StatusBar, opts: StatusOptions, lang: Lang, saved: Look): Promise<void> {
  return new Promise((resolve) => {
    const qp = vscode.window.createQuickPick<Item>();
    const mark = (s: StyleChoice) => (s === saved.style ? ` · ${t(lang, 'current')}` : '');
    qp.title = t(lang, 'styleTitle');
    qp.items = [
      ...styleList(lang).map((s): Item => ({ label: s.name, description: s.description + mark(s.id), style: s.id })),
      { label: '', kind: vscode.QuickPickItemKind.Separator },
      { label: `$(edit) ${t(lang, 'custom')}`, description: t(lang, 'customDesc') + mark('custom'), style: 'custom' },
    ];
    const current = qp.items.find((i) => i.style === saved.style);
    if (current) qp.activeItems = [current];
    let picked: StyleChoice | undefined;
    qp.onDidChangeActive(([i]) => {
      if (i?.style) preview(bar, opts, { style: i.style, template: saved.template || DEFAULT_TEMPLATE });
    });
    qp.onDidAccept(() => {
      picked = qp.selectedItems[0]?.style;
      qp.hide();
    });
    qp.onDidHide(async () => {
      qp.dispose();
      if (picked === 'custom') await customTemplate(bar, opts, lang, saved);
      else if (picked) await save({ style: picked, template: saved.template });
      else preview(bar, opts, saved);
      resolve();
    });
    qp.show();
  });
}
