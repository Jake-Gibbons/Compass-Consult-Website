/**
 * perf-update.mjs
 * Replaces CDN scripts/stylesheets with self-hosted or pre-built equivalents
 * across all HTML files in the project.
 *
 * Changes applied to every .html file:
 *   1. Remove Tailwind CDN <script>
 *   2. Remove Lucide CDN <script> from <head>
 *   3. Remove the inline tailwind.config <script> block
 *   4. Add preconnect hints for Google Fonts
 *   5. Add <link> for pre-built /css/tailwind.min.css
 *   6. Replace AOS CDN CSS with self-hosted /css/aos.css
 *   7. Replace AOS CDN JS with self-hosted /js/aos.min.js
 *   8. Add self-hosted /js/lucide.min.js before main.js
 *   9. Add <link rel="preload"> for logo LCP image
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

/** Collect all HTML files */
function getHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      files.push(...getHtmlFiles(full));
    } else if (extname(entry) === '.html') {
      files.push(full);
    }
  }
  return files;
}

function transform(src, filePath) {
  let out = src;

  // -------------------------------------------------------------------------
  // 1 & 2. Remove Tailwind CDN script + Lucide CDN script from <head>
  //    These appear as two consecutive <script> tags with an optional comment
  // -------------------------------------------------------------------------
  // Remove the comment + Tailwind CDN script line
  out = out.replace(
    /[ \t]*<!-- Third-party scripts[^>]*-->\n[ \t]*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\n/,
    ''
  );
  // Remove Lucide CDN script line (in head)
  out = out.replace(
    /[ \t]*<script src="https:\/\/unpkg\.com\/lucide@[^"]*"><\/script>\n/,
    ''
  );

  // -------------------------------------------------------------------------
  // 3. Remove the inline tailwind.config <script> block
  //    The block starts with an optional comment, then <script> ... </script>
  //    Regex must be non-greedy and span multiple lines.
  // -------------------------------------------------------------------------
  out = out.replace(
    /[ \t]*<!-- Tailwind configuration[^\n]*\n(?:[ \t]*[^\n]*\n)*?[ \t]*<script>\s*\n[\s\S]*?tailwind\.config\s*=[\s\S]*?<\/script>\n/,
    ''
  );

  // -------------------------------------------------------------------------
  // 4 & 5. Replace the Google Fonts link with preconnect + Google Fonts + Tailwind CSS link
  // -------------------------------------------------------------------------
  const googleFontsComment = /[ \t]*<!-- Google Fonts[^\n]*\n[ \t]*<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/;
  const replacement = `    <!-- Google Fonts — Plus Jakarta Sans (weights 300–700) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Pre-built Tailwind CSS (replaces CDN runtime — 47 KB vs 3 MB) -->
    <link rel="stylesheet" href="/css/tailwind.min.css">`;

  if (googleFontsComment.test(out)) {
    out = out.replace(googleFontsComment, replacement);
  }

  // -------------------------------------------------------------------------
  // 6. Replace AOS CDN CSS link with self-hosted version
  // -------------------------------------------------------------------------
  out = out.replace(
    /[ \t]*<!-- AOS \(Animate On Scroll\)[^\n]*\n[ \t]*<link rel="stylesheet" href="https:\/\/unpkg\.com\/aos@[^"]*" \/>/,
    '    <!-- AOS (Animate On Scroll) stylesheet — initialised in /js/main.js -->\n    <link rel="stylesheet" href="/css/aos.css">'
  );
  // Fallback: plain AOS link without preceding comment
  out = out.replace(
    /[ \t]*<link rel="stylesheet" href="https:\/\/unpkg\.com\/aos@[^"]*" \/>/,
    '    <link rel="stylesheet" href="/css/aos.css">'
  );

  // -------------------------------------------------------------------------
  // 7 & 8. At the end of <body>: add self-hosted Lucide before main.js,
  //         replace AOS CDN JS with self-hosted version.
  // -------------------------------------------------------------------------
  // Add lucide before main.js (if not already present)
  if (!out.includes('/js/lucide.min.js')) {
    out = out.replace(
      /(<script src="\/js\/main\.js"><\/script>)/,
      '<script src="/js/lucide.min.js"></script>\n    $1'
    );
  }

  // Replace AOS CDN JS with self-hosted
  out = out.replace(
    /[ \t]*<!-- AOS runtime[^\n]*\n[ \t]*<script src="https:\/\/unpkg\.com\/aos@[^"]*"><\/script>/,
    '    <!-- AOS runtime — must be loaded before DOMContentLoaded -->\n    <script src="/js/aos.min.js"></script>'
  );
  // Fallback: plain AOS script without comment
  out = out.replace(
    /[ \t]*<script src="https:\/\/unpkg\.com\/aos@[^"]*"><\/script>/,
    '    <script src="/js/aos.min.js"></script>'
  );

  // -------------------------------------------------------------------------
  // 9. Add preload hint for logo (LCP resource) immediately after <head>
  //    so the browser discovers it as early as possible.
  // -------------------------------------------------------------------------
  if (!out.includes('rel="preload"') && !out.includes("rel='preload'")) {
    out = out.replace(
      /(<link rel="manifest"[^>]*>)/,
      '$1\n    <!-- Preload LCP image (logo) for faster paint -->\n    <link rel="preload" href="/assets/logos/Logo.png" as="image">'
    );
  }

  return out;
}

const htmlFiles = getHtmlFiles(ROOT).filter(f => !f.includes('node_modules') && !f.includes('.bak'));

let updated = 0;
for (const file of htmlFiles) {
  const src = readFileSync(file, 'utf8');
  const out = transform(src, file);
  if (out !== src) {
    writeFileSync(file, out, 'utf8');
    console.log(`✓ ${file.replace(ROOT, '')}`);
    updated++;
  } else {
    console.log(`  (no change) ${file.replace(ROOT, '')}`);
  }
}
console.log(`\nDone. Updated ${updated} / ${htmlFiles.length} files.`);
