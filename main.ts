// HematRumah hand-in program (Node 22, standard library only).
//
// The site itself lives in app/ as plain static files and screenshots/ holds
// the maker's own renders of it. This program delivers both: it copies app/
// and screenshots/ from the repository root into the output directory and
// then writes dossier.json there with buildDossier from the vendored
// make.fun frontend library, exactly as the scorer rebuilds it.
//
// The output directory comes from MAKEFUN_OUTPUT_DIR when set and defaults
// to /output, which is what the grader mounts. The directory itself is never
// removed; if stale files from an earlier hand-in are present, only their
// contents are cleared so a re-run cannot leave orphaned files behind.
// Running the program twice over the same repository writes the same bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Remove everything inside a directory without removing the directory.
function emptyContents(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

mkdirSync(outputDir, { recursive: true });
emptyContents(join(outputDir, 'app'));
emptyContents(join(outputDir, 'screenshots'));
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier limits mirror the scorer's caps: at most 4 screenshots of
// 256 KiB each, at most 993 files and directories and 16 MiB inside app/,
// and a source text window of 160 KiB.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);

const shotCount = existsSync(join(outputDir, 'screenshots'))
  ? readdirSync(join(outputDir, 'screenshots')).length
  : 0;
console.log(`HematRumah handed in: app/ copied, ${shotCount} screenshot(s), dossier.json written.`);
