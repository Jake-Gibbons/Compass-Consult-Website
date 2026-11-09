import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function writeFormatLabel(entry, destination) {
  const label = entry.format === 'DOCX'
    ? 'Word document'
    : entry.format === 'PPTX'
      ? 'PowerPoint presentation'
      : entry.format === 'PDF'
        ? 'PDF'
        : entry.format;
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
}

/**
 * Create a missing thumbnail. Originals are only read.
 *
 * @param {object} entry
 * @param {string} originalPath
 * @returns {Promise<boolean>} true when a thumbnail was created
 */
export async function ensurePreview(entry, originalPath) {
  if (!entry.previewUrl || entry.aliasOf) return false;
  const destination = path.join(rootDir, entry.previewUrl.replace(/^\//, ''));
  try {
    await fs.access(destination);
    return false;
  } catch {
    // Create the missing thumbnail.
  }
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (entry.previewKind === 'image') {
    await sharp(originalPath, { failOn: 'none' })
      .resize({ width: 480, height: 640, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 62, effort: 4 })
      .toFile(destination);
  } else if (entry.previewKind === 'pdf-page') {
    const tempPng = `${destination}.page.png`;
    const python = spawnSync('python3', [
      path.join(rootDir, 'scripts', 'render-pdf-preview.py'),
      originalPath,
      tempPng,
      '600'
    ], { encoding: 'utf8' });
    if (python.status !== 0) {
      entry.previewKind = 'format-label';
      await writeFormatLabel(entry, destination);
    } else {
      await sharp(tempPng).webp({ quality: 62, effort: 4 }).toFile(destination);
      await fs.unlink(tempPng);
    }
  } else {
    await writeFormatLabel(entry, destination);
  }
  const meta = await sharp(destination).metadata();
  entry.previewWidth = meta.width || entry.previewWidth || 480;
  entry.previewHeight = meta.height || entry.previewHeight || 360;
  return true;
}
