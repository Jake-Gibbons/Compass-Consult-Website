import { mkdir, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;

const LOGO_INPUT = join(ROOT, 'assets', 'logos', 'Logo.webp');
const LOGO_OUTPUT_DIR = join(ROOT, 'assets', 'logos', 'optimized');

const AUTHORITY_INPUT_DIR = join(ROOT, 'assets', 'images', 'authorities');
const AUTHORITY_OUTPUT_DIR = join(ROOT, 'assets', 'images', 'authorities', 'ticker');

const LOGO_WIDTHS = [320, 640, 960];
const AUTHORITY_HEIGHT = 70;

async function optimizeLogo() {
  await mkdir(LOGO_OUTPUT_DIR, { recursive: true });

  for (const width of LOGO_WIDTHS) {
    const output = join(LOGO_OUTPUT_DIR, `Logo-${width}.webp`);
    await sharp(LOGO_INPUT)
      .resize({ width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(output);
    console.log(`logo: ${basename(output)}`);
  }
}

async function optimizeAuthorityTickerImages() {
  await mkdir(AUTHORITY_OUTPUT_DIR, { recursive: true });
  const files = await readdir(AUTHORITY_INPUT_DIR, { withFileTypes: true });

  for (const entry of files) {
    if (!entry.isFile() || !entry.name.endsWith('.webp')) {
      continue;
    }

    const input = join(AUTHORITY_INPUT_DIR, entry.name);
    const output = join(AUTHORITY_OUTPUT_DIR, entry.name);

    await sharp(input)
      .resize({ height: AUTHORITY_HEIGHT, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 58, effort: 6 })
      .toFile(output);

    console.log(`ticker: ${entry.name}`);
  }
}

async function main() {
  await optimizeLogo();
  await optimizeAuthorityTickerImages();
  console.log('Image optimization complete.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
