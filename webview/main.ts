// The Usage page: draws what the extension sends, asks for it once ready.
import type { ToPage } from '../src/panel';
import { setLang } from './strings';
import { mountUsage } from './view';

declare function acquireVsCodeApi(): { postMessage(m: unknown): void };

const api = acquireVsCodeApi();
setLang(document.documentElement.lang);
const view = mountUsage(document.getElementById('app')!, { post: (m) => api.postMessage(m) });
window.addEventListener('message', (e: MessageEvent<ToPage>) => {
  if (e.data?.type === 'data') view.show(e.data.state);
});
setInterval(() => view.tick(), 30_000);
api.postMessage({ type: 'ready' });
