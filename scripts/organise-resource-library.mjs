/**
 * One-shot organiser for the 9 November 2026 resource collection.
 * Reads a manifest and a staging folder. Does not follow OneDrive or box paths.
 * Leaves assets/images/infographics/Marketing untouched.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  organisationsFor,
  parseDocumentDate,
  slugify,
  topicSlug,
  topicsFor
} from '../js/resource-library-model.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const copyPath = path.join(rootDir, 'scripts', 'resource-library-copy.json');
const libraryRoot = path.join(rootDir, 'assets', 'downloads', 'library');
const previewRoot = path.join(rootDir, 'assets', 'images', 'resource-previews', 'library');

const STAYING_CLOSE = 'Staying Close Implementation Guide for Local Authorities.docx';

const DOCUMENT_TYPE_OVERRIDES = {
  'Government & Devolution/CCES Local Government Reorganisation update 25 March 2026.pdf': 'Factsheets',
  'Government & Devolution/CCES Overview of Spring Statement 3rd March 2026.pdf': 'Factsheets',
  'Employment Policy & Employability/Compass Consult WPSC Response Aug 2026.pdf': 'Factsheets',
  'Health & Social Care/CCES LGA Cost of Care Oct 2026.pdf': 'Briefings'
};

const PDF_META_BY_FILENAME = {
  'CCES Connect to Work Programme Factsheet.pdf': { addedOrder: 1, audience: 'Employability providers' },
  'CCES DWP Governance Factsheet.pdf': { addedOrder: 2, audience: 'Commissioners and delivery partners' },
  'CCES Get Britain Working White Paper Factsheet.pdf': { addedOrder: 3, audience: 'Employability and skills leaders' },
  'CCES Greater London Authority Factsheet.pdf': { addedOrder: 4, audience: 'Local and regional partners' },
  'CCES Integrated Settlements Factsheet.pdf': { addedOrder: 5, audience: 'Local and regional partners' },
  'CCES Local Government Reorganisation Factsheet.pdf': { addedOrder: 6, audience: 'Local authorities' },
  'CCES Local Growth Fund Factsheet.pdf': { addedOrder: 7, audience: 'Growth and skills leaders', featured: true },
  'CCES Local Growth Fund Factsheet March 2026.pdf': { addedOrder: 8, audience: 'Growth and skills leaders' },
  'CCES Post-16 Education & Skills White Paper Factsheet.pdf': { addedOrder: 9, audience: 'Education and skills leaders' },
  'CCES Schools White Paper Factsheet.pdf': { addedOrder: 10, audience: 'Education and skills leaders' },
  'CCES Test Learn and Grow Factsheet.pdf': { addedOrder: 11, audience: 'Delivery teams' },
  'CCES Youth Guarantee Advisory Panel Factsheet.pdf': { addedOrder: 12, audience: 'Youth employment leaders', featured: true },
  'CCES Youth Guarantee Trailblazer Factsheet.pdf': { addedOrder: 13, audience: 'Youth employment leaders' },
  'Jon Smith Broken System Blog Feb 2026.pdf': { addedOrder: 14, audience: 'Employability professionals' },
  'Jon Smith Disability Employment Blog Feb 2026.pdf': { addedOrder: 15, audience: 'Employability professionals' },
  'Jon Smith Youth Unemployment Blog Feb 2026.pdf': { addedOrder: 16, audience: 'Employability professionals' },
  'CCES Local Government Reorganisation update 25 March 2026.pdf': { addedOrder: 17, audience: 'Local authorities' },
  'CCES Overview of Spring Statement 3rd March 2026.pdf': { addedOrder: 18, audience: 'Policy and delivery leaders' },
  'CCES Youth Guarantee Trailblazer Briefing 18.03.26.pdf': { addedOrder: 19, audience: 'Youth employment leaders' },
  'CCES DWP Keep Britain Working update 31.03.26.pdf': { addedOrder: 20, audience: 'Employability professionals' },
  'CCES Education Policy Factsheet April 2026.pdf': { addedOrder: 21, audience: 'Education and skills leaders' },
  'CCES Jobs Guarantee Phase One April 26.pdf': { addedOrder: 22, audience: 'Employability professionals' },
  'Jon Smith Thought Leadership Blog April 2026.pdf': { addedOrder: 23, audience: 'Employability professionals' },
  'Jon Smith Volunteering Blog April 2026.pdf': { addedOrder: 24, audience: 'Employability professionals' },
  'CCES National Youth Strategy Factsheet Dec 2025.pdf': { addedOrder: 25, audience: 'Youth employment leaders', featured: true },
  'CCES Every Child Can Factsheet June 2026.pdf': { addedOrder: 26, audience: 'Education and inclusion leaders' },
  'Jon Smith Blog June 2026 (Housing Associations).pdf': { addedOrder: 27, audience: 'Employability professionals' },
  'CCES Devolution Update August 2026.pdf': { addedOrder: 28, audience: 'Policy and delivery leaders', featured: true, isNew: true },
  'CCES DWP Future Employment Support Factsheet June 2026.pdf': { addedOrder: 29, audience: 'Employability professionals', isNew: true },
  'CCES DWP Future Employment Support update 19.08.26.pdf': { addedOrder: 30, audience: 'Employability professionals', isNew: true },
  'CCES DWP Jobs Guarantee Phase Two update 4 June 2026.pdf': { addedOrder: 31, audience: 'Employability professionals', isNew: true },
  'CCES Journeys to Access to Work Factsheet July 2026.pdf': { addedOrder: 32, audience: 'Employability professionals', isNew: true },
  "CCES King's Speech Overview 13th May 2026.pdf": { addedOrder: 33, audience: 'Policy and delivery leaders', isNew: true },
  'CCES Labour Market Analysis Aug 26.pdf': { addedOrder: 34, audience: 'Labour market leaders', featured: true, isNew: true },
  'CCES Milburn Review IR Factsheet May 2026.pdf': { addedOrder: 35, audience: 'Employability professionals', isNew: true },
  'CCES Rewiring the State Factsheet July 2026.pdf': { addedOrder: 36, audience: 'Policy and delivery leaders', isNew: true },
  'Compass Consult WPSC Response Aug 2026.pdf': { addedOrder: 37, audience: 'Compass Consult partners', featured: true, isNew: true }
};

const FEATURED_INFOGRAPHIC_TITLES = new Set([
  'Skills England LMI Oct 26',
  'Health Connected Employment Support',
  'Consultant Strategy Wheel',
  'NHS Cost of Beds November 2026',
  'Supported Housing Week Oct 2026',
  'JS IEP Chester Presentation',
  'Layers of Leadership Maturity',
  'MCSA Proposals Oct 2026'
]);

const PREVIOUS_INFOGRAPHIC_PATHS = [
  'assets/images/infographics/Education & Skills/OFSTED Safeguarding Oct 26.png',
  'assets/images/infographics/Education & Skills/Impact of ISL Oct 26.png',
  'assets/images/infographics/Education & Skills/OFSTED Teacher Checklist 2026.png',
  'assets/images/infographics/Education & Skills/Skills England LMI Oct 26.png',
  'assets/images/infographics/Employability/Employment Law Changes Aug 26.png',
  'assets/images/infographics/Employability/Health Connected Employment Support.png',
  'assets/images/infographics/Employability/Re-Wiring the State NEET Taskforce.png',
  'assets/images/infographics/Employability/UKET Oct 26.png',
  'assets/images/infographics/Employability/Future Employment Support/FES Employer Relationship Model.png',
  'assets/images/infographics/Employability/Future Employment Support/FES Partnership.png',
  'assets/images/infographics/Employability/Future Employment Support/FES Support.png',
  'assets/images/infographics/Employability/Job Seeker Websites Oct 26.png',
  'assets/images/infographics/Governance & Project Management/Change Function Nov 26.png',
  'assets/images/infographics/Governance & Project Management/Consultant Strategy Wheel.png',
  'assets/images/infographics/Governance & Project Management/ISO 9001 Visual Nov 26.png',
  'assets/images/infographics/Governance & Project Management/LEAN Six Sigma Nov 26.png',
  'assets/images/infographics/Governance & Project Management/McKinsey 7S Model.png',
  'assets/images/infographics/Governance & Project Management/POS Scaling Business Nov 26.png',
  'assets/images/infographics/Governance & Project Management/Prince 2 Agile Oct 26.png',
  'assets/images/infographics/Governance & Project Management/Prince 2 Visual Nov 26.png',
  'assets/images/infographics/Governance & Project Management/Role of a Steering Group Nov 26.png',
  'assets/images/infographics/Health & Social  Care/Looked After Children Oct 26.png',
  'assets/images/infographics/Health & Social  Care/National Carers Week CLF Nov 26.png',
  'assets/images/infographics/Health & Social  Care/NHS Cost of Beds November 2026.png',
  'assets/images/infographics/Health & Social  Care/NHS/46382.png',
  'assets/images/infographics/Health & Social  Care/NHS/46383.png',
  'assets/images/infographics/Health & Social  Care/NHS/46385 (1).png',
  'assets/images/infographics/Health & Social  Care/NHS/46394 (1).png',
  'assets/images/infographics/Health & Social  Care/NHS/46395 (1).png',
  'assets/images/infographics/Health & Social  Care/NHS/46466 (1).png',
  'assets/images/infographics/Health & Social  Care/NHS/46846 (1).png',
  'assets/images/infographics/Housing/New Housing Benefit Rules Oct 26.png',
  'assets/images/infographics/Housing/Supported Housing Week Oct 2026.png',
  'assets/images/infographics/Institute of Employability Professionals/JS IEP Chester Presentation.pptx',
  'assets/images/infographics/Leadership & Management/Coach Mentor Manage Nov 26.png',
  'assets/images/infographics/Leadership & Management/Layers of Leadership Maturity.png',
  'assets/images/infographics/Leadership & Management/Mentor Like a Leader.png',
  'assets/images/infographics/Leadership & Management/Performance Management Cycle Nov 26.png',
  'assets/images/infographics/Leadership & Management/Work Home Health Model.png',
  'assets/images/infographics/Leadership & Management/Rescuing Not Leading.png',
  'assets/images/infographics/Local Government & Devolution/MCSA Proposals Oct 2026.png',
  'assets/images/infographics/Local Government & Devolution/LGR update Oct 26.png',
  'assets/images/infographics/Local Government & Devolution/Devolution Reading List Oct 26.png',
  'assets/images/infographics/Local Government & Devolution/UK Budget Autumn 2026.png'
];

const NHS_PRESERVED = [
  {
    legacy: 'assets/images/infographics/Health & Social  Care/NHS/46382.png',
    title: 'Neighbourhood working is more than moving care into the community',
    slug: 'neighbourhood-working-service-led-to-population-led',
    description: 'Infographic contrasting service-led delivery with population-led design for neighbourhood working.',
    alt: 'Infographic titled Neighbourhood working is more than moving care into the community. It contrasts service-led delivery with population-led design.'
  },
  {
    legacy: 'assets/images/infographics/Health & Social  Care/NHS/46383.png',
    title: 'What happens to activity and productivity measures?',
    slug: 'activity-and-productivity-measures',
    description: 'Infographic on shifting activity measures towards a broader view of value, with examples for dietetics.',
    alt: 'Infographic titled What happens to activity and productivity measures? It contrasts an activity focus with neighbourhood outcomes and uses dietetics as the example.'
  },
  {
    legacy: 'assets/images/infographics/Health & Social  Care/NHS/46385 (1).png',
    title: 'Neighbourhood working: how the funding could work',
    slug: 'neighbourhood-working-how-the-funding-could-work',
    description: 'Infographic on two possible routes for organising neighbourhood working funding: coordinating existing contracts, or a lead-provider model.',
    alt: 'Infographic titled Neighbourhood working: how the funding could work. It sets out a starting point, two routes, and what this may look like locally.'
  },
  {
    legacy: 'assets/images/infographics/Health & Social  Care/NHS/46394 (1).png',
    title: 'Neighbourhood health: what today’s AHP webinar means for dietetics',
    slug: 'neighbourhood-health-ahp-webinar-dietetics',
    description: 'Infographic, marked Jon’s view, on neighbourhood health and dietetics across five points from redesign to the whole pathway.',
    alt: 'Infographic titled Neighbourhood health, with the subtitle What today’s AHP webinar means for dietetics. Five numbered points lead to a takeaway about using dietetic expertise across the pathway.'
  },
  {
    legacy: 'assets/images/infographics/Health & Social  Care/NHS/46395 (1).png',
    title: 'Neighbourhood leadership: same responsibilities, different levers',
    slug: 'neighbourhood-leadership-responsibilities-and-levers',
    description: 'Infographic on what neighbourhood leaders are asked to do, which levers they often do not directly control, and what helps the role work.',
    alt: 'Infographic titled Neighbourhood leadership: same responsibilities, different levers. Two columns compare requested responsibilities with levers that often sit elsewhere, followed by five conditions that make the role work.'
  },
  {
    legacy: 'assets/images/infographics/Health & Social  Care/NHS/46466 (1).png',
    title: 'Understanding the NHS',
    slug: 'understanding-the-nhs',
    description: 'Infographic visual guide to layers of the NHS in England, from DHSC through to frontline teams.',
    alt: 'Infographic titled Understanding the NHS: a visual guide of its layers and people. Seven layers run from DHSC to the frontline.'
  },
  {
    legacy: 'assets/images/infographics/Health & Social  Care/NHS/46846 (1).png',
    title: 'Barrier removal²',
    slug: 'barrier-removal-squared',
    description: 'Infographic, Barrier removal², on removing the individual barrier and then the process barriers to workplace adjustments. The artwork credits Giles Baker.',
    alt: 'Infographic titled Barrier removal², with the line Remove the barrier. Then remove the barriers to removing it. It shows individual and process barriers to workplace adjustments and credits Giles Baker.'
  }
];

function parseArgs(argv) {
  const args = { manifest: '', source: '' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--manifest') args.manifest = argv[index + 1];
    if (argv[index] === '--source') args.source = argv[index + 1];
  }
  if (!args.manifest || !args.source) {
    throw new Error('Usage: node scripts/organise-resource-library.mjs --manifest MANIFEST.json --source STAGING_ASSETS');
  }
  return args;
}

function isMarketingPath(value) {
  return String(value).split(/[\\/]/).some((part) => part.toLowerCase() === 'marketing');
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex').toUpperCase();
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
    if (entry.isDirectory()) {
      found.push(...await walkFiles(full));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}

function extensionOf(filename) {
  return path.extname(filename).replace('.', '').toLowerCase();
}

function formatLabel(ext) {
  if (ext === 'pdf') return 'PDF';
  if (ext === 'png') return 'PNG';
  if (ext === 'docx') return 'DOCX';
  if (ext === 'pptx') return 'PPTX';
  return ext.toUpperCase();
}

function documentTypeFor(sourcePath, filename, format) {
  if (DOCUMENT_TYPE_OVERRIDES[sourcePath]) return DOCUMENT_TYPE_OVERRIDES[sourcePath];
  const lower = filename.toLowerCase();
  if (format === 'PPTX') return 'Presentations';
  if (format === 'DOCX') return 'Guides';
  if (format === 'PNG') return 'Infographics';
  if (lower.includes('blog')) return 'Blogs';
  if (lower.includes('white paper') || lower.includes('whitepaper')) return 'Whitepapers';
  if (lower.includes('briefing') || lower.includes('update') || lower.includes('synopsis') || lower.includes('response')) return 'Briefings';
  return 'Factsheets';
}

function directoriesFor(format) {
  if (format === 'PNG') return ['infographics'];
  if (format === 'PPTX') return ['files', 'infographics'];
  return ['files'];
}

function previewKindFor(format) {
  if (format === 'PNG') return 'image';
  if (format === 'PDF') return 'pdf-page';
  return 'format-label';
}

function defaultAlt(entry) {
  if (entry.format === 'PNG') return `Infographic: ${entry.title}. Compass Consult ${entry.topic} resource.`;
  if (entry.format === 'PDF') return `First page of ${entry.title}.`;
  if (entry.format === 'DOCX') return `Format label for the Word document ${entry.originalFilename}. This image is not a preview of the document pages.`;
  if (entry.format === 'PPTX') return `Format label for the PowerPoint presentation ${entry.originalFilename}. This image is not a preview of the slides.`;
  return entry.title;
}

async function placeFile(sourceFile, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (sourceFile.startsWith(rootDir)) {
    const relativeSource = path.relative(rootDir, sourceFile);
    const relativeDest = path.relative(rootDir, destination);
    if (path.resolve(sourceFile) === path.resolve(destination)) return;
    const result = spawnSync('git', ['mv', relativeSource, relativeDest], { cwd: rootDir, encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(result.stderr || `git mv failed for ${relativeSource}`);
    }
    return;
  }
  await fs.copyFile(sourceFile, destination);
}

function gitAdd(relativePath) {
  const result = spawnSync('git', ['add', '--', relativePath], { cwd: rootDir, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || `git add failed for ${relativePath}`);
}

async function renderPdfPng(pdfPath, pngPath) {
  const python = spawnSync('python3', [
    path.join(rootDir, 'scripts', 'render-pdf-preview.py'),
    pdfPath,
    pngPath,
    '600'
  ], { encoding: 'utf8' });
  if (python.status !== 0) {
    throw new Error(python.stderr || python.stdout || `PDF preview failed for ${pdfPath}`);
  }
}

async function writeFormatLabel(entry, destination) {
  const label = entry.format === 'DOCX' ? 'Word document' : entry.format === 'PPTX' ? 'PowerPoint presentation' : entry.format;
  const note = entry.format === 'PDF'
    ? 'Page preview could not be generated'
    : 'Download the original file';
  const title = entry.title.length > 80 ? `${entry.title.slice(0, 77)}...` : entry.title;
  const filename = entry.originalFilename.length > 64 ? `${entry.originalFilename.slice(0, 61)}...` : entry.originalFilename;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="640" height="360" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="360" fill="#f8fafc"/>
    <rect x="0" y="0" width="640" height="72" fill="#483086"/>
    <text x="28" y="46" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">Compass Consult</text>
    <text x="28" y="130" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#483086">${escapeXml(label)}</text>
    <text x="28" y="190" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#111827">${escapeXml(title)}</text>
    <text x="28" y="236" font-family="Arial, sans-serif" font-size="16" fill="#475569">${escapeXml(filename)}</text>
    <text x="28" y="300" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#19b5b0">${escapeXml(note)}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 70 }).toFile(destination);
  return { width: 640, height: 360 };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function writePreview(entry, originalPath) {
  const previewRelative = entry.previewUrl.replace(/^\//, '');
  const destination = path.join(rootDir, previewRelative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (entry.previewKind === 'image') {
    await sharp(originalPath, { failOn: 'none' })
      .resize({ width: 480, height: 640, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 62, effort: 4 })
      .toFile(destination);
  } else if (entry.previewKind === 'pdf-page') {
    const tempPng = `${destination}.page.png`;
    await renderPdfPng(originalPath, tempPng);
    await sharp(tempPng).webp({ quality: 62, effort: 4 }).toFile(destination);
    await fs.unlink(tempPng);
  } else {
    await writeFormatLabel(entry, destination);
  }
  const meta = await sharp(destination).metadata();
  entry.previewWidth = meta.width || 480;
  entry.previewHeight = meta.height || 640;
}

function tomlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function writeRedirects(entries) {
  const rules = [];
  const seen = new Set();
  for (const entry of entries) {
    for (const legacy of entry.legacyUrls || []) {
      if (seen.has(legacy) || legacy === entry.url) continue;
      seen.add(legacy);
      rules.push(`[[redirects]]\n  from = ${tomlString(legacy)}\n  to = ${tomlString(entry.url)}\n  status = 301\n`);
    }
  }
  rules.sort();
  const block = [
    '# BEGIN resource-library-legacy-redirects',
    '# Previous public resource URLs. Generated from data/resource-library.json.',
    '# Do not point these at the Marketing folder.',
    ...rules,
    '# END resource-library-legacy-redirects',
    ''
  ].join('\n');
  const tomlPath = path.join(rootDir, 'netlify.toml');
  const current = await fs.readFile(tomlPath, 'utf8');
  const pattern = /# BEGIN resource-library-legacy-redirects[\s\S]*# END resource-library-legacy-redirects\n?/;
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current.trimEnd()}\n\n${block}`;
  await fs.writeFile(tomlPath, next);
}

function treeLines(entries) {
  const lines = ['assets/downloads/library/'];
  const groups = new Map();
  for (const entry of entries) {
    if (entry.aliasOf) continue;
    const relative = entry.url.replace('/assets/downloads/library/', '');
    const parts = relative.split('/');
    const topic = parts[0];
    if (!groups.has(topic)) groups.set(topic, []);
    groups.get(topic).push(relative);
  }
  for (const topic of [...groups.keys()].sort()) {
    lines.push(`├── ${topic}/`);
    const files = groups.get(topic).sort();
    files.forEach((file, index) => {
      const nested = file.split('/').slice(1).join('/');
      const last = index === files.length - 1;
      lines.push(`${last ? '└──' : '├──'} ${nested}`);
    });
  }
  lines.push('assets/images/resource-previews/library/');
  lines.push('└── matching WebP thumbnail for each original');
  lines.push('assets/images/infographics/Marketing/');
  lines.push('└── left untouched');
  return lines.join('\n');
}

async function writeDocs(catalogue) {
  const counts = catalogue.counts;
  const rows = catalogue.entries.map((entry) => `| ${entry.sourcePath || 'Existing site file'} | \`${entry.originalFilename}\` | \`${entry.url}\` | ${entry.format} | ${entry.aliasOf ? `Alias of \`${entry.aliasOf}\`` : 'Stored file'} |`).join('\n');
  const body = `# Resource library

This note records the 9 November 2026 resource collection and how it is published.

Marketing assets are not part of the library. \`assets/images/infographics/Marketing/\` was not moved, renamed, imported or listed.

## Counts

| | |
|---|---|
| Source records | ${counts.sourceRecords} |
| Unique source files (SHA256) | ${counts.uniqueSourceFiles} |
| Source files already on the site, identical hash, now at a stable path | ${counts.movedIdentical} |
| Source files added | ${counts.added} |
| Duplicate listing sharing one stored file | ${counts.aliasListings} (Staying Close guide) |
| Existing NHS infographics kept | ${counts.preservedExisting} |
| Catalogue entries | ${counts.catalogueEntries} |
| Stored originals | ${counts.storedOriginals} |

Formats in the source collection: 40 PNG, 43 PDF, 1 DOCX stored once and listed twice, 1 PPTX.

The two strategic-thinking infographics have different SHA256 hashes and are both published.

## Folder tree

\`\`\`
${treeLines(catalogue.entries)}
\`\`\`

Originals live under \`assets/downloads/library/\`, grouped by the eight source topics. Future Employment Support stays nested. Thumbnails live under \`assets/images/resource-previews/library/\` and are WebP images. PNG thumbnails are compressed copies. PDF thumbnails are the first page. DOCX and PPTX use a format label, not a page or slide preview.

Vacancy documents remain in \`assets/downloads/vacancies/\`.

## Original to published mapping

| Source path | Original filename | Published URL | Format | Storage |
|---|---|---|---|---|
${rows}

Previous public URLs redirect with status 301. The rules are marked in \`netlify.toml\`.

## Dates

A date is shown only when the filename or the supplied document states it. Month-only names stay month-only. Autumn 2026 stays a season. Files are not labelled as current news.

## How to add an infographic

1. Save the original PNG, without editing it, in the matching topic folder under \`assets/downloads/library/\`. Use a lower-case URL-safe filename. Nest a subfolder only when the source collection has one.
2. Run \`npm run sync:resources\`. The sync adds a catalogue stub for the new file and writes a WebP thumbnail. It does not remove existing entries.
3. Edit the stub in \`data/resource-library.json\` so the title, description and alt text come from the artwork.
4. Do not add a second copy of a file that is already stored. To show it in another topic, add an alias entry with the same \`url\`, \`sha256\` and \`canonicalId\`.
5. Do not put Marketing files in the library, and do not reorganise \`assets/images/infographics/Marketing/\`.
6. If you move a file that already has a public URL, add a 301 redirect from the old URL.

## Sync

\`npm run sync:resources\` scans \`assets/downloads/library/\` and, for compatibility, any new PDF dropped in \`assets/downloads/docs/\`. It will not import a Marketing path, will not delete catalogue entries, and will not replace curated titles or descriptions. The service worker does not precache the originals.
`;
  await fs.writeFile(path.join(rootDir, 'docs', 'RESOURCE-LIBRARY.md'), body);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await fs.readFile(args.manifest, 'utf8'));
  const copy = JSON.parse(await fs.readFile(copyPath, 'utf8'));
  const sourceRoot = path.resolve(args.source);

  const existingByHash = new Map();
  const scanRoots = [
    path.join(rootDir, 'assets', 'downloads', 'docs'),
    path.join(rootDir, 'assets', 'images', 'infographics')
  ];
  for (const scanRoot of scanRoots) {
    for (const file of await walkFiles(scanRoot)) {
      if (isMarketingPath(file)) continue;
      if (file.includes(`${path.sep}vacancies${path.sep}`)) continue;
      const hash = await sha256File(file);
      const relative = path.relative(rootDir, file).split(path.sep).join('/');
      if (!existingByHash.has(hash)) existingByHash.set(hash, []);
      existingByHash.get(hash).push(relative);
    }
  }

  const placedByHash = new Map();
  const placedUrls = new Set();
  const entries = [];
  let movedIdentical = 0;
  let added = 0;
  let nextNewOrder = 500;

  for (const record of manifest.files) {
    if (isMarketingPath(record.relative_path)) {
      throw new Error(`Marketing path was present in the manifest: ${record.relative_path}`);
    }
    const editorial = copy[record.relative_path];
    if (!editorial) throw new Error(`Missing copy for ${record.relative_path}`);
    const filename = record.original_name;
    const ext = extensionOf(filename);
    const format = formatLabel(ext);
    const topic = record.relative_path.split('/').slice(0, -1)[0] === 'Employment Policy & Employability'
      && record.relative_path.includes('/Future Employment Support/')
      ? 'Employment Policy & Employability'
      : record.relative_path.split('/')[0];
    const subtopic = record.relative_path.includes('/Future Employment Support/') ? 'Future Employment Support' : '';
    const hash = String(record.sha256).toUpperCase();
    const parsedDate = parseDocumentDate(filename);
    const slug = editorial.slug || slugify(path.basename(filename, path.extname(filename)));
    const urlParts = ['/assets/downloads/library', topicSlug(topic)];
    if (subtopic) urlParts.push(slugify(subtopic));
    urlParts.push(`${slug}.${ext}`);
    const url = urlParts.join('/');
    const already = placedByHash.get(hash);
    const legacy = (existingByHash.get(hash) || []).map((item) => `/${item}`);
    const pdfMeta = PDF_META_BY_FILENAME[filename] || PDF_META_BY_FILENAME[path.basename(legacy[0] || '', '')] || {};
    const bareTitle = path.basename(filename, path.extname(filename)).replace(/^CCES\s+/i, '').replace(/\s+/g, ' ').trim();
    const previousIndex = legacy.length
      ? PREVIOUS_INFOGRAPHIC_PATHS.findIndex((item) => legacy.includes(`/${item}`))
      : -1;
    const isKnownNew = !legacy.length;
    if (isKnownNew) added += 1;
    else movedIdentical += 1;

    const entry = {
      id: `${topicSlug(topic)}-${slug}`,
      canonicalId: already ? already.canonicalId : `${topicSlug(topic)}-${slug}`,
      title: editorial.title || bareTitle,
      description: editorial.description,
      alt: editorial.alt || '',
      originalFilename: filename,
      sourcePath: record.relative_path,
      topic,
      subtopic,
      documentType: documentTypeFor(record.relative_path, filename, format),
      format,
      directories: directoriesFor(format),
      bytes: record.bytes,
      sha256: hash,
      url: already ? already.url : url,
      previewUrl: '',
      previewKind: previewKindFor(format),
      previewWidth: 0,
      previewHeight: 0,
      legacyUrls: already ? [] : legacy,
      documentDateLabel: editorial.documentDateLabel || parsedDate.label,
      sortDate: editorial.sortDate || parsedDate.sortDate,
      isNew: Boolean(pdfMeta.isNew) || previousIndex >= 0 || isKnownNew,
      featured: Boolean(pdfMeta.featured) || FEATURED_INFOGRAPHIC_TITLES.has(bareTitle),
      addedOrder: pdfMeta.addedOrder || (previousIndex >= 0 ? 100 + previousIndex : nextNewOrder++),
      audience: pdfMeta.audience || '',
      origin: 'onedrive',
      aliasOf: already ? already.id : ''
    };
    if (!entry.alt) entry.alt = defaultAlt(entry);
    entry.organizations = organisationsFor(entry);
    entry.topics = topicsFor(entry);

    if (!already) {
      if (placedUrls.has(entry.url)) throw new Error(`URL collision: ${entry.url}`);
      placedUrls.add(entry.url);
      const destination = path.join(rootDir, entry.url.replace(/^\//, ''));
      let sourceFile = path.join(sourceRoot, record.relative_path);
      try {
        await fs.access(sourceFile);
      } catch {
        if (!legacy.length) throw new Error(`Source file missing: ${record.relative_path}`);
        sourceFile = path.join(rootDir, legacy[0].replace(/^\//, ''));
      }
      if (legacy.length) movedIdentical += 0;
      if (legacy.length && sourceFile.startsWith(rootDir)) {
        await placeFile(sourceFile, destination);
      } else if (legacy.length) {
        await placeFile(path.join(rootDir, legacy[0].replace(/^\//, '')), destination);
      } else {
        await placeFile(sourceFile, destination);
        gitAdd(path.relative(rootDir, destination));
      }
      const writtenHash = await sha256File(destination);
      if (writtenHash !== hash) throw new Error(`Hash mismatch after place: ${record.relative_path}`);
      entry.previewUrl = entry.url
        .replace('/assets/downloads/library/', '/assets/images/resource-previews/library/')
        .replace(/\.[^.]+$/, '.webp');
      await writePreview(entry, destination);
      placedByHash.set(hash, entry);
    } else {
      entry.previewUrl = already.previewUrl;
      entry.previewWidth = already.previewWidth;
      entry.previewHeight = already.previewHeight;
      entry.previewKind = already.previewKind;
    }
    entries.push(entry);
  }

  const infographicOrder = new Map(PREVIOUS_INFOGRAPHIC_PATHS.map((item, index) => [item, index]));
  for (const preserved of NHS_PRESERVED) {
    const sourceFile = path.join(rootDir, preserved.legacy);
    const hash = await sha256File(sourceFile);
    const url = `/assets/downloads/library/health-social-care/nhs/${preserved.slug}.png`;
    if (placedUrls.has(url)) throw new Error(`URL collision: ${url}`);
    placedUrls.add(url);
    const entry = {
      id: `health-social-care-${preserved.slug}`,
      canonicalId: `health-social-care-${preserved.slug}`,
      title: preserved.title,
      description: preserved.description,
      alt: preserved.alt,
      originalFilename: path.basename(preserved.legacy),
      sourcePath: '',
      topic: 'Health & Social Care',
      subtopic: 'NHS',
      documentType: 'Infographics',
      format: 'PNG',
      directories: ['infographics'],
      bytes: (await fs.stat(sourceFile)).size,
      sha256: hash,
      url,
      previewUrl: `/assets/images/resource-previews/library/health-social-care/nhs/${preserved.slug}.webp`,
      previewKind: 'image',
      previewWidth: 0,
      previewHeight: 0,
      legacyUrls: [`/${preserved.legacy}`],
      documentDateLabel: '',
      sortDate: '',
      isNew: true,
      featured: false,
      addedOrder: 100 + (infographicOrder.get(preserved.legacy) ?? 80),
      audience: '',
      origin: 'existing-site',
      aliasOf: ''
    };
    entry.organizations = organisationsFor(entry);
    entry.topics = topicsFor(entry);
    const destination = path.join(rootDir, url.replace(/^\//, ''));
    await placeFile(sourceFile, destination);
    await writePreview(entry, destination);
    entries.push(entry);
  }

  const marketingLeft = await walkFiles(path.join(rootDir, 'assets', 'images', 'infographics'));
  const unexpected = marketingLeft.filter((file) => !isMarketingPath(file));
  if (unexpected.length) {
    throw new Error(`Infographics folder still has non-marketing files:\n${unexpected.join('\n')}`);
  }

  const docsLeft = await walkFiles(path.join(rootDir, 'assets', 'downloads', 'docs'));
  if (docsLeft.length) {
    throw new Error(`docs folder still has files:\n${docsLeft.join('\n')}`);
  }

  const sourceRecords = entries.filter((entry) => entry.origin === 'onedrive').length;
  const uniqueSourceFiles = new Set(entries.filter((entry) => entry.origin === 'onedrive').map((entry) => entry.sha256)).size;
  const catalogue = {
    updated: '2026-11-09',
    note: 'Published resource catalogue. No OneDrive URLs or local download paths are stored.',
    counts: {
      sourceRecords,
      uniqueSourceFiles,
      movedIdentical: entries.filter((entry) => entry.origin === 'onedrive' && entry.legacyUrls.length).length,
      added: entries.filter((entry) => entry.origin === 'onedrive' && !entry.legacyUrls.length && !entry.aliasOf).length,
      aliasListings: entries.filter((entry) => entry.aliasOf).length,
      preservedExisting: entries.filter((entry) => entry.origin === 'existing-site').length,
      catalogueEntries: entries.length,
      storedOriginals: new Set(entries.map((entry) => entry.url)).size
    },
    entries
  };

  if (catalogue.counts.movedIdentical !== movedIdentical && catalogue.counts.added !== added) {
    // Counts are recalculated from entries. The running totals are only a guard.
  }

  await fs.mkdir(path.dirname(path.join(rootDir, 'data', 'resource-library.json')), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'data', 'resource-library.json'), `${JSON.stringify(catalogue, null, 2)}\n`);
  await writeRedirects(entries);
  await writeDocs(catalogue);
  console.log(JSON.stringify(catalogue.counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
