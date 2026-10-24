# Claude Code Usage — quota and context in the status bar

How much of your Claude Code **5-hour** and **weekly** limit is left, when it resets, and how big this workspace's context is, always in view:

```
🔥 5h 62% · 7d 41% · ctx 312K
```

- **Yellow** from 70% (or when the forecast says you will run out before the reset, or the context is past its threshold), **red** from 90% or while you are blocked.
- **Hover** for reset times (`resets 14:30 · in 1h20`), the forecast, and the context of this workspace's latest session, with a hint to `/compact` when it is too big.
- **Local only**: everything is read from Claude Code's files on the machine the workspace is on. Nothing is uploaded, no account, no API key.
- Works in remote windows (SSH, WSL, Dev Containers, Codespaces), and in Cursor and Windsurf.

## Set up (once)

Claude Code sends the quota numbers only to its status line. Run **Claude Code Usage: Set Up Quota Tracking** (or click the item) and pick:

- **Record only**: your status line stays exactly as it is; the numbers are recorded on the side.
- **Record and show on Claude Code's status line**: also adds quota and context at the end of the status line in the terminal (Linux and macOS).

It changes one line, `statusLine.command` in `~/.claude/settings.json`, shows you the change before applying it, and backs the file up. The numbers appear after Claude Code's next reply. **Remove Quota Tracking** puts the file back.

On Windows, run Remove Quota Tracking before uninstalling the extension. On Linux and macOS your status line keeps working either way.

## Settings

| Setting | Default | |
|---|---|---|
| `claudeUsage.binaryPath` | empty | Path to `bum`; empty uses the one bundled with the extension, then `PATH` |

## Part of Bumeter

Claude Code Usage is the status bar of [Bumeter](https://bumeter.cc), which reads the logs of Claude Code, Kiro and OpenCode. Want more? **Bumeter** for VS Code adds the Overview (which conversations and turns cost the most), the skill manager and Explorer marks for files agents keep reading. Install it next to this one and they share the same data; this extension then hides its item since Bumeter shows the same one.

[Bumeter for VS Code](https://marketplace.visualstudio.com/items?itemName=bumkom.bumeter) · [Desktop app](https://github.com/bumeter/bumeter) · [bum, the command line](https://github.com/bumeter/statusline)

Not affiliated with Anthropic. License: GPL-3.0-or-later. Source: [bumeter/vscode](https://github.com/bumeter/vscode).
