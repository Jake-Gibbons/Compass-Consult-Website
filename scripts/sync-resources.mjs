import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';
import sharp from 'sharp';

const rootDir = new URL('..', import.meta.url).pathname;
const docsDir = join(rootDir, 'assets', 'downloads', 'docs');
const previewsDir = join(rootDir, 'assets', 'images', 'resource-previews');
const resourcesPage = join(rootDir, 'pages', 'resources.html');
const sourceIcon = join(rootDir, 'assets', 'logos', 'compass_rose.png');

const BRAND_PURPLE = '#483086';
const BRAND_TEAL = '#19b5b0';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function titleFromFilename(filename) {
  const withoutExt = filename.replace(/\.pdf$/i, '');
  return withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function metadataFromFilename(filename) {
  const lower = filename.toLowerCase();

  if (lower.includes('blog')) {
    return {
      category: 'Blogs',
      color: 'indigo',
      desc: 'Blog article covering current employability and skills insights.'
    };
  }

  if (lower.includes('briefing') || lower.includes('update')) {
    return {
      category: 'Briefings',
      color: 'orange',
      desc: 'Briefing update on current policy and delivery developments.'
    };
  }

  if (lower.includes('white paper') || lower.includes('whitepaper')) {
    return {
      category: 'Whitepapers',
      color: 'teal',
      desc: 'Summary of key white paper themes and implementation implications.'
    };
  }

  return {
    category: 'Factsheets',
    color: 'purple',
    desc: 'Factsheet outlining key points for employability and skills delivery.'
  };
}

function buildResourceEntry(id, filename) {
  const title = titleFromFilename(filename);
  const meta = metadataFromFilename(filename);

  return `            {\n` +
    `                id: ${id},\n` +
    `                title: "${title.replace(/"/g, '\\"')}",\n` +
    `                category: "${meta.category}",\n` +
    '                type: "PDF",\n' +
    '                size: "PDF",\n' +
    `                desc: "${meta.desc}",\n` +
    '                icon: "file-text",\n' +
    `                color: "${meta.color}",\n` +
    `                url: "/assets/downloads/docs/${filename.replace(/"/g, '\\"')}"\n` +
    '            }';
}

function splitLinesForPreview(text, maxCharsPerLine = 34, maxLines = 3) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\.*$/, '')}...`;
  }

  return lines;
}

async function generatePreview(filename) {
  const previewPath = join(previewsDir, `${filename}.png`);

  try {
    await fs.access(previewPath);
    return false;
  } catch {
    // File does not exist yet.
  }

  const title = titleFromFilename(filename);
  const lines = splitLinesForPreview(title);

  const textSvg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#f8fafc"/>
      <rect x="0" y="0" width="1200" height="130" fill="${BRAND_PURPLE}"/>
      <text x="70" y="82" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">Compass Consult Resource</text>
      <rect x="70" y="170" width="1060" height="390" rx="26" fill="#ffffff" stroke="#e5e7eb" stroke-width="3"/>
      <text x="120" y="260" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="${BRAND_PURPLE}">PDF</text>
      <line x1="120" y1="282" x2="1080" y2="282" stroke="#d1d5db" stroke-width="2"/>
      ${lines
        .map((line, i) => `<text x="120" y="${350 + (i * 70)}" font-family="Arial, sans-serif" font-size="44" font-weight="600" fill="#111827">${escapeXml(line)}</text>`)
        .join('')}
      <text x="120" y="535" font-family="Arial, sans-serif" font-size="30" font-weight="500" fill="${BRAND_TEAL}">Download from Compass Consult Resource Library</text>
    </svg>
  `;

  const logo = await sharp(sourceIcon)
    .resize(160, 160, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp(Buffer.from(textSvg))
    .composite([
      { input: logo, left: 980, top: 18 }
    ])
    .png({ compressionLevel: 9 })
    .toFile(previewPath);

  return true;
}

async function syncResources() {
  const [files, resourcesContent] = await Promise.all([
    fs.readdir(docsDir),
    fs.readFile(resourcesPage, 'utf8'),
    fs.mkdir(previewsDir, { recursive: true })
  ]);

  const pdfFiles = files
    .filter((name) => name.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => a.localeCompare(b));

  const resourcesMatch = resourcesContent.match(/const resources = \[(?<body>[\s\S]*?)\n\s*\];/);
  if (!resourcesMatch || !resourcesMatch.groups) {
    throw new Error('Could not find resources array in pages/resources.html');
  }

  const resourcesBody = resourcesMatch.groups.body;

  const urlRegex = /url:\s*"([^"]+)"/g;
  const idRegex = /id:\s*(\d+)/g;
  const existingUrls = new Set();
  let maxId = 0;

  for (const match of resourcesBody.matchAll(urlRegex)) {
    existingUrls.add(match[1]);
  }

  for (const match of resourcesBody.matchAll(idRegex)) {
    const id = Number.parseInt(match[1], 10);
    if (id > maxId) {
      maxId = id;
    }
  }

  const newEntries = [];
  for (const filename of pdfFiles) {
    const url = `/assets/downloads/docs/${filename}`;
    if (existingUrls.has(url)) {
      continue;
    }

    maxId += 1;
    newEntries.push(buildResourceEntry(maxId, filename));
  }

  let updatedResourcesContent = resourcesContent;
  if (newEntries.length > 0) {
    const insertionPoint = resourcesMatch[0];
    const originalBody = resourcesMatch.groups.body;
    const trimmedBody = originalBody.trimEnd();
    const nextBody = `${trimmedBody},\n${newEntries.join(',\n')}`;
    const nextArray = insertionPoint.replace(originalBody, nextBody);

    updatedResourcesContent = resourcesContent.replace(insertionPoint, nextArray);
    await fs.writeFile(resourcesPage, updatedResourcesContent, 'utf8');
  }

  let previewsCreated = 0;
  for (const filename of pdfFiles) {
    const created = await generatePreview(filename);
    if (created) {
      previewsCreated += 1;
    }
  }

  console.log(`Resources added: ${newEntries.length}`);
  console.log(`Previews created: ${previewsCreated}`);
}

syncResources().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
