# Compass Consult Website - Folder Structure

## Project Organisation

```
compass-consult-website/
├── index.html                    # Main homepage (root entry point)
│
├── pages/                        # All secondary HTML pages
│   ├── about.html                # About us page
│   ├── company-information.html  # Company information page
│   ├── contact.html              # Contact page
│   ├── cookies.html              # Cookie policy page
│   ├── events.html               # Events page
│   ├── partnerships.html         # Partnerships page
│   ├── privacy.html              # Privacy policy page
│   ├── resources.html            # Resources / downloads page
│   ├── services.html             # Services page
│   ├── team.html                 # Team page
│   ├── terms.html                # Terms of service page
│   └── work-for-us.html          # Careers / vacancies page
│
├── css/                          # Stylesheets
│   └── main.css                  # Main stylesheet
│
├── js/                           # JavaScript files
│   └── main.js                   # Main script
│
├── assets/                       # Static assets
│   ├── images/                   # Website images
│   │   ├── authorities/          # Local authority event photos
│   │   ├── events/               # Event images
│   │   ├── partners/             # Partner organisation logos
│   │   ├── resource-previews/    # PDF preview thumbnails
│   │   ├── team/                 # Team member photos
│   │   └── work-for-us/          # Work-for-us section images
│   ├── icons/                    # Icon files
│   │   └── favicon/              # Favicon files & web manifest
│   ├── logos/                    # Brand logos
│   │   ├── Logo.png              # Main site logo
│   │   ├── compass_rose.png      # Compass rose image
│   │   └── compass_rose.svg      # Compass rose SVG
│   └── downloads/                # Downloadable resources
│       ├── factsheets/           # PDF factsheets and blog PDFs
│       └── vacancies/            # Job description PDFs
│
├── data/                         # Data files
│   ├── clients.json              # Client information
│   ├── services.json             # Services data
│   └── team.json                 # Team member data
│
├── docs/                         # Documentation
│   ├── DEPLOYMENT.md             # Deployment instructions
│   └── DEVELOPMENT.md            # Development guidelines
│
├── .github/                      # GitHub configuration
│   └── workflows/                # GitHub Actions workflows
│       ├── main.yml              # Sitemap & robots.txt generator
│       ├── Compass-Consult-Website-build.yaml  # IONOS build workflow
│       ├── Compass-Consult-Website-orchestration.yaml
│       └── deploy-to-ionos.yaml  # IONOS deployment workflow
│
├── .gitignore                    # Git ignore rules
├── package.json                  # Project metadata & scripts
├── sitemap.xml                   # XML sitemap
├── robots.txt                    # Robots directives
├── README.md                     # Project overview
└── STRUCTURE.md                  # This file
```

---

## Folder Descriptions

### **Root Level**
- `index.html` — Main landing page (hero, services, about, contact sections)
- `pages/` — All other HTML pages, organised in one dedicated directory

### **css/**
Single stylesheet for the entire site.
- `main.css` — Global styles, component styles, and responsive breakpoints

### **js/**
JavaScript functionality.
- `main.js` — Core functionality, animations, interactions, and utilities

### **assets/**
All static media and downloadable files.

- **images/** — Website images organised by purpose
  - `authorities/` — Photos from local authority visits/events
  - `events/` — Event photography and artwork
  - `partners/` — Partner and accreditation logos
  - `resource-previews/` — PNG thumbnail previews of PDF downloads
  - `team/` — Team member profile photos and fellowship badges
  - `work-for-us/` — Accreditation badges for the careers page

- **icons/favicon/** — Browser icons and the PWA web manifest

- **logos/** — Brand identity assets (logo, compass rose)

- **downloads/** — Files available for visitors to download
  - `factsheets/` — Policy factsheets and thought-leadership blog PDFs
  - `vacancies/` — Job description PDFs

### **data/**
JSON files for dynamic content rendering via inline JavaScript.
- `clients.json` — Client organisation data
- `services.json` — Service descriptions and details
- `team.json` — Team member biographies

### **docs/**
Developer documentation.
- `DEVELOPMENT.md` — Local development setup and coding guidelines
- `DEPLOYMENT.md` — Deployment procedures and environment notes

### **.github/**
GitHub-specific configuration and CI/CD automation.
- `main.yml` — Auto-generates `sitemap.xml` and `robots.txt` on push to `main`
- Build and deployment workflows for IONOS hosting

---

## URL Structure

All pages use absolute root-relative paths internally. The URL layout is:

| File | URL |
|------|-----|
| `index.html` | `https://compassconsult.co.uk/` |
| `pages/about.html` | `https://compassconsult.co.uk/pages/about` |
| `pages/services.html` | `https://compassconsult.co.uk/pages/services` |
| `pages/team.html` | `https://compassconsult.co.uk/pages/team` |
| … | … |

---

## Best Practices

✅ **Do:**
- Keep assets organised by type and purpose
- Use semantic file names (descriptive and lowercase)
- Maintain consistent folder structure
- Document new components/features
- Use data files for dynamic content
- Use absolute root-relative paths (`/pages/`, `/assets/`, `/css/`) in HTML

❌ **Don't:**
- Mix different file types in one folder
- Use vague file names (e.g., `new.css`, `temp.js`)
- Store large images directly in `assets/` (use CDN for production)
- Commit build output to version control
- Use relative paths in HTML (breaks when pages are nested in subdirectories)

---

**Last Updated:** March 2026  
**Project:** Compass Consult Website
