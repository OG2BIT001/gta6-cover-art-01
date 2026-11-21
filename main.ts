// Neon Coast Cover Studio — hand-in program for the gta6-cover-art-01 bounty (Node 22, standard library only).
//
// The entry itself is the static web app in app/ (it opens offline in a desktop browser and never touches the
// network). This program hands it in: it copies app/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with buildDossier from the vendored make.fun library, under the
// gate's own caps, so the dossier the judge reads is exactly the one the scorer rebuilds. The program is
// deterministic: the same repository always produces the same output bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To try the app itself, serve app/ with any static file server (see serve.ts) and open it in a browser.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps (reference/gate.json): dossier text at most 160 KiB, at most 4 screenshots of at most
// 256 KiB each, app/ at most 993 files and 48 MiB in all, no path under app/ over 1,000 bytes.
const DOSSIER_LIMITS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 50_331_648,
  app_path_max_bytes: 1_000,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_LIMITS));
