# Development Guide

## Getting Started

### Prerequisites
- Node.js 16+ (optional, for development server)
- A modern code editor (VS Code recommended)
- Git for version control

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jake-Gibbons/Compass-Consult-Website.git
   cd Compass-Consult-Website
   ```

2. **Install dependencies** (optional)
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run serve
   # or
   npx http-server -p 8000
   ```

4. **Open in browser**
   - Navigate to `http://localhost:8000`

---

## Project Structure

```
├── index.html              # Main homepage
├── pages/                  # Secondary HTML pages
│   ├── about.html          # About us
│   ├── company-information.html # Company details
│   ├── contact.html        # Contact form
│   ├── cookies.html        # Cookie policy
│   ├── events.html         # News & events
│   ├── partnerships.html   # Partnerships & accreditations
│   ├── privacy.html        # Privacy policy (GDPR)
│   ├── resources.html      # Downloadable resource library
│   ├── services.html       # Full services listing
│   ├── team.html           # Team profiles
│   ├── terms.html          # Terms of service
│   └── work-for-us.html    # Careers / vacancies
├── css/                    # Stylesheets
├── js/                     # JavaScript files
├── assets/                 # Images, icons, fonts, downloads
├── data/                   # JSON content files (team, services, clients)
└── docs/                   # Documentation
```

---

## Development Workflow

### 1. Working with HTML
- Edit the relevant `.html` file
- Keep semantic HTML structure
- Use Tailwind CSS classes for styling
- Ensure responsive design with mobile-first approach

### 2. Adding Styles
- Currently using Tailwind CSS via CDN
- For extraction, create CSS files in `css/` folder
- Use BEM naming convention for custom classes
- Maintain consistent color scheme:
  - Primary: `#483086` (compass-purple)
  - Secondary: `#2da8b4` (compass-teal)

### 3. Adding JavaScript
- Extract inline scripts to `js/` folder
- Keep scripts modular and organised
- Use clear, descriptive function names
- Comment complex logic

Example structure for `js/main.js`:
```javascript
// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  initializeAnimations();
  initializeInteractions();
});

// Navigation
function initializeNavigation() {
  // Navigation logic here
}

// Animations
function initializeAnimations() {
  // Animation logic here
}

// Interactions
function initializeInteractions() {
  // Interaction logic here
}
```

---

## Key Technologies

### HTML5
- Semantic markup
- Meta tags for SEO
- Accessibility-first approach

### Tailwind CSS
- Utility-first CSS framework
- Responsive design
- Custom color configuration
- Built-in animations

### JavaScript
- Vanilla JS (no framework)
- Intersection Observer API for scroll animations
- Event listeners for interactions

### Assets
- Lucide Icons for SVG icons
- Google Fonts (Plus Jakarta Sans)
- CDN-based resources

---

## Code Standards

### HTML
```html
<!-- Use semantic elements -->
<section id="services" class="py-20">
  <div class="max-w-7xl mx-auto">
    <h2>Services</h2>
  </div>
</section>
```

### CSS/Tailwind
```tailwind
<!-- Responsive classes -->
<div class="text-base md:text-lg lg:text-xl">
  <!-- Mobile: base, Tablet: md, Desktop: lg -->
</div>

<!-- Hover states -->
<button class="bg-purple-600 hover:bg-purple-700 transition-colors">
  Click me
</button>
```

### JavaScript
```javascript
// Use descriptive names
function animateElementOnScroll(selector) {
  const elements = document.querySelectorAll(selector);
  // Implementation
}

// Use arrow functions for callbacks
elements.forEach(el => {
  observer.observe(el);
});
```

---

## Common Tasks

### Adding a New Page
1. Create new HTML file in `pages/` folder (or root for top-level pages)
2. Copy the `<head>`, skip link (`<a href="#main-content" class="skip-link">`), sidebar `<aside>`, mobile `<nav>`, and `<footer>` from an existing page (e.g. `pages/about.html`)
3. Add `id="main-content"` to the `<main>` element
4. Create the main content section
5. Update the `nav-link.active` class in the sidebar and mobile menu to highlight the new page
6. Add a link to the new page in every other page's sidebar and mobile menu
7. Add an entry to `sitemap.xml`

### Adding Team Member
1. Add photo to `/assets/images/team/`
2. Update `data/team.json` with member details (schema reference: `data/README.md`)
3. Add a new team card in `pages/team.html`, following the structure of existing cards

### Adding New Service
1. Update `data/services.json` with the new service entry
2. Add the service card to `pages/services.html`
3. Add a summary card to the homepage (`index.html`) services section if appropriate

### Adding Client
1. Add client photo or logo to `/assets/images/authorities/` (photos) or `/assets/logos/` (logos)
2. Update `data/clients.json` with the client details
3. Add an `<img>` tag to the ticker strip in `index.html` (both the original and the duplicate set)

---

## Performance Tips

✅ **Do:**
- Optimize images with appropriate formats (WebP, compressed JPG)
- Use lazy loading for images
- Minify CSS and JavaScript in production
- Implement caching strategies
- Use CDN for external resources

❌ **Avoid:**
- Inline large styles/scripts
- Unoptimized images
- Unused dependencies
- Render-blocking resources
- Excessive animations on load

---

## SEO Best Practices

- Use descriptive meta titles and descriptions
- Implement structured data (Schema.org)
- Use semantic HTML elements
- Optimize images with alt text
- Create XML sitemap
- Submit to Google Search Console

---

## Testing

### Manual Testing
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices (iOS, Android)
- Test form submissions
- Test links and navigation
- Test animations and interactions

### Accessibility Testing
- Use keyboard navigation
- Check color contrast
- Test with screen readers
- Ensure proper heading hierarchy
- Test form labels

---

## Deployment

### Before Deploying
- [ ] Test all pages and links
- [ ] Optimize images
- [ ] Minify CSS/JavaScript
- [ ] Update meta tags
- [ ] Check 404 pages
- [ ] Test forms and contact
- [ ] Verify analytics tracking
- [ ] Update sitemap

### Deployment Options
1. **Vercel** - Recommended for static sites
2. **Netlify** - Easy deployment with GitHub
3. **GitHub Pages** - Free hosting
4. **Traditional Hosting** - FTP/SSH upload

---

## Troubleshooting

### Animations not showing
- Check if Intersection Observer is supported
- Verify JavaScript is loaded
- Check browser console for errors
- Ensure reveal classes are applied

### Styles not applied
- Verify Tailwind CDN is loaded
- Check class names are correct
- Clear browser cache
- Check specificity of custom CSS

### Images not loading
- Verify image paths are correct
- Check image files exist
- Optimize file sizes
- Use absolute paths or relative paths consistently

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [MDN Web Docs](https://developer.mozilla.org)
- [Web.dev](https://web.dev)
- [Can I Use](https://caniuse.com)

---

## Git Workflow

```bash
# Feature branches
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review, merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

---

## Need Help?

- Check existing documentation
- Review code comments
- Consult team members
- Check browser console for errors
- Use browser DevTools

---

**Last Updated:** 15 February 2026  
**Maintainer:** Zenith IT
