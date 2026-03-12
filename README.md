# Compass Consult Website

Official website for **Compass Consult (Employability & Skills) Ltd** — a
professional consultancy built with HTML, CSS, and JavaScript.

Live site: **[compassconsult.co.uk](https://compassconsult.co.uk)**

---

## 🌍 Overview

This project is a fully responsive static website designed to present
Compass Consult's services, company information, and contact details in
a clean and professional format.

The site is structured for clarity, performance, and scalability. It is
suitable for deployment via GitHub Pages, shared hosting (IONOS), Vercel,
Netlify, or any static hosting provider.

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page markup |
| Tailwind CSS (CDN) | Utility-first styling and responsive layout |
| Vanilla JavaScript | Interactivity, animations, and accessibility |
| Lucide Icons | SVG icon library (CDN) |
| AOS | Animate On Scroll library (CDN) |
| Netlify Forms | Contact and newsletter form handling |

---

## 📂 Project Structure

```
Compass-Consult-Website/
├── index.html                    # Main homepage (entry point)
│
├── pages/                        # Secondary HTML pages
│   ├── about.html                # About us
│   ├── company-information.html  # Company registration details
│   ├── contact.html              # Contact form and details
│   ├── cookies.html              # Cookie policy
│   ├── events.html               # News & events
│   ├── partnerships.html         # Partnerships & accreditations
│   ├── privacy.html              # Privacy policy (GDPR)
│   ├── resources.html            # Downloadable resource library
│   ├── services.html             # Full services listing
│   ├── team.html                 # Team profiles
│   ├── terms.html                # Terms of service
│   └── work-for-us.html          # Careers / vacancies
│
├── css/
│   └── main.css                  # Custom styles, animations, layout fixes
│
├── js/
│   └── main.js                   # All shared JS behaviour (fully documented)
│
├── assets/
│   ├── images/                   # Site images (organised by category)
│   ├── icons/favicon/            # Favicon files and PWA web manifest
│   ├── logos/                    # Brand logos (Logo.png, compass_rose)
│   └── downloads/                # PDFs (factsheets, vacancy documents)
│
├── data/
│   ├── clients.json              # Client data
│   ├── services.json             # Service descriptions
│   └── team.json                 # Team member data
│
├── docs/
│   ├── DEVELOPMENT.md            # Local dev setup and coding guidelines
│   └── DEPLOYMENT.md             # Deployment procedures and environment notes
│
├── .github/workflows/            # CI/CD GitHub Actions workflows
├── .gitignore
├── package.json                  # npm scripts and metadata
├── sitemap.xml                   # XML sitemap for search engines
├── robots.txt                    # Crawl directives
├── CONTRIBUTING.md               # Contribution guidelines
├── STRUCTURE.md                  # Detailed folder structure reference
└── README.md                     # This file
```

See [STRUCTURE.md](STRUCTURE.md) for a full description of every folder.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 16 or higher *(optional — only needed for the local dev server)*
- A modern code editor ([VS Code](https://code.visualstudio.com/) recommended)
- Git

### Run locally

```bash
# 1. Clone the repository
git clone https://github.com/Jake-Gibbons/Compass-Consult-Website.git
cd Compass-Consult-Website

# 2. Install the local dev server (http-server)
npm install

# 3. Start the server
npm run serve
# or, without npm:
npx http-server -p 8000

# 4. Open the site
# Navigate to http://localhost:8000 in your browser
```

---

## 🏗 Architecture Notes

### Navigation

Every page uses the same two-piece navigation pattern:

| Element | Visible at |
|---|---|
| `<aside>` — fixed left sidebar | Desktop (≥ 1024 px) |
| `<nav>` — top bar + hamburger menu | Mobile (< 1024 px) |

The hamburger menu is wired up in `js/main.js` → `initializeMobileMenu()`.

### JavaScript (`js/main.js`)

`main.js` is the single shared script loaded by every page. It runs all
initialisers on `DOMContentLoaded`. Each function is documented with JSDoc
comments. Key functions:

| Function | Purpose |
|---|---|
| `initializeMobileMenu()` | Hamburger menu toggle with ARIA support |
| `initializeStickyTalkButton()` | Floating "Talk to Us" CTA button |
| `initializeRevealAnimations()` | IntersectionObserver scroll reveals |
| `initializeBioReadMore()` | Expandable team bio sections |
| `enhanceExternalLinks()` | `noopener`/`noreferrer` + aria-label injection |
| `connectFormLabels()` | Programmatically links `<label>` to `<input>` |
| `optimizeImages()` | Lazy-loading and async decoding attributes |
| `initializeAOS()` | Starts the Animate On Scroll library |

A global `window.CompassConsult` object exposes `scrollToElement`,
`debounce`, `isInViewport`, and the two animation initialisers for use
by individual page scripts.

### Styling (`css/main.css`)

The CSS file supplements Tailwind with:

- CSS custom properties for the brand colour palette
- Hamburger icon animation (three bars → ×)
- Mobile menu slide-in transition
- Sticky "Talk to Us" button and tooltip styles
- Scroll-triggered reveal animation utilities
- Reduced-motion media query overrides

See the table of contents at the top of `main.css` for a full section list.

### Data Files (`data/`)

JSON files store team member details, service descriptions, and client
information as a single source of truth for the site's content. When
updating content, edit both the JSON file and the corresponding HTML page
to keep them in sync. See [`data/README.md`](data/README.md) for the
full field schema for each file.

---

## 🚀 Deployment

The site is deployed to IONOS via GitHub Actions on every push to `main`.
See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full instructions.

### Other hosting options

| Platform | Notes |
|---|---|
| **Vercel** | Recommended for static sites — zero config needed |
| **Netlify** | Built-in form handling (used for contact + newsletter) |
| **GitHub Pages** | Free; go to Settings → Pages → select `main` branch |
| **FTP / cPanel** | Upload files to `public_html` via FileZilla or Cyberduck |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guide.

**Quick summary:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Make your changes following the coding standards in [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
4. Push and open a Pull Request against `main`

---

## 📄 License

This project is licensed under the **MIT License** — see the
[LICENSE](LICENSE) file for details.

---

## 👤 Author & Maintainer

**Zenith IT** — Website design and development
**Jake Gibbons** — Project owner
GitHub: [Jake-Gibbons](https://github.com/Jake-Gibbons)
