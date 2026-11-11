import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  clampViewerZoom,
  compareEntries,
  filterEntries,
  groupEntries,
  parseDocumentDate,
  renderResourceRow,
  slugify,
  zoomViewerAt
} from '../js/resource-library-model.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = JSON.parse(readFileSync(path.join(rootDir, 'data', 'resource-library.json'), 'utf8'));
const entries = catalogue.entries;

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex').toUpperCase();
}

describe('resource catalogue fidelity', () => {
  it('publishes the supplied folder as one directory of 86 records and 85 unique files', () => {
    expect(catalogue.counts).toMatchObject({
      sourceRecords: 86,
      uniqueSourceFiles: 85,
      catalogueEntries: 86,
      storedOriginals: 86
    });
    expect(entries).toHaveLength(86);
    expect(new Set(entries.map((entry) => entry.topic))).toEqual(new Set([
      'Education & Skills',
      'Employment Policy & Employability',
      'Governance & Project Management',
      'Government & Devolution',
      'Health & Social Care',
      'Housing',
      'Institute of Employability Professionals',
      'Leadership & Management'
    ]));
    expect(entries.every((entry) => entry.url.startsWith('/assets/resources/') && !entry.url.includes('/_previews/'))).toBe(true);
    expect(existsSync(path.join(rootDir, 'assets', 'downloads', 'library'))).toBe(false);
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
    const duplicated = [...urls.values()].filter((urlsForHash) => urlsForHash.size > 1);
    expect(duplicated).toHaveLength(1);
    expect([...duplicated[0]].every((url) => url.endsWith('Staying Close Implementation Guide for Local Authorities.docx'))).toBe(true);
  });

  it('pins three distinct documents in Featured and marks every infographic New', () => {
    const featured = entries.filter((entry) => entry.featured);
    expect(featured).toHaveLength(3);
    expect(featured.every((entry) => entry.format !== 'PNG')).toBe(true);
    expect(new Set(featured.map((entry) => entry.sha256)).size).toBe(3);
    expect(featured.map((entry) => entry.sourcePath).sort()).toEqual([
      'Employment Policy & Employability/CCES Jobs Guarantee Phase One April 26.pdf',
      'Government & Devolution/CCES LGR Update Briefing Oct 2026.pdf',
      'Leadership & Management/Jon Smith Thought Leadership Blog April 2026.pdf'
    ]);
    const staying = entries.filter((entry) => entry.sha256 === 'D553D8F191B71F27F4204E1ED988185F8903DFB826BFFD8BF8BC87D995EF5C45');
    expect(staying.filter((entry) => entry.featured)).toHaveLength(0);
    const infographics = entries.filter((entry) => entry.format === 'PNG');
    expect(infographics).toHaveLength(40);
    expect(infographics.every((entry) => entry.isNew)).toBe(true);
    const grouped = groupEntries(entries, 'folders');
    expect(grouped.featured.map((entry) => entry.sha256).sort()).toEqual(featured.map((entry) => entry.sha256).sort());
    expect(grouped.groups[0].name).toBe('Education & Skills');
    expect(filterEntries(entries, { scope: 'new' })).toHaveLength(40);
    expect(filterEntries(entries, { scope: 'featured' })).toHaveLength(3);
    const row = renderResourceRow(infographics[0]);
    expect(row).toContain('resource-tree__new');
    expect(row).toContain('>New<');
  });

  it('shows the OneDrive folders, including Staying Close in both categories', () => {
    const grouped = groupEntries(entries, 'folders');
    expect(grouped.groups.map((group) => group.name)).toEqual([
      'Education & Skills',
      'Employment Policy & Employability',
      'Governance & Project Management',
      'Government & Devolution',
      'Health & Social Care',
      'Housing',
      'Institute of Employability Professionals',
      'Leadership & Management'
    ]);
    const employment = grouped.groups.find((group) => group.name === 'Employment Policy & Employability');
    expect(employment.children.map((child) => child.name)).toEqual(['Future Employment Support']);
    const staying = entries.filter((entry) => entry.originalFilename === 'Staying Close Implementation Guide for Local Authorities.docx');
    expect(staying.map((entry) => entry.topic).sort()).toEqual(['Education & Skills', 'Government & Devolution']);
    expect(new Set(staying.map((entry) => entry.sha256)).size).toBe(1);
    const page = readFileSync(path.join(rootDir, 'pages', 'resources.html'), 'utf8');
    expect(page).not.toContain('data-directory="infographics"');
    expect(page).not.toContain('data-directory="files"');
    const presentation = entries.find((entry) => entry.format === 'PPTX');
    expect(presentation.sourcePath).toBe('Institute of Employability Professionals/JS IEP Chester Presentation.pptx');
    expect(filterEntries(entries, { search: 'chester' })).toHaveLength(1);
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

    const entry = entries.find((item) => item.originalFilename.includes('MCSA'));
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
      expect(html).toContain(entry.previewUrl.replace(/&/g, '&amp;'));
      expect(html).not.toContain(`src="${entry.url}"`);
    }
  });

  it('offers an in-page view for PDFs and keeps magnification bounded', () => {
    const pdf = entries.find((item) => item.format === 'PDF' && item.originalFilename.includes('Future Employment Support update'));
    const html = renderResourceRow(pdf);
    expect(html).toContain('data-resource-view');
    expect(html).toContain('View PDF');
    const docx = entries.find((item) => item.format === 'DOCX');
    expect(renderResourceRow(docx)).not.toContain('data-resource-view');
    expect(clampViewerZoom(20)).toBe(6);
    expect(clampViewerZoom(0.1)).toBe(0.5);
    const zoomed = zoomViewerAt({ scale: 1, x: 0, y: 0 }, {
      clientX: 100,
      clientY: 80,
      left: 0,
      top: 0,
      width: 200,
      height: 160,
      factor: 2
    });
    expect(zoomed.scale).toBe(2);
    const page = readFileSync(path.join(rootDir, 'pages', 'resources.html'), 'utf8');
    expect(page).toContain('data-zoom="in"');
    expect(page).toContain('data-page="next"');
    expect(page).toContain('infographicViewerPagesStream');
    expect(page).toContain('touch-action: none');
    const viewer = readFileSync(new URL('../js/resources.js', import.meta.url), 'utf8');
    expect(viewer).toContain('event.ctrlKey || event.metaKey');
  });

  it('uses a lazy thumbnail for PNG resources and downloads the original', () => {
    const entry = entries.find((item) => item.originalFilename === 'New Housing Benefit Rules Oct 26.png');
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
    expect(rules.length).toBeGreaterThan(80);
    for (const match of rules) {
      const target = match[2].replace(/&amp;/g, '&');
      expect(existsSync(path.join(rootDir, decodeURI(target).replace(/^\//, '')))).toBe(true);
    }
    for (const entry of entries) {
      for (const legacy of entry.legacyUrls) {
        expect(block).toContain(`from = "${legacy}"`);
      }
    }
    expect(block).toContain('/assets/downloads/docs/CCES Connect to Work Programme Factsheet.pdf');
    expect(block).toContain("/assets/downloads/docs/CCES King's Speech Overview 13th May 2026.pdf");
    expect(block).not.toContain('/NHS/46382.png');
  });

  it('searches and filters without including Marketing', () => {
    expect(filterEntries(entries, { search: 'staying close' })).toHaveLength(2);
    expect(filterEntries(entries, { search: 'safeguarding' }).some((entry) => entry.topic === 'Education & Skills')).toBe(true);
    expect(filterEntries(entries, { search: 'marketing' })).toHaveLength(0);
    expect(filterEntries(entries, { search: 'labour market' }).some((entry) => entry.format === 'PDF')).toBe(true);
    expect(filterEntries(entries, { scope: 'new' })).toHaveLength(40);
    const alphabetical = filterEntries(entries, { search: 'housing' })
      .sort((left, right) => compareEntries(left, right, 'alphabetical'));
    expect(alphabetical.length).toBeGreaterThan(1);
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
    expect(worker).toContain("requestUrl.pathname.startsWith('/assets/resources/')");
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
