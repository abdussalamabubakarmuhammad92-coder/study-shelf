// Copies the Vite build into backend/static so Django can serve the SPA
// and the API from a single origin (http://localhost:8000).
import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '..', 'dist');
const backendStatic = resolve(here, '..', '..', 'backend', 'static');

if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

rmSync(backendStatic, { recursive: true, force: true });
mkdirSync(backendStatic, { recursive: true });
cpSync(dist, backendStatic, { recursive: true });
console.log(`Copied dist/ → ${backendStatic}`);
