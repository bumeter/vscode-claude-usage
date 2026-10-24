# Changelog

## 0.1.0

First release.

- Status bar: Claude Code's 5-hour and weekly quota and this workspace's latest context (`5h 62% · 7d 41% · ctx 312K`), yellow from 70%, red from 90% or when blocked. Hover for reset times and the forecast.
- Set Up Quota Tracking: adds the hook to Claude Code's `statusLine` that records the numbers, either keeping your status line as it is or adding quota and context to it. Backed up; Remove Quota Tracking puts it back.
- Bundles `bum`; works in remote windows (SSH, WSL, Dev Containers, Codespaces).
- Next to the full Bumeter extension it hides its own item, since Bumeter shows the same one.
