# Compass Consult Website - Folder Structure

## Project Organization

```
compass-consult-website/
├── index.html                    # Main homepage
├── privacy.html                  # Privacy policy page
├── terms.html                    # Terms of service page
├── cookie.html                   # Cookie policy page
│
├── css/                          # Stylesheets
│   ├── main.css                  # Main styles (future extraction)
│   ├── components.css            # Component-specific styles
│   └── responsive.css            # Mobile/responsive styles
│
├── js/                           # JavaScript files
│   ├── main.js                   # Main script (future extraction)
│   ├── animations.js             # Animation utilities
│   ├── interactions.js           # User interaction handlers
│   └── utils.js                  # Helper functions
│
├── assets/                       # Static assets
│   ├── images/                   # Website images
│   │   ├── hero/                 # Hero section images
│   │   ├── team/                 # Team member photos
│   │   ├── clients/              # Client logos
│   │   ├── services/             # Service images
│   │   └── misc/                 # Other images
│   ├── icons/                    # Icon files
│   │   ├── svg/                  # SVG icons
│   │   └── favicon/              # Favicon files
│   ├── logos/                    # Brand logos
│   │   ├── compass-dark.svg      # Dark mode logo
│   │   ├── compass-light.svg     # Light mode logo
│   │   └── compass-icon.svg      # Icon-only logo
│   ├── fonts/                    # Custom font files
│   └── downloads/                # Downloadable resources (PDFs, etc.)
│
├── pages/                        # Additional page templates
│   ├── blog/                     # Blog pages
│   ├── services/                 # Service detail pages
│   ├── case-studies/             # Case study pages
│   └── about/                    # Extended about pages
│
├── data/                         # Data files
│   ├── team.json                 # Team member data
│   ├── services.json             # Services data
│   ├── clients.json              # Client information
│   └── testimonials.json         # Client testimonials
│
├── docs/                         # Documentation
│   ├── DEVELOPMENT.md            # Development guidelines
│   ├── DEPLOYMENT.md             # Deployment instructions
│   ├── API.md                    # API documentation
│   └── COMPONENTS.md             # Component documentation
│
├── dist/                         # Build output (production files)
│   ├── index.html
│   ├── css/
│   └── js/
│
├── .github/                      # GitHub configuration
│   └── workflows/                # GitHub Actions workflows
│       ├── deploy.yml            # Deployment workflow
│       └── tests.yml             # Testing workflow
│
├── .gitignore                    # Git ignore rules
├── package.json                  # Project metadata & scripts
├── README.md                     # Project overview
├── STRUCTURE.md                  # This file
└── LICENSE                       # License file
```

---

## Folder Descriptions

### **Root Level Files**
- `index.html` - Main landing page with hero, services, about, and contact sections
- `privacy.html` - Privacy policy compliance page
- `terms.html` - Terms of service page
- `cookie.html` - Cookie policy page

### **css/**
Stylesheets directory
- `main.css` - Global styles and utility classes
- `components.css` - Reusable component styles
- `responsive.css` - Media queries and breakpoints

### **js/**
JavaScript functionality
- `main.js` - Core functionality and initialization
- `animations.js` - Animation handlers and utilities
- `interactions.js` - Event listeners and user interactions
- `utils.js` - Helper functions and utilities

### **assets/**
Static media and resources
- **images/** - All website images organized by purpose
- **icons/** - SVG and icon files
- **logos/** - Brand logos in various formats
- **fonts/** - Custom font files (if needed beyond Google Fonts)
- **downloads/** - PDFs, whitepapers, and downloadable resources

### **pages/**
Additional page templates and sections
- Organized by feature/section for future expansion
- Supports modular page structure

### **data/**
JSON files for dynamic content
- Enables easy content management without database
- Team, services, clients, testimonials stored here

### **docs/**
Documentation for developers
- Development setup and guidelines
- Deployment procedures
- API and component documentation

### **dist/**
Production-ready build output
- Minified and optimized files
- Generated from source files

### **.github/**
GitHub-specific configuration
- GitHub Actions for CI/CD
- Automated testing and deployment workflows

---

## Setup Instructions

### 1. Project Files Organization
Move your current files appropriately:
```bash
# Keep in root
index.html (main page)
privacy.html
terms.html
cookie.html

# Extract CSS (when ready)
# Move inline styles from HTML to css/main.css

# Extract JS (when ready)
# Move script logic to js/ folder
```

### 2. Add Missing Files
Create these recommended files:
```bash
touch package.json       # Project metadata
touch .gitignore         # Git configuration
touch LICENSE            # Project license
```

### 3. Structure for Growth
As the site grows:
- Add blog posts to `pages/blog/`
- Add team photos to `assets/images/team/`
- Store client data in `data/clients.json`
- Update documentation in `docs/`

---

## Best Practices

✅ **Do:**
- Keep assets organized by type and purpose
- Use semantic file names (descriptive and lowercase)
- Maintain consistent folder structure
- Document new components/features
- Use data files for dynamic content

❌ **Don't:**
- Mix different file types in one folder
- Use vague file names (e.g., "new.css", "temp.js")
- Store large images directly in assets (use CDN)
- Commit build output to version control
- Mix business logic with presentation

---

## Future Enhancements

As the website scales:
1. **Setup build tools** (Webpack, Gulp, etc.)
2. **Implement CSS preprocessor** (SASS/SCSS)
3. **Add testing suite** (Jest, Cypress)
4. **Create component library** (Storybook)
5. **Setup CI/CD pipeline** (GitHub Actions)
6. **Add static site generator** (optional, for blog)

---

## Quick Command Reference

```bash
# View entire structure
tree -I 'node_modules' -L 3

# View only directories
find . -type d -maxdepth 2

# List all HTML files
find . -name "*.html"
```

---

**Last Updated:** 15 February 2026  
**Project:** Compass Consult Website
