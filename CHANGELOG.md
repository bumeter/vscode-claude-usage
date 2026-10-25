# Changelog

## 0.2.1

- New icon: a quota gauge with the Bumeter flame, orange on a dark tile.
- Screenshots of every style, the tooltip and the picker on the Marketplace page, and an FAQ.

## 0.2.0

- **Status bar styles**: Choose Status Bar Style lists 13 ways to draw the numbers (Countdown, Forecast, Smooth bar, Split, Traffic light, Battery, …) and previews each on the status bar as you move through the list, like picking a color theme. **Custom…** takes your own template (`claudeUsage.customFormat`). Classic stays the default.
- The tooltip links to the picker.

## 0.1.1

- Marketplace ID is now `bumkom.bumeter-claude-usage` (the name `claude-usage` was taken). Nothing else changes.

## 0.1.0

First release.

- Status bar: Claude Code's 5-hour and weekly quota and this workspace's latest context (`5h 62% · 7d 41% · ctx 312K`), yellow from 70%, red from 90% or when blocked. Hover for reset times and the forecast.
- Set Up Quota Tracking: adds the hook to Claude Code's `statusLine` that records the numbers, either keeping your status line as it is or adding quota and context to it. Backed up; Remove Quota Tracking puts it back.
- Bundles `bum`; works in remote windows (SSH, WSL, Dev Containers, Codespaces).
- Next to the full Bumeter extension it hides its own item, since Bumeter shows the same one.
