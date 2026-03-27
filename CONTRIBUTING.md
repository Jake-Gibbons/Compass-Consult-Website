# Contributing to Compass Consult Website

Thank you for taking the time to contribute! This guide explains how to
propose changes, the coding standards to follow, and what to check before
opening a Pull Request.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Branching Strategy](#branching-strategy)
3. [Making Changes](#making-changes)
4. [Coding Standards](#coding-standards)
5. [Commit Messages](#commit-messages)
6. [Pull Request Checklist](#pull-request-checklist)
7. [Reporting Bugs](#reporting-bugs)
8. [Suggesting Features](#suggesting-features)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Compass-Consult-Website.git
   cd Compass-Consult-Website
   ```
3. **Install** the optional dev server:
   ```bash
   npm install
   ```
4. **Run** the local dev server:
   ```bash
   npm run serve
   # Site is available at http://localhost:8000
   ```

---

## Branching Strategy

| Branch prefix | Use for |
|---|---|
| `feature/` | New pages, components, or functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation updates only |
| `chore/` | Dependency updates, config changes |

Example:
```bash
git checkout -b feature/add-case-studies-page
```

All Pull Requests should target the `main` branch.

---

## Making Changes

### Adding a New Page

1. Create a new `.html` file in `pages/` (or root for top-level pages).
2. Copy the `<head>`, skip link, sidebar `<aside>`, mobile `<nav>`, and `<footer>`
   from an existing page (e.g. `pages/about.html`) to keep the structure
   consistent.
3. Ensure `<main id="main-content" ...>` has the `id="main-content"` attribute
   so the skip link target is present.
4. Update the `nav-link.active` class in the sidebar and mobile menu to
   highlight the new page.
5. Add a link to the new page in every other page's sidebar and mobile menu.
6. Add an entry to `sitemap.xml`.

### Updating Content

- **Team members** — edit `data/team.json` and update `pages/team.html`.
- **Services** — edit `data/services.json` and update `pages/services.html`.
- **Client logos** — add images to `assets/images/authorities/` and update
  the ticker strip in `index.html`.

### Updating Styles

- **Brand colours** — change the CSS custom properties in the `:root` block
  at the top of `css/main.css`.
- **Component styles** — add new rules to `css/main.css` following the
  existing section structure. Prefer Tailwind utility classes in HTML where
  possible.

### Updating JavaScript

- All shared behaviour belongs in `js/main.js`.
- Use JSDoc comments for every new function:
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
- Export any utility functions through `window.CompassConsult` so they are
  accessible from the browser console during development.

---

## Coding Standards

### HTML

- Use semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`,
  `<footer>`, etc.).
- Every `<img>` must have an `alt` attribute.
- Every interactive element must be keyboard accessible.
- Add HTML comments before major sections:
  ```html
  <!-- Hero Section -->
  <section class="...">
  ```

### CSS

- Follow the existing section order in `main.css` (see the table of
  contents at the top of the file).
- Prefer Tailwind CSS utility classes in HTML over new CSS rules.
- If you add a new CSS rule, include a brief inline comment explaining its
  purpose.

### JavaScript

- Use `const` and `let` — never `var`.
- Use arrow functions for callbacks; use named functions for top-level
  initialisers so they are easy to find.
- Guard against missing DOM elements before accessing them:
  ```javascript
  const element = document.getElementById('my-element');
  if (!element) return;
  ```
- Do not use `console.log` in committed code.

### Accessibility

- All interactive elements must be reachable by keyboard.
- Use `aria-label` or visible text for icon-only buttons and links.
- Decorative images (e.g. background illustrations, duplicated ticker images)
  should use `alt=""` and `role="presentation"` to hide them from screen readers.
- Respect `prefers-reduced-motion` — do not add new animations without
  adding a corresponding rule in the reduced-motion media query block in
  `main.css`.

---

## Commit Messages

Follow the **Conventional Commits** format:

```
<type>(<scope>): <short description>

[optional body]
```

| Type | Use for |
|---|---|
| `feat` | New feature or page |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, whitespace, no logic change |
| `refactor` | Code restructuring without feature/fix |
| `chore` | Build tools, dependencies, config |

Examples:
```
feat(pages): add case studies page
fix(nav): close mobile menu on Escape key
docs(readme): update quick start instructions
```

---

## Pull Request Checklist

Before opening a Pull Request, verify the following:

- [ ] Tested locally in Chrome, Firefox, and Safari
- [ ] Tested on mobile (or with DevTools responsive mode)
- [ ] All new images have `alt` attributes (use `alt=""` for decorative images)
- [ ] No broken internal links
- [ ] New JavaScript functions have JSDoc comments
- [ ] New CSS rules have inline comments
- [ ] New HTML sections have HTML comments
- [ ] Copyright year spans use `<span class="year-span"></span>`
- [ ] `sitemap.xml` updated if a new page was added
- [ ] No `console.log` statements in committed code
- [ ] New pages include the skip navigation link (`<a href="#main-content" class="skip-link">`)
  and `id="main-content"` on the `<main>` element

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/Jake-Gibbons/Compass-Consult-Website/issues)
and include:

- **Description** — what happened vs. what you expected.
- **Steps to reproduce** — numbered list.
- **Environment** — browser, OS, screen size.
- **Screenshot** — if applicable.

---

## Suggesting Features

Open a [GitHub Issue](https://github.com/Jake-Gibbons/Compass-Consult-Website/issues)
with the label `enhancement` and describe:

- **The problem** you are trying to solve.
- **Your proposed solution**.
- **Alternatives** you considered.

---

**Last Updated:** March 2026
**Maintainer:** Zenith IT / Jake Gibbons
