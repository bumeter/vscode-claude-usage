# Claude Code Usage — quota and context in the status bar

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/bumkom.bumeter-claude-usage?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=bumkom.bumeter-claude-usage)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/bumkom.bumeter-claude-usage)](https://marketplace.visualstudio.com/items?itemName=bumkom.bumeter-claude-usage)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

**See your Claude Code usage limits in the VS Code status bar:** how much of the **5-hour** and **weekly** quota is left, when each one resets, whether you will hit the limit before the reset, and how big this workspace's context is. 13 status bar styles to pick from, like a color theme. Local only, no account, no API key.

![Claude Code 5-hour and weekly quota in the VS Code status bar, with reset times and context in the tooltip](https://raw.githubusercontent.com/bumeter/vscode-claude-usage/main/media/screenshots/tooltip.png)

![The status bar turns yellow from 70% and red from 90% of the Claude Code limit](https://raw.githubusercontent.com/bumeter/vscode-claude-usage/main/media/screenshots/levels.png)

- **Yellow** from 70% (or when the forecast says you will run out before the reset, or the context is past its threshold), **red** from 90% or while you are blocked.
- **Hover** for reset times (`resets 14:30 · in 1h20`), the forecast, the context of this workspace's latest session, this session's turns and tokens, today's tokens, cost and prompts, the burn rate, and today's models.
- **Local only**: everything is read from Claude Code's files on the machine the workspace is on. Nothing is uploaded, no account, no API key.
- Works in remote windows (SSH, WSL, Dev Containers, Codespaces), and in Cursor and Windsurf.

## Usage view

Click the status bar item (or run **Claude Code Usage: Open Usage**) for one tab with everything about your Claude Code usage: the 5-hour and weekly quota with the forecast, tokens, estimated cost, prompts and burn rate for Today, 7 days or 30 days, this workspace's session, a daily chart, and which models and projects used the quota.

![The Usage view: quota, tokens, cost, burn rate, a daily chart and where the quota went](https://raw.githubusercontent.com/bumeter/vscode-claude-usage/main/media/screenshots/usage.png)

![The Usage view in a light theme](https://raw.githubusercontent.com/bumeter/vscode-claude-usage/main/media/screenshots/usage-light.png)

## Styles

![13 status bar styles for Claude Code usage: classic, countdown, forecast, smooth bar, split, compact, bars, traffic light, reset clock, battery, peak, context first, minimal, custom](https://raw.githubusercontent.com/bumeter/vscode-claude-usage/main/media/screenshots/styles.png)

Run **Claude Code Usage: Choose Status Bar Style** and move through the list: the status bar redraws as you go, like picking a color theme. Enter keeps the style, Escape puts the old one back.

![Choose Status Bar Style: the status bar previews each style as you move through the list](https://raw.githubusercontent.com/bumeter/vscode-claude-usage/main/media/screenshots/picker.png)

| Style | Looks like |
|---|---|
| Classic (default) | `🔥 5h 62% · 7d 41% · ctx 312K` |
| Countdown | `🔥 5h 62% ↻1h20 · 7d 41% ↻3d4h` |
| Forecast | `🔥 5h 62% → 100% at 16:40` |
| Smooth bar | `5h ███▊░░ 62% · 7d ██▌░░░` |
| Split | three items (5h, 7d, ctx), each with its own color; right-click the status bar to hide one |
| Compact | `🔥 62% · 41%` |
| Bars | `5h ▰▰▰▰▰▰▱▱▱▱  7d ▰▰▰▰▱▱▱▱▱▱` |
| Traffic light | `🟢 5h 62%  🟢 7d 41%` |
| Reset clock | `🔥 5h 62% · resets 14:20` |
| Battery | `🔋 38% · 59% left` |
| Peak | `🔥 5h 62%`, only the window closest to its limit |
| Context first | `ctx 312K ▰▰▰▰▰▰▱▱ · 5h 62%` |
| Minimal | `🔥 62`; the rest is in the tooltip |

**Custom…** takes your own template, previewed as you type, for example `$(flame) {5h} | {7d} | ctx {ctxPct}`. The values are listed under `claudeUsage.customFormat` in Settings.

## Set up (once)

Claude Code sends the quota numbers only to its status line. Run **Claude Code Usage: Set Up Quota Tracking** (or click the item) and pick:

- **Record only**: your status line stays exactly as it is; the numbers are recorded on the side.
- **Record and show on Claude Code's status line**: also adds quota and context at the end of the status line in the terminal (Linux and macOS).

It changes one line, `statusLine.command` in `~/.claude/settings.json`, shows you the change before applying it, and backs the file up. The numbers appear after Claude Code's next reply. **Remove Quota Tracking** puts the file back.

On Windows, run Remove Quota Tracking before uninstalling the extension. On Linux and macOS your status line keeps working either way.

## FAQ

**How do I see my Claude Code usage limit?** Install this extension and run **Set Up Quota Tracking** once. The 5-hour and weekly percentages then stay in the status bar, with reset times on hover.

**When does the Claude Code 5-hour limit reset?** Hover the item: it shows the clock time and the time left (`resets 14:30 · in 1h20`), or pick the **Countdown** or **Reset clock** style to keep it in view.

**Will I run out before the reset?** The **Forecast** style (and the tooltip) projects your current pace: the item turns yellow when you would hit 100% before the window resets.

**How big is my context?** The `ctx` number is the context of this workspace's latest Claude Code session; it turns yellow past its threshold, a good moment to `/compact`.

**Is the cost what I pay?** No: it is what the same tokens would cost at API prices, to compare days and models. A Pro or Max plan is a flat fee.

**Does it send my data anywhere?** No. It reads Claude Code's files on your machine; nothing is uploaded.

**Pro, Max, Team?** It shows the limits Claude Code itself reports, whatever your plan.

## Settings

| Setting | Default | |
|---|---|---|
| `claudeUsage.style` | `classic` | How the status bar draws the numbers; see [Styles](#styles) |
| `claudeUsage.customFormat` | empty | The template of the `custom` style |
| `claudeUsage.binaryPath` | empty | Path to `bum`; empty uses the one bundled with the extension, then `PATH` |

## Part of Bumeter

Claude Code Usage is the status bar of [Bumeter](https://bumeter.cc), which reads the logs of Claude Code, Kiro and OpenCode. Want more? **Bumeter** for VS Code adds the Overview (which conversations and turns cost the most), the skill manager and Explorer marks for files agents keep reading. Install it next to this one and they share the same data; this extension then hides its item since Bumeter shows the same one.

[Bumeter for VS Code](https://marketplace.visualstudio.com/items?itemName=bumkom.bumeter) · [Desktop app](https://github.com/bumeter/bumeter) · [bum, the command line](https://github.com/bumeter/statusline)

## Develop

```
npm install
npm test                    # unit tests
npm run build               # dist/extension.js
scripts/fetch-bum.sh x86_64-unknown-linux-gnu .bum/bum
BUM_BINARY=.bum/bum BUM_PLATFORM=linux-x64 npm run bundle-bum
npx vsce package --no-dependencies --target linux-x64
```

Screenshots: `CHROME=/path/to/chrome node scripts/screenshots.mjs` (made-up numbers, real style code) writes `media/screenshots/`.

Shared code (the `bum rpc` client, the status bar item) comes from [`@bumeter/vscode-kit`](https://github.com/bumeter/vscode-kit), `bum` from [bumeter/statusline](https://github.com/bumeter/statusline) releases (`BUM_VERSION`). Tagging `vX.Y.Z` builds one `.vsix` per platform and attaches them to a GitHub Release.

Not affiliated with Anthropic; Claude is a trademark of Anthropic. License: GPL-3.0-or-later. Source: [bumeter/vscode-claude-usage](https://github.com/bumeter/vscode-claude-usage).
