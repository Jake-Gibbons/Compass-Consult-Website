import sharp from 'sharp';
import { join } from 'node:path';

const rootDir = new URL('..', import.meta.url).pathname;
const sourceIcon = join(rootDir, 'assets', 'logos', 'compass_rose.png');
const outputDir = join(rootDir, 'assets', 'icons', 'favicon');

const brandPurple = '#ffffff';

async function createIcon(outputPath, size, logoScale = 0.72) {
  const logoSize = Math.round(size * logoScale);
  const logoOffset = Math.round((size - logoSize) / 2);

  const foreground = await sharp(sourceIcon)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      withoutEnlargement: false
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: brandPurple
    }
  })
    .composite([{ input: foreground, left: logoOffset, top: logoOffset }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);
}

async function main() {
  await createIcon(join(outputDir, 'favicon-16x16.png'), 16, 0.80);
  await createIcon(join(outputDir, 'favicon-32x32.png'), 32, 0.80);
  await createIcon(join(outputDir, 'apple-touch-icon.png'), 180, 0.74);
  await createIcon(join(outputDir, 'android-chrome-192x192.png'), 192, 0.72);
  await createIcon(join(outputDir, 'android-chrome-512x512.png'), 512, 0.72);

  // Slightly larger safe-area fill for maskable variants.
  await createIcon(join(outputDir, 'maskable-icon-192x192.png'), 192, 0.82);
  await createIcon(join(outputDir, 'maskable-icon-512x512.png'), 512, 0.82);

  console.log('PWA icons generated successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
