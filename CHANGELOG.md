# Changelog

## 0.3.1

- The weekly reset shows its day ("resets Thu 01:23"), and the quota bars line up.
- The tooltip puts this session's turns and tokens right under its context line, and only while the session is current (30 minutes, like the context line). The Usage view calls an older one "Latest session".
- A small change against the previous period ("+5% vs previous period") is no longer red: red or green starts at 20%.
- Burn rate is labelled "now": it is always the last 30 minutes, whatever the range.
- The daily chart marks today and shows the peak and average day; a narrow model or project slice shows only its share (the name is on hover).
- Less work in the background: with the Usage view closed, numbers are read at most every 15 seconds, and not at all while full Bumeter hides the item.

## 0.3.0

- **Usage view**: click the status bar item (or run **Open Usage**) for the quota and its forecast, tokens, estimated cost, prompts and burn rate for Today, 7 or 30 days, this session, a daily chart, and which models and projects used the quota. Bumeter's Overview look, light and dark.
- The tooltip shows more: this session's turns and tokens, today's tokens, cost and prompts, the burn rate and today's models, with coloured percentages.

## 0.2.2

- New icon: the quota gauge, orange on a dark tile, in place of the purple one.

## 0.2.1

- New icon: a quota gauge with the Bumeter flame.
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
