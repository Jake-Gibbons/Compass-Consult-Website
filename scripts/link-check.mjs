import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const htmlFiles = [];
const problems = [];

const skipDirs = new Set(["node_modules", ".git"]);

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

function isExternalUrl(value) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("data:") ||
    value.startsWith("javascript:") ||
    value.startsWith("//")
  );
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const attrRegex = /(href|src)\s*=\s*"([^"]+)"/gi;
  let match;

  while ((match = attrRegex.exec(content)) !== null) {
    const attr = match[1];
    const rawValue = match[2].trim();

    if (
      !rawValue ||
      rawValue === "#" ||
      rawValue.startsWith("#") ||
      rawValue.includes("${") ||
      isExternalUrl(rawValue)
    ) {
      continue;
    }

    const cleanValue = rawValue.split("#")[0].split("?")[0];
    if (!cleanValue) continue;

    const targetPath = cleanValue.startsWith("/")
      ? path.join(rootDir, cleanValue)
      : path.resolve(path.dirname(filePath), cleanValue);

    if (!fs.existsSync(targetPath)) {
      const relativeFile = path.relative(rootDir, filePath);
      const relativeTarget = path.relative(rootDir, targetPath);
      problems.push(`${relativeFile}: ${attr}="${rawValue}" -> missing ${relativeTarget}`);
    }
  }
}

walk(rootDir);
htmlFiles.sort();

for (const filePath of htmlFiles) {
  checkFile(filePath);
}

if (problems.length > 0) {
  console.error("Link check failed. Broken local references found:\n");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`Link check passed: ${htmlFiles.length} HTML files scanned, 0 broken local references.`);
