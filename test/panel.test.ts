import { describe, expect, it } from 'vitest';
import { buildHtml, handleMessage } from '../src/panel';
import type { PanelDeps } from '../src/panel';

describe('panel', () => {
  it('the page: strict CSP, nonce on the script, the language on <html>', () => {
    const html = buildHtml({ scriptUri: 'vs://w.js', styleUri: 'vs://w.css', cspSource: 'vs:', nonce: 'N1', lang: 'vi' });
    expect(html).toContain(`default-src 'none'; style-src vs:; img-src vs: data:; script-src 'nonce-N1'`);
    expect(html).toContain('<html lang="vi">');
    expect(html).toContain('<script nonce="N1" src="vs://w.js"></script>');
  });

  it('routes the page\'s messages; an unknown range is ignored', () => {
    const got: string[] = [];
    const d: PanelDeps = { ready: () => got.push('ready'), range: (r) => got.push(`range:${r}`), setup: () => got.push('setup'), getFull: () => got.push('getFull') };
    handleMessage({ type: 'ready' }, d);
    handleMessage({ type: 'range', range: '30d' }, d);
    handleMessage({ type: 'range', range: 'year' as never }, d);
    handleMessage({ type: 'setup' }, d);
    handleMessage({ type: 'getFull' }, d);
    expect(got).toEqual(['ready', 'range:30d', 'setup', 'getFull']);
  });
});
