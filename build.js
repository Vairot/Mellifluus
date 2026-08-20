import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

// Build the main script with Speed Insights bundled in
await build({
  entryPoints: ['js/script-source.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: 'js/script.js',
  platform: 'browser',
  target: ['es2020'],
}).catch(() => process.exit(1));

console.log('✓ Build completed successfully');
