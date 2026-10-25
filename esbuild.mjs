// Two bundles: the extension (Node, CommonJS; `vscode` comes from the editor) and the Usage page (browser).
import { copyFileSync, mkdirSync } from 'node:fs';
import { build, context } from 'esbuild';

const common = { bundle: true, sourcemap: true, logLevel: 'info' };
const host = { ...common, entryPoints: ['src/extension.ts'], platform: 'node', format: 'cjs', target: 'node18', outfile: 'dist/extension.js', external: ['vscode'] };
const page = { ...common, entryPoints: ['webview/main.ts'], platform: 'browser', format: 'iife', target: 'es2022', outfile: 'dist/webview.js' };
const css = () => { mkdirSync('dist', { recursive: true }); copyFileSync('webview/style.css', 'dist/webview.css'); };

if (process.argv.includes('--watch')) {
  css();
  await Promise.all([(await context(host)).watch(), (await context(page)).watch()]);
} else {
  await Promise.all([build(host), build(page)]);
  css();
}
