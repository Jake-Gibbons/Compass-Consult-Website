# Compass Consult Website

<div align="left">

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fcompassconsultes.co.uk&up_message=online&down_message=offline&label=live%20site&color=0ea5a4)](https://compassconsultes.co.uk)
[![Netlify Status](https://api.netlify.com/api/v1/badges/compass-consult/deploy-status)](https://app.netlify.com/sites/compass-consult/deploys)
[![Lint & Link Check](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/check.yml/badge.svg)](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/check.yml)
[![Generate Sitemap and Robots](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/main.yml/badge.svg)](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/main.yml)
[![Sync Resource Library](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/sync-resources.yml/badge.svg)](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/sync-resources.yml)
[![Node >= 16](https://img.shields.io/badge/node-%3E%3D16-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-7c3aed.svg)](#license)

<!-- LIGHTHOUSE_BADGES_START -->
[![Lighthouse Performance](https://img.shields.io/badge/Lighthouse%3A%20Performance-pending-lightgrey?logo=lighthouse&logoColor=white)](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/lighthouse.yml)
[![Lighthouse Accessibility](https://img.shields.io/badge/Lighthouse%3A%20Accessibility-pending-lightgrey?logo=lighthouse&logoColor=white)](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/lighthouse.yml)
[![Lighthouse Best Practices](https://img.shields.io/badge/Lighthouse%3A%20Best%20Practices-pending-lightgrey?logo=lighthouse&logoColor=white)](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/lighthouse.yml)
[![Lighthouse SEO](https://img.shields.io/badge/Lighthouse%3A%20SEO-pending-lightgrey?logo=lighthouse&logoColor=white)](https://github.com/Jake-Gibbons/Compass-Consult-Website/actions/workflows/lighthouse.yml)
<!-- LIGHTHOUSE_BADGES_END -->

</div>

Official website repository for **Compass Consult (Employability & Skills) Ltd** — a UK consultancy delivering employability, training, and skills support services.

**Live website:** [https://compassconsultes.co.uk](https://compassconsultes.co.uk)

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Architecture Notes](#architecture-notes)
- [Resource Library Automation](#resource-library-automation)
- [Deployment and CI/CD](#deployment-and-cicd)
- [Security](#security)
- [Accessibility](#accessibility)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This repository contains the full source for a **responsive static website** that prioritises:

- maintainable plain HTML/CSS/JavaScript
- accessibility and inclusive UX
- strong SEO and metadata coverage
- performance through local builds and versioned static assets
- secure hosting on Netlify with hardened HTTP headers

The website includes:

- a homepage and service pages
- events/news content
- downloadable resources
- contact and newsletter capture flows
- legal/policy pages

---

## Core Features

- **Responsive navigation model**
  - desktop sidebar (`<aside>`) + mobile top navigation with slide-in menu
- **Progressive Web App (PWA) support**
  - service worker (`sw.js`) and installable web app metadata
- **Performance-oriented asset pipeline**
  - Tailwind CSS builds, JS bundling, and content-hash versioning
- **Automated resource library sync**
  - PDF resources can auto-generate/refresh preview cards and images
- **SEO baseline included**
  - sitemap, robots, canonical-friendly URL structure, Open Graph support
- **Form + subscriber backend integration**
  - Netlify Forms plus Netlify Functions using Netlify Blobs storage
- **CI automation on GitHub Actions**
  - linting, link checking, sitemap/robots generation, resource sync workflow

---

## Tech Stack

| Area | Tooling |
|---|---|
| Markup | HTML5 (semantic, accessible-first) |
| Styling | Tailwind CSS + custom CSS (`css/main.css`) |
| JavaScript | Vanilla JS (shared site behaviour in `js/main.js`) |
| Icons | Lucide (locally bundled with esbuild) |
| Animations | AOS + IntersectionObserver-based reveal patterns |
| Hosting | Netlify |
| Serverless | Netlify Functions (`netlify/functions/subscribers.mts`) |
| Data storage | Netlify Blobs |
| Linting | ESLint (flat config) |
| Build/runtime tooling | Node.js + npm scripts |
| Image optimisation | `sharp` |

**Node requirement:** `>=16.0.0`

---

## Project Structure

```text
Compass-Consult-Website/
├── index.html
├── pages/                     # Primary site pages
├── css/                       # Tailwind input/output + custom styles
├── js/                        # Shared frontend behaviour and bundled scripts
├── assets/                    # Images, downloads, logos, icons
├── data/                      # JSON data used for site content
├── netlify/                   # Netlify functions + shared function utilities
├── scripts/                   # Build, sync, versioning, and optimization scripts
├── docs/                      # Development and deployment documentation
├── .github/workflows/         # CI/CD workflows
├── netlify.toml               # Netlify config (headers, build, functions)
├── assets-manifest.json       # Original -> hashed asset mapping
└── sw.js                      # Service worker
```

For a deeper file-by-file breakdown, see [STRUCTURE.md](STRUCTURE.md).

---

## Getting Started

### Prerequisites

- Node.js 16+
- npm
- Git

### Local setup

```bash
git clone https://github.com/Jake-Gibbons/Compass-Consult-Website.git
cd Compass-Consult-Website
npm install
npm run serve
```

The local server runs at **http://localhost:8000** by default.

### Optional developer setup

```bash
npm run hooks:install     # register project git hooks
npm run watch:css         # auto-rebuild Tailwind during changes
npm run watch:resources   # auto-sync resource files and previews
```

---

## Available Scripts

Run commands with `npm run <script>`.

| Script | Purpose |
|---|---|
| `serve` | Start local static server on port 8000 with cache disabled |
| `dev` | Start local static server with default behavior |
| `build` | Full production build (`build:css` -> `build:lucide` -> `build:assets`) |
| `build:css` | Compile Tailwind CSS (`css/input.css` -> `css/tailwind.min.css`) |
| `watch:css` | Rebuild Tailwind CSS in watch mode |
| `build:lucide` | Bundle Lucide icon set with esbuild |
| `build:assets` | Append content hashes to built assets and update manifest |
| `lint` / `lint:js` | Lint JavaScript (`js/**/*.js`) |
| `link-check` | Check internal/external links across HTML files |
| `check` | Run lint + link check (CI parity command) |
| `optimize:images` | Optimise image assets with sharp |
| `generate:pwa-icons` | Generate app icon set for favicon/PWA usage |
| `sync:resources` | Sync downloadable resources with `pages/resources.html` |
| `watch:resources` | Watch docs folder and sync resources automatically |
| `hooks:install` | Point git hooks to `.githooks/` |

> `test` and `deploy` scripts are placeholders in `package.json` and are not active test/deploy pipelines.

---

## Architecture Notes

### Navigation system

All pages follow a shared layout model:

- **Desktop:** fixed left sidebar
- **Mobile:** top navigation + hamburger panel

Behavior is centralised in `js/main.js` and initialised on `DOMContentLoaded`.

### Shared frontend runtime (`js/main.js`)

Key responsibilities include:

- mobile menu state and accessibility attributes
- sticky CTA behaviour
- reveal/scroll animations
- team bio expansion behavior
- external link hardening (`noopener`/`noreferrer`)
- form label association enhancements
- image loading enhancements

### Styling approach

- utility-first Tailwind usage in markup
- project-specific overrides/utilities in `css/main.css`
- CSS/JS are versioned via hashed filenames for immutable caching

### Data model

Core editable content is represented in JSON under `data/` (for example team, services, clients) and reflected in page templates.

### Functions and subscribers

`netlify/functions/subscribers.mts` handles newsletter subscription writes to Netlify Blobs.

---

## Resource Library Automation

When PDFs are added under `assets/downloads/docs`:

- resource entries can be synced to `pages/resources.html`
- preview images can be generated from PDF first pages when Python preview deps are available
- fallback placeholder previews are generated when rendering dependencies are missing

For PDF-based previews locally:

```bash
python3 -m pip install -r requirements-resource-previews.txt
```

---

## Deployment and CI/CD

### Netlify deployment

The site is hosted on Netlify. Runtime/deploy settings (headers, redirects, functions, build settings) live in [`netlify.toml`](netlify.toml).

### GitHub Actions workflows

| Workflow | File | Purpose |
|---|---|---|
| Lint & Link Check | `.github/workflows/check.yml` | Runs `npm run check` on push/PR to `main` |
| Generate Sitemap and Robots | `.github/workflows/main.yml` | Regenerates `sitemap.xml` and `robots.txt` on push to `main` |
| Sync Resource Library | `.github/workflows/sync-resources.yml` | Auto-syncs resource page/previews when source files change |

---

## Security

Security headers are configured via Netlify and include protections such as:

- Content Security Policy
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- strict referrer policy
- restrictive permissions policy

Also note:

- external links are hardened in runtime JS
- static assets are versioned for safer long-lived caching behavior

---

## Accessibility

The project follows accessibility-first practices, including:

- skip links and semantic landmarks
- keyboard-friendly interactive controls
- ARIA support for navigation and icon-only controls
- reduced-motion handling (`prefers-reduced-motion`)
- decorative image handling for screen readers

---

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution workflow and coding standards
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — developer setup and implementation guidance
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deployment operations and environment details
- [STRUCTURE.md](STRUCTURE.md) — expanded repository map
- [data/README.md](data/README.md) — JSON schema/content notes

---

## Contributing

1. Fork the repo
2. Create a branch (`feature/...`, `fix/...`, `docs/...`, `chore/...`)
3. Make changes
4. Run:
   ```bash
   npm run check
   ```
5. Open a pull request against `main`

For full expectations, read [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

The project is licensed under **MIT** (see the package metadata in `package.json`).

---

## Maintainers

- **Zenith IT** — design and development
- **Jake Gibbons** — repository owner

GitHub: [@Jake-Gibbons](https://github.com/Jake-Gibbons)
