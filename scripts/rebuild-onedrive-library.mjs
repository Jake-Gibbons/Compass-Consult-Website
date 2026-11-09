/**
 * Replace the resource library with the supplied OneDrive folder tree.
 * Marketing files are not touched.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  organisationsFor,
  parseDocumentDate,
  slugify,
  topicsFor
} from '../js/resource-library-model.mjs';
import { ensurePreview } from './lib/resource-previews.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = process.argv[2];
const libraryRoot = path.join(rootDir, 'assets', 'resources');
const stayingCloseName = 'Staying Close Implementation Guide for Local Authorities.docx';

if (!sourceRoot) {
  throw new Error('Usage: node scripts/rebuild-onedrive-library.mjs STAGING_ASSETS');
}

function git(args) {
  const result = spawnSync('git', args, { cwd: rootDir, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `git ${args.join(' ')} failed`);
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

async function walk(dir) {
  const found = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

function formatFor(ext) {
  if (ext === '.png') return 'PNG';
  if (ext === '.pdf') return 'PDF';
  if (ext === '.docx') return 'DOCX';
  if (ext === '.pptx') return 'PPTX';
  return ext.replace('.', '').toUpperCase();
}

function previewKindFor(format) {
  if (format === 'PNG') return 'image';
  if (format === 'PDF') return 'pdf-page';
  return 'format-label';
}

function tomlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function main() {
  const previous = JSON.parse(await fs.readFile(path.join(rootDir, 'data', 'resource-library.json'), 'utf8'));
  const previousByHash = new Map();
  for (const entry of previous.entries) {
    const urls = previousByHash.get(entry.sha256) || new Set();
    urls.add(entry.url);
    for (const legacy of entry.legacyUrls || []) urls.add(legacy);
    previousByHash.set(entry.sha256, urls);
  }

  const currentByHash = new Map();
  for (const file of await walk(path.join(rootDir, 'assets', 'downloads', 'library'))) {
    const hash = sha256(await fs.readFile(file));
    currentByHash.set(hash, file);
  }

  await fs.mkdir(libraryRoot, { recursive: true });
  const sourceFiles = (await walk(sourceRoot)).filter((file) => !file.split(path.sep).some((part) => part.toLowerCase() === 'marketing'));
  const placed = [];

  for (const source of sourceFiles) {
    const relative = path.relative(sourceRoot, source).split(path.sep).join('/');
    const destination = path.join(libraryRoot, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const hash = sha256(await fs.readFile(source));
    const existing = currentByHash.get(hash);
    if (existing) {
      git(['mv', path.relative(rootDir, existing), path.relative(rootDir, destination)]);
      currentByHash.delete(hash);
    } else {
      await fs.copyFile(source, destination);
      git(['add', '--', path.relative(rootDir, destination)]);
    }
    placed.push({ relative, destination, hash });
  }

  const education = placed.find((item) => item.relative.endsWith(stayingCloseName));
  const governmentRelative = `Government & Devolution/${stayingCloseName}`;
  const governmentDest = path.join(libraryRoot, governmentRelative);
  await fs.copyFile(education.destination, governmentDest);
  git(['add', '--', path.relative(rootDir, governmentDest)]);
  placed.push({ relative: governmentRelative, destination: governmentDest, hash: education.hash });

  for (const leftover of currentByHash.values()) {
    git(['rm', '-f', '--', path.relative(rootDir, leftover)]);
  }
  git(['rm', '-r', '--ignore-unmatch', '--', 'assets/images/resource-previews', 'assets/downloads/docs']);

  const infographicRoot = path.join(rootDir, 'assets', 'images', 'infographics');
  for (const entry of await fs.readdir(infographicRoot)) {
    if (entry.toLowerCase() === 'marketing') continue;
    git(['rm', '-r', '--ignore-unmatch', '--', path.join('assets', 'images', 'infographics', entry)]);
    await fs.rm(path.join(infographicRoot, entry), { recursive: true, force: true });
  }

  const entries = [];
  for (const [index, item] of placed.sort((a, b) => a.relative.localeCompare(b.relative, 'en-GB')).entries()) {
    const filename = path.basename(item.relative);
    const ext = path.extname(filename).toLowerCase();
    const format = formatFor(ext);
    const parts = item.relative.split('/');
    const topic = parts[0];
    const subtopic = parts.length > 2 ? parts.slice(1, -1).join(' / ') : '';
    const title = filename.replace(/\.[^.]+$/, '');
    const date = parseDocumentDate(filename);
    const url = `/assets/resources/${item.relative}`;
    const previewUrl = `/assets/resources/_previews/${item.relative.replace(/\.[^.]+$/, '.webp')}`;
    const bytes = (await fs.stat(item.destination)).size;
    const entry = {
      id: slugify(item.relative),
      canonicalId: slugify(item.relative),
      title,
      description: subtopic ? `${topic} / ${subtopic}` : topic,
      alt: format === 'PNG'
        ? `Infographic file ${filename} in ${topic}.`
        : format === 'PDF'
          ? `First page of ${filename}.`
          : `Format label for ${filename}. This image is not a preview of the file contents.`,
      originalFilename: filename,
      sourcePath: item.relative,
      topic,
      subtopic,
      documentType: format,
      format,
      directories: ['library'],
      bytes,
      sha256: item.hash,
      url,
      previewUrl,
      previewKind: previewKindFor(format),
      previewWidth: 0,
      previewHeight: 0,
      legacyUrls: [...(previousByHash.get(item.hash) || [])].filter((legacy) => legacy !== url).sort(),
      documentDateLabel: date.label,
      sortDate: date.sortDate,
      isNew: false,
      featured: false,
      addedOrder: index + 1,
      audience: '',
      origin: 'onedrive',
      aliasOf: ''
    };
    entry.organizations = organisationsFor(entry);
    entry.topics = topicsFor(entry);
    await ensurePreview(entry, item.destination);
    entries.push(entry);
  }

  const catalogue = {
    updated: '2026-11-09',
    note: 'Single resource directory copied from the supplied OneDrive folder. Marketing is not included.',
    counts: {
      sourceRecords: entries.length,
      uniqueSourceFiles: new Set(entries.map((entry) => entry.sha256)).size,
      catalogueEntries: entries.length,
      storedOriginals: new Set(entries.map((entry) => entry.url)).size
    },
    entries
  };
  await fs.writeFile(path.join(rootDir, 'data', 'resource-library.json'), `${JSON.stringify(catalogue, null, 2)}\n`);

  const rules = [];
  const seen = new Set();
  for (const entry of entries) {
    for (const legacy of entry.legacyUrls) {
      if (seen.has(legacy)) continue;
      seen.add(legacy);
      rules.push(`[[redirects]]\n  from = ${tomlString(legacy)}\n  to = ${tomlString(entry.url)}\n  status = 301\n`);
    }
  }
  rules.sort();
  const block = [
    '# BEGIN resource-library-legacy-redirects',
    '# Previous public resource URLs. The library itself is assets/resources.',
    ...rules,
    '# END resource-library-legacy-redirects',
    ''
  ].join('\n');
  const tomlPath = path.join(rootDir, 'netlify.toml');
  const current = await fs.readFile(tomlPath, 'utf8');
  const pattern = /# BEGIN resource-library-legacy-redirects[\s\S]*# END resource-library-legacy-redirects\n?/;
  await fs.writeFile(tomlPath, current.replace(pattern, block));
  console.log(JSON.stringify(catalogue.counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
