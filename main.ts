// Neon Vice — Cover Art Studio: the program that hands the entry in.
//
// The entry itself is the app/ folder beside this file: plain static
// files (an HTML page, ES modules, a bundled OFL font and two sample
// artworks) that a desktop browser runs fully offline. This program
// copies app/ and screenshots/ into the output directory and writes
// dossier.json there with the kit's vendored buildDossier, byte for
// byte the way the gate rebuilds it. Node 22, standard library only.
//
// Run it the way the grader does, with MAKEFUN_OUTPUT_DIR naming the
// output folder outside the grader's container:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own (the gate's gate.json): the text
// cap shapes the dossier's bytes, and the rest refuse an entry the
// scorer would refuse anyway — too many or too heavy screenshots, an
// app/ over its file or byte budget, a path that runs too long.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
console.log(`neon-vice: app and screenshots copied, dossier.json written (${dossierText.length} bytes) to ${outputDir}`);
