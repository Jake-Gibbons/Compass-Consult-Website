import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  compareEntries,
  directoriesForFormat,
  filterEntries,
  groupEntries,
  parseDocumentDate,
  renderResourceRow,
  slugify
} from '../js/resource-library-model.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = JSON.parse(readFileSync(path.join(rootDir, 'data', 'resource-library.json'), 'utf8'));
const entries = catalogue.entries;

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex').toUpperCase();
}

describe('resource catalogue fidelity', () => {
  it('publishes 86 source records from 85 unique files, plus the preserved NHS images', () => {
    expect(catalogue.counts).toMatchObject({
      sourceRecords: 86,
      uniqueSourceFiles: 85,
      movedIdentical: 74,
      added: 11,
      aliasListings: 1,
      preservedExisting: 7,
      catalogueEntries: 93,
      storedOriginals: 92
    });
    expect(entries).toHaveLength(93);
  });

  it('matches every published original to its recorded SHA256 and thumbnail', () => {
    const urls = new Map();
    for (const entry of entries) {
      const original = path.join(rootDir, entry.url.replace(/^\//, ''));
      const preview = path.join(rootDir, entry.previewUrl.replace(/^\//, ''));
      expect(existsSync(original), entry.url).toBe(true);
      expect(existsSync(preview), entry.previewUrl).toBe(true);
      expect(sha256(original)).toBe(entry.sha256);
      expect(entry.previewUrl.endsWith('.webp')).toBe(true);
      const urlsForHash = urls.get(entry.sha256) || new Set();
      urlsForHash.add(entry.url);
      urls.set(entry.sha256, urlsForHash);
    }
    for (const urlsForHash of urls.values()) {
      expect(urlsForHash.size).toBe(1);
    }
  });

  it('lists the Staying Close guide in both topics and stores it once', () => {
    const matches = entries.filter((entry) => entry.canonicalId === 'education-skills-staying-close-implementation-guide-for-local-authorities');
    expect(matches.map((entry) => entry.topic).sort()).toEqual(['Education & Skills', 'Government & Devolution']);
    expect(new Set(matches.map((entry) => entry.url)).size).toBe(1);
    expect(matches.every((entry) => entry.format === 'DOCX')).toBe(true);
    expect(matches.every((entry) => entry.previewKind === 'format-label')).toBe(true);
    const files = groupEntries(matches, 'collection');
    expect(files.groups).toHaveLength(2);
    const guides = groupEntries(matches, 'type').groups.find((group) => group.name === 'Guides');
    expect(guides.direct).toHaveLength(1);
  });

  it('keeps both strategic thinking infographics', () => {
    const matches = entries.filter((entry) => entry.id.includes('strategic-thinking'));
    expect(matches).toHaveLength(2);
    expect(new Set(matches.map((entry) => entry.sha256)).size).toBe(2);
    expect(matches.map((entry) => entry.sha256).sort()).toEqual([
      '26ED0E9C7778D2CE',
      'E270A5B00441D417'
    ].map((prefix) => matches.find((entry) => entry.sha256.startsWith(prefix)).sha256));
  });

  it('does not catalogue Marketing and leaves that folder in place', () => {
    const marketingNames = [
      'Compass QR.png',
      'Jon Smith Bio.png',
      'Trusted by GOV.UK.png',
      'UK Partnership Working.png',
      'What We Do.png',
      'Why Compass Graphic.png'
    ];
    for (const name of marketingNames) {
      expect(existsSync(path.join(rootDir, 'assets/images/infographics/Marketing', name))).toBe(true);
    }
    const blob = JSON.stringify(catalogue).toLowerCase();
    expect(blob.includes('/marketing/')).toBe(false);
    expect(entries.some((entry) => entry.topic.toLowerCase() === 'marketing')).toBe(false);
    const diff = spawnSync('git', ['diff', '--name-only', 'HEAD', '--', 'assets/images/infographics/Marketing'], {
      cwd: rootDir,
      encoding: 'utf8'
    });
    expect(diff.stdout.trim()).toBe('');
  });

  it('places presentations and documents in Files, and images in Infographics', () => {
    expect(directoriesForFormat('PNG')).toEqual(['infographics']);
    expect(directoriesForFormat('PDF')).toEqual(['files']);
    expect(directoriesForFormat('DOCX')).toEqual(['files']);
    expect(directoriesForFormat('PPTX')).toEqual(['files']);

    for (const entry of entries) {
      expect(entry.directories).toEqual(directoriesForFormat(entry.format));
    }

    const presentation = entries.find((entry) => entry.format === 'PPTX');
    expect(presentation.originalFilename).toBe('JS IEP Chester Presentation.pptx');
    expect(filterEntries(entries, { directory: 'infographics', search: 'chester' })).toHaveLength(0);
    expect(filterEntries(entries, { directory: 'files', search: 'chester' }).map((entry) => entry.format)).toEqual(['PPTX']);
    expect(filterEntries(entries, { directory: 'infographics' }).every((entry) => entry.format === 'PNG')).toBe(true);
    expect(filterEntries(entries, { directory: 'files' }).every((entry) => entry.format !== 'PNG')).toBe(true);
  });

  it('keeps mobile resource titles readable without removing the row controls', () => {
    const page = readFileSync(path.join(rootDir, 'pages', 'resources.html'), 'utf8');
    const mobileStart = page.lastIndexOf('@media (max-width: 640px)');
    const mobileBlock = page.slice(mobileStart, page.indexOf('@media (max-width: 420px)'));
    expect(mobileBlock).toContain('.resource-tree__file-name');
    expect(mobileBlock).toContain('white-space: normal');
    expect(mobileBlock).toContain('overflow-wrap: anywhere');
    expect(mobileBlock).toContain('text-overflow: unset');
    expect(mobileBlock).not.toMatch(/\.resource-tree__file-name\s*\{[^}]*white-space:\s*nowrap/);
    expect(mobileBlock).toContain('.resource-tree__file-filename { display: none; }');

    const desktopNameRule = page.slice(page.indexOf('.resource-tree__file-name {'), page.indexOf('.resource-tree__file-desc'));
    expect(desktopNameRule).toContain('white-space: nowrap');

    const entry = entries.find((item) => item.title.startsWith('MCSA proposals'));
    const html = renderResourceRow(entry);
    expect(html).toContain(entry.title);
    expect(html).not.toContain('...');
    expect(html).toContain('data-resource-view');
    expect(html).toContain('data-resource-info');
    expect(html).toContain(`download="${entry.originalFilename}"`);
  });

  it('labels DOCX and PPTX without claiming a page preview', () => {
    const office = entries.filter((entry) => entry.format === 'DOCX' || entry.format === 'PPTX');
    expect(office.length).toBeGreaterThanOrEqual(2);
    for (const entry of office) {
      expect(entry.previewKind).toBe('format-label');
      expect(entry.alt.toLowerCase()).not.toContain('pdf preview');
      expect(entry.alt.toLowerCase()).toContain('not a preview');
      const html = renderResourceRow(entry);
      expect(html).toContain(`data-format="${entry.format}"`);
      expect(html).toContain(entry.originalFilename);
      expect(html).toContain('loading="lazy"');
      expect(html).not.toContain('data-resource-view');
      expect(html).toContain(`download="${entry.originalFilename}"`);
      expect(html).toContain(entry.previewUrl);
      expect(html).not.toContain(`src="${entry.url}"`);
    }
  });

  it('uses a lazy thumbnail for PNG resources and downloads the original', () => {
    const entry = entries.find((item) => item.id === 'education-skills-cces-ofsted-safeguarding-oct-26');
    const html = renderResourceRow(entry);
    expect(entry.format).toBe('PNG');
    expect(entry.previewKind).toBe('image');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain(`src="${entry.previewUrl}"`);
    expect(html).not.toContain(`src="${entry.url}"`);
    expect(html).toContain(`href="${encodeURI(entry.url)}"`);
    expect(html).toContain('data-resource-view');
  });

  it('keeps old public URLs as redirects to files that exist', () => {
    const toml = readFileSync(path.join(rootDir, 'netlify.toml'), 'utf8');
    const block = toml.split('# BEGIN resource-library-legacy-redirects')[1].split('# END resource-library-legacy-redirects')[0];
    const rules = [...block.matchAll(/from = "([^"]+)"\n {2}to = "([^"]+)"/g)];
    expect(rules.length).toBe(81);
    const destinations = new Set(rules.map((match) => match[2]));
    for (const entry of entries) {
      for (const legacy of entry.legacyUrls) {
        expect(block).toContain(`from = "${legacy}"`);
        expect(destinations.has(entry.url)).toBe(true);
        expect(existsSync(path.join(rootDir, entry.url.replace(/^\//, '')))).toBe(true);
      }
    }
    expect(block).toContain('/assets/downloads/docs/CCES Connect to Work Programme Factsheet.pdf');
    expect(block).toContain("/assets/downloads/docs/CCES King's Speech Overview 13th May 2026.pdf");
    expect(block).toContain('/assets/images/infographics/Health & Social  Care/NHS/46382.png');
  });

  it('searches and filters without including Marketing', () => {
    expect(filterEntries(entries, { directory: 'files', search: 'staying close' })).toHaveLength(2);
    expect(filterEntries(entries, { directory: 'infographics', search: 'safeguarding' }).map((entry) => entry.id)).toEqual([
      'education-skills-cces-ofsted-safeguarding-oct-26'
    ]);
    expect(filterEntries(entries, { search: 'marketing' })).toHaveLength(0);
    expect(filterEntries(entries, { directory: 'files', search: 'labour market' }).some((entry) => entry.format === 'PDF')).toBe(true);
    const newest = filterEntries(entries, { directory: 'files', scope: 'new' })
      .sort((left, right) => compareEntries(left, right, 'newest'));
    expect(newest.length).toBeGreaterThan(0);
    expect(newest.every((entry) => entry.isNew)).toBe(true);
  });

  it('reads only dates that are written in the filename', () => {
    expect(parseDocumentDate('CCES DFE Response 17 October 2026.pdf')).toEqual({
      label: '17 October 2026',
      sortDate: '2026-10-17'
    });
    expect(parseDocumentDate('CCES DWP Future Employment Support update 19.08.26.pdf').label).toBe('19 August 2026');
    expect(parseDocumentDate('Skills England LMI Oct 26.png')).toEqual({
      label: 'October 2026',
      sortDate: '2026-10-00'
    });
    expect(parseDocumentDate('UK Budget Autumn 2026.png').label).toBe('Autumn 2026');
    expect(parseDocumentDate('CCES 3 Levels of Strategic Thinking.png').label).toBe('');
    expect(slugify("CCES King's Speech Overview 13th May 2026")).toBe('cces-kings-speech-overview-13th-may-2026');
  });

  it('does not precache library originals in the service worker', () => {
    const worker = readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
    expect(worker).toContain("requestUrl.pathname.startsWith('/assets/downloads/library/')");
    const shell = worker.slice(0, worker.indexOf('function isCacheableStaticAsset'));
    expect(shell).not.toContain('/assets/downloads/library/');
  });

  it('does not include Fasthosts migration paths in this diff', () => {
    const diff = spawnSync('git', ['diff', '--name-only', 'main'], { cwd: rootDir, encoding: 'utf8' });
    const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: rootDir, encoding: 'utf8' });
    expect(diff.status).toBe(0);
    const names = `${diff.stdout}\n${untracked.stdout}`.toLowerCase();
    expect(names).not.toContain('fasthosts');
    expect(names).not.toContain('feat/fasthosts-ready');
  });
});
