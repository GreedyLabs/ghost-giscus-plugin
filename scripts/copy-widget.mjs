// Copy the CDN-canonical widget files into public/ so the static demo serves
// them locally at /giscus-mount.js. The copies are gitignored.
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'public'), { recursive: true });
for (const f of ['giscus-mount.js']) {
  copyFileSync(join(ROOT, f), join(ROOT, 'public', f));
}
