import * as esbuild from 'esbuild';
import fs from 'node:fs';

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/index.ts', 'src/options.ts'],
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  format: 'iife',
  target: 'es2017',
  minify: true,
};

function copyStatic() {
  fs.mkdirSync('dist/icons', { recursive: true });
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  fs.copyFileSync('src/options.html', 'dist/options.html');
  for (const size of [16, 48, 128]) {
    fs.copyFileSync(`icons/icon-${size}.png`, `dist/icons/icon-${size}.png`);
  }
}

async function run() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    copyStatic();
    console.log('esbuild: watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    copyStatic();
  }
}

run().catch(() => process.exit(1));
