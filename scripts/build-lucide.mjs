import { promises as fs } from 'fs';
import path from 'path';
import { build } from 'esbuild';

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, 'js/lucide.min.js');

const SCAN_TARGETS = [
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'pages'),
  path.join(ROOT, 'data'),
];

const ICON_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATA_LUCIDE_REGEX = /data-lucide="([^"]+)"/g;
const JSON_ICON_REGEX = /"icon"\s*:\s*"([^"]+)"/g;
const ICON_ALIASES = {
  linkedin: 'link',
};

function toPascalCase(iconName) {
  return iconName
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function extractIcons(content, regex) {
  const icons = [];
  let match = regex.exec(content);

  while (match) {
    icons.push(match[1]);
    match = regex.exec(content);
  }

  return icons;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(targetPath, predicate, acc = []) {
  if (!(await fileExists(targetPath))) {
    return acc;
  }

  const stats = await fs.stat(targetPath);
  if (stats.isFile()) {
    if (predicate(targetPath)) {
      acc.push(targetPath);
    }
    return acc;
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      await listFilesRecursive(fullPath, predicate, acc);
      continue;
    }

    if (entry.isFile() && predicate(fullPath)) {
      acc.push(fullPath);
    }
  }

  return acc;
}

async function collectIconNames() {
  const iconNames = new Set();

  const htmlFiles = [];
  const jsonFiles = [];

  for (const target of SCAN_TARGETS) {
    if (target.endsWith('.html')) {
      htmlFiles.push(target);
      continue;
    }

    if (target.endsWith('pages')) {
      await listFilesRecursive(target, (filePath) => filePath.endsWith('.html'), htmlFiles);
      continue;
    }

    if (target.endsWith('data')) {
      await listFilesRecursive(target, (filePath) => filePath.endsWith('.json'), jsonFiles);
    }
  }

  for (const htmlFile of htmlFiles) {
    const content = await fs.readFile(htmlFile, 'utf8');
    for (const iconName of extractIcons(content, DATA_LUCIDE_REGEX)) {
      if (ICON_NAME_PATTERN.test(iconName)) {
        iconNames.add(iconName);
      }
    }
  }

  for (const jsonFile of jsonFiles) {
    const content = await fs.readFile(jsonFile, 'utf8');
    for (const iconName of extractIcons(content, JSON_ICON_REGEX)) {
      if (ICON_NAME_PATTERN.test(iconName)) {
        iconNames.add(iconName);
      }
    }
  }

  return Array.from(iconNames).sort();
}

async function buildLucideSubset(iconNames) {
  const lucideModule = await import('lucide');
  const requestedExports = [];
  const appliedAliases = [];
  const missingIcons = [];

  for (const iconName of iconNames) {
    const resolvedName = ICON_ALIASES[iconName] || iconName;
    const exportName = toPascalCase(resolvedName);
    if (typeof lucideModule[exportName] !== 'undefined') {
      requestedExports.push(exportName);
      if (resolvedName !== iconName) {
        appliedAliases.push(`${iconName} -> ${resolvedName}`);
      }
    } else {
      missingIcons.push(iconName);
    }
  }

  if (missingIcons.length > 0) {
    throw new Error(`Could not resolve Lucide exports for icons: ${missingIcons.join(', ')}`);
  }

  const uniqueExports = Array.from(new Set(requestedExports)).sort();

  const entrySource = [
    `import { createIcons, ${uniqueExports.join(', ')} } from 'lucide';`,
    '',
    'const subsetIcons = {',
    ...uniqueExports.map((name) => `  ${name},`),
    '};',
    '',
    'window.lucide = {',
    '  icons: subsetIcons,',
    '  createIcons: (options = {}) => createIcons({ icons: subsetIcons, ...options }),',
    '};',
  ].join('\n');

  await build({
    stdin: {
      contents: entrySource,
      sourcefile: 'lucide-subset-entry.js',
      resolveDir: ROOT,
      loader: 'js',
    },
    outfile: OUTPUT_FILE,
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2018'],
    legalComments: 'none',
    logLevel: 'silent',
  });

  return {
    iconCount: iconNames.length,
    exportCount: uniqueExports.length,
    aliases: appliedAliases,
  };
}

async function main() {
  const iconNames = await collectIconNames();

  if (!iconNames.length) {
    throw new Error('No Lucide icons were discovered in HTML or JSON content.');
  }

  const { iconCount, exportCount, aliases } = await buildLucideSubset(iconNames);
  const stats = await fs.stat(OUTPUT_FILE);

  console.log(`lucide subset built: ${iconCount} icon names (${exportCount} exports)`);
  if (aliases.length) {
    console.log(`aliases: ${aliases.join(', ')}`);
  }
  console.log(`output: js/lucide.min.js (${stats.size} bytes)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
