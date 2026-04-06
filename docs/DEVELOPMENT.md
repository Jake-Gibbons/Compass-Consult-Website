# Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Available Scripts](#available-scripts)
3. [Build Process](#build-process)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
7. [Common Tasks](#common-tasks)
8. [Netlify Functions](#netlify-functions)
9. [Performance Tips](#performance-tips)
10. [SEO Best Practices](#seo-best-practices)
11. [Testing & Linting](#testing--linting)
12. [Troubleshooting](#troubleshooting)
13. [Resources](#resources)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 16 or higher (required for build tools and dev server)
- A modern code editor ([VS Code](https://code.visualstudio.com/) recommended)
- Git

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jake-Gibbons/Compass-Consult-Website.git
   cd Compass-Consult-Website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Git hooks** *(optional but recommended)*
   ```bash
   npm run hooks:install
   ```

4. **Start development server**
   ```bash
   npm run serve
   # → http://localhost:8000 (no caching)
   ```

5. **Watch and rebuild CSS on changes** *(in a second terminal)*
   ```bash
   npm run watch:css
   ```

---

## Available Scripts

All scripts are defined in `package.json` and run with `npm run <script>`.

| Script | Description |
|---|---|
| `serve` | Start local dev server on port 8000 with caching disabled |
| `dev` | Start local dev server on the default port (with caching) |
| `build` | Full production build: CSS → Lucide → asset versioning |
| `build:css` | Compile and minify Tailwind CSS (`css/input.css` → `css/tailwind.min.css`) |
| `build:lucide` | Bundle Lucide Icons into `js/lucide.min.js` using esbuild |
| `build:assets` | Version all static assets (append content hashes, update `assets-manifest.json`) |
| `watch:css` | Watch for HTML/JS changes and rebuild Tailwind CSS automatically |
| `lint` | Run ESLint on `js/**/*.js` |
| `lint:js` | Alias for `lint` |
| `link-check` | Check all HTML files for broken internal and external links |
| `check` | Run `lint` and `link-check` together (used in CI) |
| `optimize:images` | Batch-optimise images to WebP / compressed JPEG using sharp |
| `generate:pwa-icons` | Generate the full PWA icon set from the source logo |
| `sync:resources` | Synchronise downloadable resource files |
| `watch:resources` | Watch the docs folder and auto-sync resource entries and previews |
| `hooks:install` | Register `.githooks/` as the local Git hooks directory |

---

## Build Process

The project uses a local build pipeline instead of CDN links for CSS and
icons to enable asset versioning and long-lived caching.

### 1. Tailwind CSS

```bash
npm run build:css
# compiles: css/input.css → css/tailwind.min.css
```

`tailwind.config.js` scans `*.html`, `pages/**/*.html`, and `js/**/*.js`
for class names and removes unused styles (PurgeCSS / content scanning).
The brand colours, custom animations, and `@tailwindcss/typography` plugin
are configured there.

To rebuild automatically during development:

```bash
npm run watch:css
```

### 2. Lucide Icons

```bash
npm run build:lucide
# output: js/lucide.min.js
```

`scripts/build-lucide.mjs` imports only the icons used in the HTML pages
and bundles them with esbuild into a single minified file.

### 3. Asset Versioning

```bash
npm run build:assets
# renames: tailwind.min.css → tailwind.min.[hash].css
#          lucide.min.js    → lucide.min.[hash].js
#          aos.min.js       → aos.min.[hash].js
# writes:  assets-manifest.json
```

`scripts/version-assets.mjs` computes a truncated SHA-256 content hash
for each static asset and renames the file with the hash appended. It
writes `assets-manifest.json` so HTML files can reference the correct
versioned filename. This enables `Cache-Control: immutable` headers
without stale-cache issues.

### Full build (production)

```bash
npm run build
# runs: build:css → build:lucide → build:assets
```

---

## Project Structure

```
├── index.html                        # Main homepage
├── pages/                            # Secondary HTML pages
│   ├── about.html                    # About us
│   ├── company-information.html      # Company registration details
│   ├── contact.html                  # Contact form
│   ├── cookies.html                  # Cookie policy
│   ├── events.html                   # News & events
│   ├── partnerships.html             # Partnerships & accreditations
│   ├── privacy.html                  # Privacy policy (GDPR)
│   ├── resources.html                # Downloadable resource library
│   ├── services.html                 # Full services listing
│   ├── sitemap.html                  # HTML sitemap
│   ├── team.html                     # Team profiles
│   ├── terms.html                    # Terms of service
│   └── work-for-us.html              # Careers / vacancies
├── css/
│   ├── input.css                     # Tailwind entry file
│   ├── main.css                      # Custom styles and animations
│   └── tailwind.min.[hash].css       # Built Tailwind output
├── js/
│   ├── main.js                       # Shared JS behaviour
│   ├── lucide.min.[hash].js          # Lucide Icons bundle
│   └── aos.min.[hash].js             # AOS bundle
├── assets/                           # Images, logos, icons, downloads
├── data/                             # JSON content files
├── netlify/                          # Netlify Functions and utilities
├── scripts/                          # Build and utility scripts
└── docs/                             # Documentation
```

See [STRUCTURE.md](../STRUCTURE.md) for the complete folder and file reference.

---

## Development Workflow

### Working with HTML

- Edit the relevant `.html` file in the root or `pages/` directory.
- Use semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- Add `<!-- Section Name -->` HTML comments before major sections.
- Every `<img>` must have an `alt` attribute (use `alt=""` for decorative images).
- Copy the `<head>`, skip link, sidebar `<aside>`, mobile `<nav>`, and `<footer>`
  structure from an existing page (e.g. `pages/about.html`) when creating new pages.

### Adding Styles

- Add custom rules to `css/main.css`, following the existing section order
  (see the table of contents at the top of the file).
- Prefer Tailwind utility classes in HTML over new CSS rules where possible.
- Maintain consistent brand colours:
  - Primary: `#483086` (`compass-purple`) — headings, buttons, sidebar
  - Accent: `#2da8b4` (`compass-teal`) — highlights and links
- Add a brief inline comment to any new CSS rule explaining its purpose.
- After changing `css/input.css` or any scanned file, rebuild: `npm run build:css`.

### Adding JavaScript

- All shared behaviour belongs in `js/main.js`.
- Use `const` and `let` — never `var`.
- Use named functions for top-level initialisers and arrow functions for callbacks.
- Guard against missing DOM elements:
  ```javascript
  const element = document.getElementById('my-element');
  if (!element) return;
  ```
- Add JSDoc comments to every new function:
  ```javascript
  /**
   * Brief description of what the function does.
   *
   * @param {string} selector - CSS selector string.
   * @returns {Element|null} The first matching element, or null.
   */
  function findElement(selector) {
    return document.querySelector(selector);
  }
  ```
- Export utility functions through `window.CompassConsult` so they are
  accessible from individual page scripts and the browser console.
- Do not use `console.log` in committed code.
- Run `npm run lint` before committing.

### Adding downloadable resources

- Drop new PDFs into `assets/downloads/docs`.
- Run `npm run sync:resources` to update the library manually.
- Or run `npm run watch:resources` during local work to auto-sync on file changes.
- If `PyMuPDF` is installed from `requirements-resource-previews.txt`, the sync step renders the first PDF page into `assets/images/resource-previews/`.
- If Python PDF rendering is unavailable, the sync step still creates a branded placeholder preview so the resource card never breaks.

---

## Coding Standards

### HTML

```html
<!-- Hero Section -->
<section class="py-20 bg-compass-dark">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white">Our Services</h2>
  </div>
</section>
```

- Use semantic elements.
- Every interactive element must be keyboard accessible.
- Copyright year spans must use `<span class="year-span"></span>` (populated by JS).
- New pages must include a skip navigation link:
  ```html
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ```
  and `id="main-content"` on the `<main>` element.

### CSS / Tailwind

```html
<!-- Responsive sizing -->
<div class="text-base md:text-lg lg:text-xl">…</div>

<!-- Brand hover states -->
<button class="bg-compass-purple hover:bg-compass-lightPurple transition-colors">
  Click me
</button>
```

### JavaScript

```javascript
// Descriptive function names
function animateElementOnScroll(selector) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;
  elements.forEach(el => observer.observe(el));
}
```

### Accessibility

- All interactive elements must be reachable by keyboard and have visible
  focus indicators.
- Use `aria-label` or visible text for icon-only buttons and links.
- Decorative or duplicated images (e.g. ticker strip duplicates) must use
  `alt=""` and `role="presentation"`.
- Respect `prefers-reduced-motion` — add a corresponding rule in the
  reduced-motion media query block in `main.css` for any new animations.

---

## Common Tasks

### Adding a New Page

1. Create a new `.html` file in `pages/` (or the root for top-level pages).
2. Copy the `<head>`, skip link, sidebar `<aside>`, mobile `<nav>`, and
   `<footer>` from an existing page (e.g. `pages/about.html`).
3. Add `id="main-content"` to the `<main>` element.
4. Update the `nav-link.active` class in the sidebar and mobile menu to
   highlight the new page.
5. Add a link to the new page in every other page's sidebar and mobile menu.
6. Add an entry to `sitemap.xml` (or push to `main` to let CI regenerate it).

### Adding a Team Member

1. Add the profile photo to `assets/images/team/` (WebP preferred).
2. Update `data/team.json` with the member's details
   (see [`data/README.md`](../data/README.md) for the full field schema).
3. Add a new team card in `pages/team.html`, following the structure of
   existing cards.

### Adding a New Service

1. Update `data/services.json` with the service entry.
2. Add the service card to `pages/services.html`.
3. Optionally add a summary card to the homepage (`index.html`) services section.

### Adding a Client Logo

1. Add the logo to `assets/images/authorities/` (WebP preferred).
2. Update `data/clients.json` with the client details.
3. Add an `<img>` tag to the ticker strip in `index.html`
   (add it to both the original and the duplicate set).

### Optimising Images

```bash
npm run optimize:images
```

Converts images to WebP and compresses JPEGs using sharp. Run this after
adding new images to `assets/images/`.

### Generating PWA Icons

```bash
npm run generate:pwa-icons
```

Reads the source logo and generates the full icon set (16 × 16 to 512 × 512)
into `assets/icons/favicon/`.

---

## Netlify Functions

The `netlify/functions/` directory contains TypeScript serverless functions
deployed automatically by Netlify.

### `subscribers.mts`

Handles newsletter subscription requests. Subscriber records are persisted
to **Netlify Blobs** (edge-native key-value storage).

To develop functions locally, install the [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
netlify dev
# → http://localhost:8888 (proxies functions alongside the static site)
```

Function logs are available in the Netlify dashboard under
**Functions → subscribers → Logs**.

---

## Performance Tips

✅ **Do:**
- Use WebP images with a JPEG fallback for broad compatibility.
- Add `loading="lazy"` and `decoding="async"` to images below the fold
  (`optimizeImages()` in `main.js` does this automatically).
- Minify CSS and JS before deploying (`npm run build`).
- Version assets for long-lived caching (`npm run build:assets`).
- Use CDN-hosted fonts with `font-display: swap`.

❌ **Avoid:**
- Inline large `<style>` or `<script>` blocks.
- Unoptimised images (run `npm run optimize:images`).
- Unused CSS or JavaScript.
- Render-blocking resources loaded in `<head>` without `defer` or `async`.
- Excessive or auto-playing animations.

---

## SEO Best Practices

- Each page must have a unique `<title>` and `<meta name="description">`.
- Use `<h1>` once per page; structure headings hierarchically.
- All images need descriptive `alt` text.
- Schema.org structured data is implemented on key pages — maintain it
  when adding new content.
- `sitemap.xml` is auto-generated by the `main.yml` CI workflow on every
  push to `main`.

---

## Testing & Linting

### ESLint

```bash
npm run lint
```

ESLint is configured in `eslint.config.mjs` (flat config format) and
targets `js/**/*.js`. Fix auto-fixable issues with:

```bash
npx eslint "js/**/*.js" --fix
```

### Link Check

```bash
npm run link-check
```

Crawls all HTML files and reports broken internal and external links.
Runs as part of `npm run check` (used in the `check.yml` CI workflow).

### Full check (CI-equivalent)

```bash
npm run check
```

### Manual Testing Checklist

- [ ] Test all pages in Chrome, Firefox, Safari, and Edge
- [ ] Test on a real mobile device or DevTools responsive mode
- [ ] Verify all forms submit and return a confirmation
- [ ] Check keyboard navigation (Tab key throughout)
- [ ] Verify animations work and respect `prefers-reduced-motion`
- [ ] Run Lighthouse (Performance, Accessibility, Best Practices, SEO)

### Accessibility Testing

- Use keyboard navigation (Tab, Shift+Tab, Enter, Escape).
- Check colour contrast with the
  [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
- Test with a screen reader (NVDA on Windows, VoiceOver on macOS/iOS).
- Verify heading hierarchy with the
  [Headings Map browser extension](https://www.headingsmap.com/).

---

## Troubleshooting

### Animations not showing

- Check browser support for `IntersectionObserver`.
- Confirm `js/main.js` is loading without errors (browser console).
- Ensure the element has the correct reveal class applied.
- Check the `prefers-reduced-motion` media query is not suppressing the animation.

### Styles not applied

- Run `npm run build:css` and hard-refresh (`Ctrl + Shift + R`).
- Verify the versioned CSS filename in `assets-manifest.json` matches
  the `<link>` tag in the HTML.
- Check Tailwind's content paths in `tailwind.config.js` include the file
  containing the class names you added.

### Images not loading

- Confirm the file path in the `src` attribute matches the actual file
  location (paths are relative to the site root, e.g. `/assets/images/team/photo.webp`).
- Verify the file was committed to the repository.
- Check the file size — very large images may time out on slow connections.

### Netlify Functions not working

- Run `netlify dev` locally and check the terminal for function errors.
- Confirm `NETLIFY_BLOBS_*` environment variables are set in the Netlify
  dashboard under **Site Settings → Environment Variables**.

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [AOS (Animate On Scroll)](https://michalsnik.github.io/aos/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Blobs Documentation](https://docs.netlify.com/blobs/overview/)
- [MDN Web Docs](https://developer.mozilla.org)
- [Web.dev — Core Web Vitals](https://web.dev/vitals/)
- [WebAIM — Accessibility](https://webaim.org)
- [Can I Use](https://caniuse.com)

---

## Git Workflow

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Make changes, then stage and commit
git add .
git commit -m "feat(pages): add new feature"

# Push and open a Pull Request on GitHub
git push origin feature/new-feature
```

Follow **Conventional Commits** format for commit messages.
See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full list of commit types
and the Pull Request checklist.

---

**Last Updated:** April 2026  
**Maintainer:** Zenith IT
