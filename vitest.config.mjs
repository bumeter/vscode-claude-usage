import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests run in plain Node on the parts that do not need `vscode`.
export default defineConfig({
  resolve: { alias: { vscode: fileURLToPath(new URL('./test/vscode.ts', import.meta.url)) } },
  test: { include: ['test/**/*.test.ts'] },
});
