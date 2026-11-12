import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalogue } from "../js/news-events-status.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = JSON.parse(readFileSync(path.join(rootDir, "data", "news-events.json"), "utf8"));
const errors = validateCatalogue(catalogue);
for (const entry of catalogue.entries || []) {
  if (!entry.image?.src) continue;
  const filePath = path.join(rootDir, entry.image.src.replace(/^\//, ""));
  if (!existsSync(filePath)) errors.push(`${entry.id} image file is missing: ${entry.image.src}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
if (catalogue.coverage?.complete !== false || catalogue.coverage?.reachedEnd !== false) {
  console.error("Coverage must stay incomplete. There is no definite end of the company history.");
  process.exit(1);
}
console.log(`News and events catalogue OK (${catalogue.entries.length} entries, coverage incomplete).`);
