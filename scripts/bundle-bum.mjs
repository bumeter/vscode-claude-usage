// Copies the `bum` given in BUM_BINARY into bin/<BUM_PLATFORM>/, where the extension looks first.
// The release workflow fetches one `bum` per platform with scripts/fetch-bum.sh and runs this once for each.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ext = join(dirname(fileURLToPath(import.meta.url)), '..');
const os = process.platform === 'win32' ? 'win32' : process.platform === 'darwin' ? 'darwin' : 'linux';
const platform = process.env.BUM_PLATFORM ?? `${os}-${process.arch}`;
const exe = platform.startsWith('win32') ? 'bum.exe' : 'bum';
const bum = process.env.BUM_BINARY ?? '';
// One platform per package: a `bum` left over from another build would ship in the wrong .vsix.
rmSync(join(ext, 'bin'), { recursive: true, force: true });
if (!existsSync(bum)) {
  console.error(bum ? `BUM_BINARY=${bum} does not exist` : 'set BUM_BINARY to the `bum` to bundle');
  process.exit(1);
}
mkdirSync(join(ext, 'bin', platform), { recursive: true });
cpSync(bum, join(ext, 'bin', platform, exe));
console.log(`bundled ${bum} as bin/${platform}/${exe}`);
