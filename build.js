const esbuild = require('esbuild');
const fs = require('node:fs');

async function build() {
  // Build TypeScript files
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outdir: 'dist',
    platform: 'browser',
    format: 'iife',
  });

  // Copy manifest
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
}

build().catch(() => process.exit(1));
