import {build} from 'esbuild';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';

// --- 1. Bundle the site script (with Speed Insights) --------------------------
await build({
  entryPoints: ['js/script-source.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: 'js/script.js',
  platform: 'browser',
  target: ['es2020'],
}).catch(() => process.exit(1));

// --- 2. Pull the Monatsspecial posters from Sanity ---------------------------
// Runs on every build (locally via `npm run dev`, and on every Vercel deploy).
// The posters are DOWNLOADED into the site (assets/images/specials/) so they are
// served from mellifluus.com, not a third-party CDN — consistent with how the
// rest of the site avoids loading external resources without consent.
// The generated data/monatsspecial.json + assets/images/specials/ are gitignored.
const SANITY_PROJECT = 'nzfdq0wm';
const SANITY_DATASET = 'production';
const POSTER_DIR = 'assets/images/specials';
const DATA_FILE = 'data/monatsspecial.json';
const POSTER_WIDTH = 1100; // downloaded poster width in px (card is <=430px CSS, ~2x for retina)

const GROQ = `*[_type == "monatsspecial" && defined(poster.asset)] | order(coalesce(sortOrder, 999) asc, _createdAt asc){
  "url": poster.asset->url,
  "alt": coalesce(altText, ""),
  "start": coalesce(startDate, ""),
  "end": coalesce(endDate, "")
}`;

async function fetchSpecials() {
  const endpoint =
    `https://${SANITY_PROJECT}.apicdn.sanity.io/v2022-03-07/data/query/${SANITY_DATASET}` +
    `?query=${encodeURIComponent(GROQ)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Sanity query ${res.status}`);
  const {result} = await res.json();
  return Array.isArray(result) ? result : [];
}

async function downloadPoster(sanityUrl) {
  // Ask Sanity's image pipeline for a web-sized WebP instead of the raw upload.
  const res = await fetch(`${sanityUrl}?w=${POSTER_WIDTH}&q=80&fm=webp`);
  if (!res.ok) throw new Error(`poster ${res.status}`);
  const base = sanityUrl.split('/').pop().replace(/\.\w+$/, '');
  const rel = `${POSTER_DIR}/${base}.webp`;
  await writeFile(rel, Buffer.from(await res.arrayBuffer()));
  return rel;
}

async function buildMonatsspecial() {
  let specials;
  try {
    specials = await fetchSpecials();
  } catch (err) {
    console.warn(`⚠ Monatsspecial: Sanity nicht erreichbar (${err.message}).`);
    if (!existsSync(DATA_FILE)) {
      await writeFile(DATA_FILE, JSON.stringify({specials: []}, null, 2) + '\n');
    }
    return; // keep whatever data/monatsspecial.json already exists
  }

  await rm(POSTER_DIR, {recursive: true, force: true});
  await mkdir(POSTER_DIR, {recursive: true});

  const out = [];
  for (const s of specials) {
    try {
      const poster = await downloadPoster(s.url);
      out.push({poster, alt: s.alt || 'Monatsspecial', start: s.start || '', end: s.end || ''});
    } catch (err) {
      console.warn(`⚠ Monatsspecial: Poster übersprungen (${err.message})`);
    }
  }

  await writeFile(DATA_FILE, JSON.stringify({specials: out}, null, 2) + '\n');
  console.log(`✓ Monatsspecial: ${out.length} Poster von Sanity`);
}

await buildMonatsspecial();

console.log('✓ Build completed successfully');
