import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The extension's parts run in plain Node with a small `vscode` stub; webview tests pick jsdom with @vitest-environment.
export default defineConfig({
  resolve: { alias: { vscode: fileURLToPath(new URL('./test/vscode.ts', import.meta.url)) } },
  test: { include: ['test/**/*.test.ts'] },
});
