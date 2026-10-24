// The status bar item's texts and links, before and after the quota tracking hook is set up. No `vscode`
// here, so it is tested in plain Node.
import type { Lang } from '@bumeter/vscode-kit/format';
import type { StatusOptions } from '@bumeter/vscode-kit/status';
import { t } from './strings';

export function usageOptions(tracked: boolean, lang: Lang): StatusOptions {
  return {
    id: 'claudeUsage.status',
    name: 'Claude Code Usage',
    click: 'claudeUsage.click',
    fallback: tracked ? '5h/7d …' : '5h/7d: set up',
    noLimits: t(lang, tracked ? 'usageWaiting' : 'usageSetup'),
    links: [
      ...(tracked ? [] : [{ label: t(lang, 'setupTracking'), command: 'claudeUsage.setupTracking' }]),
      { label: t(lang, 'refresh'), command: 'claudeUsage.refresh' },
      { label: t(lang, 'getFull'), command: 'claudeUsage.getFull' },
    ],
  };
}
