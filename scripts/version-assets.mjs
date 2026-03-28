import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { transform } from 'esbuild';

const ROOT = process.cwd();

const ASSETS = [
  'css/tailwind.min.css',
  'css/main.css',
  'js/main.js',
  'js/lucide.min.js',
];

const REF_PATTERNS = [
  {
    key: 'tailwind',
    regex: /\/css\/tailwind\.min(?:\.[a-f0-9]{8})?\.css/g,
  },
  {
    key: 'mainCss',
    regex: /\/css\/main(?:\.[a-f0-9]{8})?\.css/g,
  },
  {
    key: 'mainJs',
    regex: /\/js\/main(?:\.[a-f0-9]{8})?\.js/g,
  },
  {
    key: 'lucideJs',
    regex: /\/js\/lucide\.min(?:\.[a-f0-9]{8})?\.js/g,
  },
];

const KEY_BY_ASSET = {
  'css/tailwind.min.css': 'tailwind',
  'css/main.css': 'mainCss',
  'js/main.js': 'mainJs',
  'js/lucide.min.js': 'lucideJs',
};

async function getVersionedContent(relPath, sourceContent) {
  if (relPath === 'css/main.css') {
    const result = await transform(sourceContent.toString('utf8'), {
      loader: 'css',
      minify: true,
      legalComments: 'none',
    });
    return Buffer.from(result.code);
  }

  if (relPath === 'js/main.js') {
    const result = await transform(sourceContent.toString('utf8'), {
      loader: 'js',
      minify: true,
      target: 'es2018',
      legalComments: 'none',
    });
    return Buffer.from(result.code);
  }

  return sourceContent;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function hashedFilename(relPath, hash) {
  const parsed = path.parse(relPath);
  return path.posix.join(parsed.dir, `${parsed.name}.${hash}${parsed.ext}`);
}

async function removeOldVersions(relPath) {
  const parsed = path.parse(relPath);
  const absDir = path.join(ROOT, parsed.dir);
  const entries = await fs.readdir(absDir);

  await Promise.all(entries.map(async (entry) => {
    if (!entry.startsWith(`${parsed.name}.`) || !entry.endsWith(parsed.ext)) {
      return;
    }

    const hashPart = entry.slice(parsed.name.length + 1, -parsed.ext.length);
    if (/^[a-f0-9]{8}$/.test(hashPart)) {
      await fs.unlink(path.join(absDir, entry));
    }
  }));
}

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectHtmlFiles(fullPath);
      results.push(...nested);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

async function main() {
  const manifest = {};

  for (const relPath of ASSETS) {
    const absPath = path.join(ROOT, relPath);

    if (!(await fileExists(absPath))) {
      throw new Error(`Missing asset: ${relPath}`);
    }

    const sourceContent = await fs.readFile(absPath);
    const content = await getVersionedContent(relPath, sourceContent);
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
    const versionedRel = hashedFilename(relPath, hash);
    const versionedAbs = path.join(ROOT, versionedRel);

    await removeOldVersions(relPath);
    await fs.writeFile(versionedAbs, content);

    const key = KEY_BY_ASSET[relPath];
    manifest[key] = `/${versionedRel}`;
    console.log(`versioned ${relPath} -> ${versionedRel}`);
  }

  const htmlFiles = await collectHtmlFiles(ROOT);
  let htmlUpdated = 0;

  for (const htmlFile of htmlFiles) {
    const original = await fs.readFile(htmlFile, 'utf8');
    let updated = original;

    for (const pattern of REF_PATTERNS) {
      const replacement = manifest[pattern.key];
      updated = updated.replace(pattern.regex, replacement);
    }

    if (updated !== original) {
      await fs.writeFile(htmlFile, updated, 'utf8');
      htmlUpdated += 1;
      console.log(`updated refs in ${path.relative(ROOT, htmlFile)}`);
    }
  }

  await fs.writeFile(
    path.join(ROOT, 'assets-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  console.log(`done. updated ${htmlUpdated} html files.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
