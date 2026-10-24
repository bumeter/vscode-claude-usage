// Bundle each product into one CommonJS file; `vscode` is provided by the editor at run time.
// Bumeter is the repository root; the others live in products/<name>/ with their own package.json.
import { build, context } from 'esbuild';

const base = { bundle: true, platform: 'node', format: 'cjs', target: 'node18', external: ['vscode'], sourcemap: true, logLevel: 'info' };
const products = [
  { ...base, entryPoints: ['src/extension.ts'], outfile: 'dist/extension.js' },
  { ...base, entryPoints: ['src/usage/extension.ts'], outfile: 'products/usage/dist/extension.js' },
];
if (process.argv.includes('--watch')) for (const p of products) (await context(p)).watch();
else await Promise.all(products.map((p) => build(p)));
