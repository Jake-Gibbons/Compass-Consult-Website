/**
 * Add new library files to the catalogue without removing or rewriting curated entries.
 * Marketing paths are ignored. Identical SHA256 files are not stored twice.
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  directoriesForFormat,
  organisationsFor,
  parseDocumentDate,
  slugify,
  topicsFor
} from '../js/resource-library-model.mjs';
import { ensurePreview } from './lib/resource-previews.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cataloguePath = path.join(rootDir, 'data', 'resource-library.json');
const libraryRoot = path.join(rootDir, 'assets', 'downloads', 'library');
const legacyDocsRoot = path.join(rootDir, 'assets', 'downloads', 'docs');

function isMarketingPath(value) {
  return String(value).split(/[\\/]/).some((part) => part.toLowerCase() === 'marketing');
}

async function walkFiles(dir) {
  const found = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (isMarketingPath(full)) {
      console.warn(`Skipped Marketing path: ${path.relative(rootDir, full)}`);
      continue;
    }
    if (entry.isDirectory()) found.push(...await walkFiles(full));
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function formatFor(ext) {
  if (ext === '.pdf') return 'PDF';
  if (ext === '.png') return 'PNG';
  if (ext === '.docx') return 'DOCX';
  if (ext === '.pptx') return 'PPTX';
  return ext.replace('.', '').toUpperCase();
}

function previewKindFor(format) {
  if (format === 'PNG') return 'image';
  if (format === 'PDF') return 'pdf-page';
  return 'format-label';
}

function documentTypeFor(filename, format) {
  const lower = filename.toLowerCase();
  if (format === 'PPTX') return 'Presentations';
  if (format === 'DOCX') return 'Guides';
  if (format === 'PNG') return 'Infographics';
  if (lower.includes('blog')) return 'Blogs';
  if (lower.includes('white paper') || lower.includes('whitepaper')) return 'Whitepapers';
  if (lower.includes('briefing') || lower.includes('update') || lower.includes('synopsis')) return 'Briefings';
  return 'Factsheets';
}

async function syncResources() {
  const catalogue = JSON.parse(await fs.readFile(cataloguePath, 'utf8'));
  const entries = catalogue.entries;
  const byUrl = new Map(entries.filter((entry) => !entry.aliasOf).map((entry) => [entry.url, entry]));
  const hashes = new Set(entries.map((entry) => entry.sha256));
  let added = 0;
  let previewsCreated = 0;
  let hashUpdates = 0;
  const maxOrder = entries.reduce((max, entry) => Math.max(max, entry.addedOrder || 0), 0);

  const files = [
    ...await walkFiles(libraryRoot),
    ...(await walkFiles(legacyDocsRoot)).filter((file) => file.toLowerCase().endsWith('.pdf'))
  ];

  for (const file of files) {
    const relative = `/${path.relative(rootDir, file).split(path.sep).join('/')}`;
    const buffer = await fs.readFile(file);
    const hash = sha256(buffer);
    const existing = byUrl.get(relative);
    if (existing) {
      if (existing.sha256 !== hash || existing.bytes !== buffer.length) {
        existing.sha256 = hash;
        existing.bytes = buffer.length;
        hashUpdates += 1;
      }
      continue;
    }
    if (hashes.has(hash)) {
      console.warn(`Skipped duplicate bytes already catalogued: ${relative}`);
      continue;
    }

    const filename = path.basename(file);
    const ext = path.extname(filename).toLowerCase();
    const format = formatFor(ext);
    const date = parseDocumentDate(filename);
    const inLibrary = relative.startsWith('/assets/downloads/library/');
    const parts = relative.split('/').filter(Boolean);
    const topicSlugPart = inLibrary ? parts[3] : '';
    const topic = inLibrary ? topicSlugPart.replace(/-/g, ' ') : 'Unsorted';
    const entry = {
      id: `sync-${slugify(filename)}`,
      canonicalId: `sync-${slugify(filename)}`,
      title: filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      description: 'Added by resource sync. Replace this description with a summary taken from the file.',
      alt: '',
      originalFilename: filename,
      sourcePath: '',
      topic,
      subtopic: '',
      documentType: documentTypeFor(filename, format),
      format,
      directories: directoriesForFormat(format),
      bytes: buffer.length,
      sha256: hash,
      url: relative,
      previewUrl: inLibrary
        ? relative.replace('/assets/downloads/library/', '/assets/images/resource-previews/library/').replace(/\.[^.]+$/, '.webp')
        : `/assets/images/resource-previews/library/unsorted/${slugify(filename)}.webp`,
      previewKind: previewKindFor(format),
      previewWidth: 0,
      previewHeight: 0,
      legacyUrls: [],
      documentDateLabel: date.label,
      sortDate: date.sortDate,
      isNew: true,
      featured: false,
      addedOrder: maxOrder + added + 1,
      audience: '',
      origin: 'sync',
      aliasOf: ''
    };
    entry.alt = format === 'PNG'
      ? `Infographic: ${entry.title}.`
      : format === 'PDF'
        ? `First page of ${entry.title}.`
        : `Format label for ${entry.originalFilename}. This image is not a preview of the file contents.`;
    entry.organizations = organisationsFor(entry);
    entry.topics = topicsFor(entry);
    entries.push(entry);
    byUrl.set(entry.url, entry);
    hashes.add(hash);
    added += 1;
  }

  for (const entry of entries) {
    if (entry.aliasOf) continue;
    const original = path.join(rootDir, entry.url.replace(/^\//, ''));
    try {
      await fs.access(original);
    } catch {
      console.warn(`Catalogue entry has no file: ${entry.url}`);
      continue;
    }
    const created = await ensurePreview(entry, original);
    if (created) previewsCreated += 1;
  }

  if (added || hashUpdates || previewsCreated) {
    catalogue.entries = entries;
    catalogue.counts = {
      ...catalogue.counts,
      catalogueEntries: entries.length,
      storedOriginals: new Set(entries.map((entry) => entry.url)).size
    };
    await fs.writeFile(cataloguePath, `${JSON.stringify(catalogue, null, 2)}\n`);
  }

  console.log(`Resources added: ${added}`);
  console.log(`Hash updates: ${hashUpdates}`);
  console.log(`Previews created: ${previewsCreated}`);
}

syncResources().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
