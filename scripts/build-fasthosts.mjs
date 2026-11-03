#!/usr/bin/env node
/**
 * Assembles the Fasthosts (Apache + PHP + MySQL) upload folder.
 *
 *   npm run build:fasthosts          -> runs build:prod, then copies to dist/fasthosts/
 *   node scripts/build-fasthosts.mjs -> copy only (assumes build:prod already ran)
 *
 * Everything in dist/fasthosts/ goes into the Fasthosts web root (htdocs).
 * Server-only configuration (compass-config.php) is NOT included — it lives
 * one level ABOVE htdocs on the server. See docs/FASTHOSTS-CUTOVER.md.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dist', 'fasthosts');

// Top-level entries that make up the public site.
const INCLUDE = [
  '.htaccess',
  'index.html', 'offline.html', 'maintenance.html',
  '400.html', '401.html', '403.html', '404.html', '429.html', '500.html', '502.html', '503.html',
  'robots.txt', 'sitemap.xml', 'sw.js',
  'pages', 'css', 'js', 'assets', 'api',
];

// Paths (relative to root, posix) or basenames never shipped.
const EXCLUDE_PATHS = new Set(['api/config.php', 'css/input.css']);
const EXCLUDE_NAMES = new Set(['.DS_Store', 'Thumbs.db', 'compass-config.php']);

let fileCount = 0;
let byteCount = 0;

async function copy(rel) {
  const src = path.join(root, rel);
  const dest = path.join(outDir, rel);
  const relPosix = rel.split(path.sep).join('/');
  if (EXCLUDE_PATHS.has(relPosix) || EXCLUDE_NAMES.has(path.basename(rel))) return;
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    for (const entry of await fs.readdir(src)) await copy(path.join(rel, entry));
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    fileCount += 1;
    byteCount += stat.size;
  }
}

async function main() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  for (const entry of INCLUDE) {
    try {
      await copy(entry);
    } catch (err) {
      if (err.code === 'ENOENT') throw new Error(`Missing required file/folder: ${entry}`);
      throw err;
    }
  }
  console.log(`Fasthosts build ready: ${path.relative(root, outDir)}/ (${fileCount} files, ${(byteCount / 1048576).toFixed(1)} MB)`);
  console.log('Upload the CONTENTS of that folder to htdocs/. Put compass-config.php one level above htdocs.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
