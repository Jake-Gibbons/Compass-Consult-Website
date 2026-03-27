/**
 * Main JavaScript File
 * Compass Consult Website
 *
 * Shared behavior used across all static pages.
 * This script is loaded at the bottom of every HTML page and runs once the
 * DOM is fully parsed. It initialises icons, navigation, animations,
 * accessibility enhancements, and utility helpers.
 *
 * @file      js/main.js
 * @author    Zenith IT
 * @license   MIT
 */

// ---------------------------------------------------------------------------
// Bootstrap — run all initialisers once the DOM is ready
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initializeIcons();            // Render Lucide SVG icons
  initializeYearAndDate();      // Inject current year / date into placeholders
  initializeMobileMenu();       // Wire up the hamburger navigation
  initializeSidebarEnhancements(); // Keep sidebar CTA pinned + show overflow hint
  initializeStickyTalkButton(); // Create the floating "Talk to Us" CTA
  initializeRevealAnimations(); // Scroll-triggered reveal animations
  initializeBioReadMore();      // Expandable "Read More" bio sections
  enhanceExternalLinks();       // Add noopener/noreferrer + aria-labels
  initializeComingSoonSocialLinks(); // "Coming soon" tooltip for pending social links
  connectFormLabels();          // Associate <label> elements with their <input> partners
  optimizeImages();             // Add async decoding and lazy-loading attributes
  initializeTickerImageFallback(); // Replace broken ticker logos with the site logo
  initializeAOS();              // Start the Animate On Scroll library
  initializeSidebarScrollIndicator(); // Show/hide sidebar scroll hint
  initializeNewsletterForm();        // Newsletter subscription via Blobs API
});

// ---------------------------------------------------------------------------
// Social links — "Coming Soon" tooltip
// ---------------------------------------------------------------------------

/**
 * Shows a "Coming soon" tooltip when a placeholder social-media link is
 * clicked. Only one tooltip element is created and reused across all such
 * links to keep the DOM lean.
 *
 * Targeted elements: <a href="#" aria-label="Social profile">
 */
function initializeComingSoonSocialLinks() {
  const pendingSocialLinks = document.querySelectorAll('a[href="#"][aria-label="Social profile"]');
  /** @type {HTMLElement|null} Lazily-created tooltip DOM node */
  let tooltipElement = null;
  /** @type {number|null} ID of the active auto-hide timer */
  let hideTooltipTimeout = null;

  /**
   * Creates the tooltip element on first use and appends it to <body>.
   * Subsequent calls return the cached reference.
   *
   * @returns {HTMLElement} The tooltip element.
   */
  const ensureTooltip = () => {
    if (tooltipElement) {
      return tooltipElement;
    }

    tooltipElement = document.createElement('div');
    tooltipElement.className = 'coming-soon-tooltip';
    tooltipElement.setAttribute('role', 'status');
    tooltipElement.setAttribute('aria-live', 'polite');
    tooltipElement.textContent = 'Coming soon';
    document.body.appendChild(tooltipElement);
    return tooltipElement;
  };

  /**
   * Positions the tooltip above the given anchor element and makes it
   * visible for 1.2 seconds before automatically hiding it.
   *
   * @param {HTMLElement} anchorElement - The link that was clicked.
   */
  const showTooltip = (anchorElement) => {
    const tooltip = ensureTooltip();
    const rect = anchorElement.getBoundingClientRect();
    // Position the tooltip centred above the anchor, accounting for scroll offset
    const top = window.scrollY + rect.top - 10;
    const left = window.scrollX + rect.left + rect.width / 2;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.classList.add('show');

    // Reset any existing auto-hide timer before starting a new one
    if (hideTooltipTimeout) {
      window.clearTimeout(hideTooltipTimeout);
    }

    hideTooltipTimeout = window.setTimeout(() => {
      tooltip.classList.remove('show');
    }, 1200);
  };

  pendingSocialLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showTooltip(link);
    });
  });
}

// ---------------------------------------------------------------------------
// Desktop sidebar enhancements
// ---------------------------------------------------------------------------

/**
 * Normalises desktop sidebar behavior across pages by:
 *  - Pinning the Contact CTA section to the bottom while sidebar content scrolls.
 *  - Showing a subtle "Scroll for more options" hint only when overflow exists.
 */
function initializeSidebarEnhancements() {
  const desktopSidebars = document.querySelectorAll('aside.hidden.lg\\:flex');
  if (!desktopSidebars.length) {
    return;
  }

  const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');

  desktopSidebars.forEach((sidebar) => {
    const contactLink = sidebar.querySelector('a[href="/pages/contact.html"]');
    if (!contactLink) {
      return;
    }

    // Normalize sidebar layout so all pages match the index sidebar structure.
    sidebar.classList.add('sidebar-standard');
    sidebar.classList.remove('p-8', 'justify-between');

    const sidebarSections = Array.from(sidebar.children).filter(
      (child) => child.tagName && child.tagName.toLowerCase() === 'div'
    );

    const ctaContainer = contactLink.closest('div');
    const mainContainer = sidebarSections.find((section) => section !== ctaContainer);
    const scrollContainer = mainContainer || sidebar;

    if (mainContainer && mainContainer.parentElement === sidebar) {
      mainContainer.classList.add('sidebar-main');
    }

    if (ctaContainer && ctaContainer.parentElement === sidebar) {
      ctaContainer.classList.add('sidebar-cta');
    }

    const contactIcon = contactLink.querySelector('i[data-lucide="arrow-right"]');
    if (contactIcon) {
      contactIcon.classList.add('transition-transform');
    }

    let hint = sidebar.querySelector('.sidebar-scroll-hint');
    if (!hint) {
      hint = document.createElement('p');
      hint.className = 'sidebar-scroll-hint';
      hint.innerHTML =
        '<svg aria-hidden="true" focusable="false" class="sidebar-scroll-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
        '<span>Scroll for more</span>';
      if (ctaContainer && ctaContainer.parentElement === sidebar) {
        sidebar.insertBefore(hint, ctaContainer);
      } else {
        sidebar.appendChild(hint);
      }
    }

    const updateHintVisibility = () => {
      const hasOverflow = scrollContainer.scrollHeight > scrollContainer.clientHeight + 8;
      const nearBottom = hasOverflow
        ? scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 12
        : true;
      const shouldShow = desktopMediaQuery.matches && hasOverflow && !nearBottom;
      hint.classList.toggle('is-visible', shouldShow);
    };

    scrollContainer.addEventListener('scroll', updateHintVisibility, { passive: true });
    window.addEventListener('resize', updateHintVisibility);

    if (typeof desktopMediaQuery.addEventListener === 'function') {
      desktopMediaQuery.addEventListener('change', updateHintVisibility);
    } else if (typeof desktopMediaQuery.addListener === 'function') {
      desktopMediaQuery.addListener(updateHintVisibility);
    }

    updateHintVisibility();
  });
}

// ---------------------------------------------------------------------------
// Sticky "Talk to Us" floating CTA button
// ---------------------------------------------------------------------------

/**
 * Injects a fixed-position "Talk to Us" button into the page unless:
 *  - The button already exists (idempotency guard).
 *  - The visitor is already on the Contact page.
 *
 * On the homepage the button is initially hidden and only appears after the
 * user scrolls more than 24 px. On all other pages it is visible immediately.
 *
 * On large screens (≥1024 px) the button lifts itself above the footer when
 * the footer enters the viewport, preventing overlap.
 */
function initializeStickyTalkButton() {
  const talkButton = document.querySelector('.sticky-talk-button');
  if (talkButton) {
    return; // Already initialized
  }

  const path = window.location.pathname.toLowerCase();
  const isContactPage = path.endsWith('/contact.html') || path === '/contact.html';
  if (isContactPage) {
    // No floating CTA needed — the visitor is already on the contact page
    return;
  }

  const isHomePage = path.endsWith('/index.html') || path === '/' || path === '/index.html';

  // Build the button element
  const newTalkButton = document.createElement('a');
  newTalkButton.href = '/pages/contact.html';
  newTalkButton.className = `sticky-talk-button${isHomePage ? ' is-hidden' : ''}`;
  newTalkButton.setAttribute('aria-label', 'Talk to Compass Consult');
  newTalkButton.setAttribute('title', 'Talk to us');
  newTalkButton.innerHTML = [
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"></path>',
    '</svg>',
    '<span>Talk to Us</span>'
  ].join('');

  document.body.appendChild(newTalkButton);

  if (isHomePage) {
    // On the homepage, only reveal the button once the user has scrolled down
    const updateHomeButtonVisibility = () => {
        const hasScrolled = window.scrollY > 24;
        newTalkButton.classList.toggle('is-hidden', !hasScrolled);
    };
    updateHomeButtonVisibility();
    window.addEventListener('scroll', updateHomeButtonVisibility, { passive: true });
  }

  // Logic to lift the button when footer is visible
  const footer = document.querySelector('footer');
  if (footer && window.matchMedia('(min-width: 1024px)').matches) {
    // Use IntersectionObserver to detect when the footer enters the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        newTalkButton.classList.toggle('is-lifted', entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(footer);
  }
}

// ---------------------------------------------------------------------------
// AOS (Animate On Scroll) initialisation
// ---------------------------------------------------------------------------

/**
 * Initialises the AOS library if it has been loaded on the page.
 * AOS animates elements as they scroll into the viewport.
 * Settings used:
 *  - duration 800 ms — smooth but snappy
 *  - once: true — each element animates only the first time it appears
 *  - mirror: false — elements do not re-animate when scrolling back up
 */
function initializeAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
}

// ---------------------------------------------------------------------------
// Lucide icon rendering
// ---------------------------------------------------------------------------

/**
 * Renders all Lucide icon placeholders (<i data-lucide="…">) into inline SVGs.
 * Lucide must be loaded via its CDN script before this function runs.
 * If the library is not present the function exits silently.
 */
function initializeIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// ---------------------------------------------------------------------------
// Dynamic year / date injection
// ---------------------------------------------------------------------------

/**
 * Replaces the content of year and date placeholder elements with the current
 * values at page load time so copyright notices and timestamps stay accurate
 * without manual updates.
 *
 * Targeted elements:
 *  - `.year-span`    — any element that should display the current year
 *  - `#year`         — a single element identified by ID
 *  - `#date`         — a single element identified by ID (only filled if empty)
 */
function initializeYearAndDate() {
  const currentYear = new Date().getFullYear();

  // Fill every element with the .year-span class (e.g. copyright notices)
  document.querySelectorAll('.year-span').forEach((element) => {
    element.textContent = String(currentYear);
  });

  // Fill the #year element if present
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = String(currentYear);
  }

  // Fill the #date element only if it has no existing content
  const dateElement = document.getElementById('date');
  if (dateElement && !dateElement.textContent.trim()) {
    dateElement.textContent = new Date().toLocaleDateString();
  }
}

// ---------------------------------------------------------------------------
// Mobile navigation menu
// ---------------------------------------------------------------------------

/**
 * Wires up the mobile hamburger navigation menu. This function:
 *  1. Finds `#mobile-menu-btn` and `#mobile-menu` in the DOM.
 *  2. Injects a three-bar hamburger icon into the button.
 *  3. Toggles the `menu-open` CSS class to show/hide the menu with animation.
 *  4. Updates ARIA attributes (`aria-expanded`, `aria-controls`) for screen readers.
 *  5. Closes the menu on: link click, Escape key, outside click, and viewport resize.
 *
 * If either the button or the menu element is absent the function exits safely.
 */
function initializeMobileMenu() {
  const menuButton = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');

  if (!menuButton || !menu) {
    return;
  }

  // Ensure the menu has an ID so aria-controls can reference it
  if (!menu.id) {
    menu.id = 'mobile-menu';
  }

  // Ensure the button is a proper <button type="button"> for keyboard users
  if (!menuButton.getAttribute('type')) {
    menuButton.setAttribute('type', 'button');
  }

  if (!menuButton.getAttribute('aria-label')) {
    menuButton.setAttribute('aria-label', 'Toggle mobile menu');
  }

  // Link button to menu via ARIA
  menuButton.setAttribute('aria-controls', menu.id);
  menuButton.setAttribute('aria-expanded', 'false');

  // Ensure the menu is in the DOM flow (CSS handles visibility)
  menu.classList.remove('hidden');
  menu.hidden = false;

  /**
   * Injects the three-bar hamburger icon markup into the button if it does
   * not already contain one. Avoids duplicate icons on re-initialisation.
   */
  const initializeHamburgerIcon = () => {
    if (menuButton.querySelector('.hamburger-icon')) {
      return;
    }

    menuButton.innerHTML = [
      '<span class="hamburger-icon" aria-hidden="true">',
      '<span class="bar"></span>',
      '<span class="bar"></span>',
      '<span class="bar"></span>',
      '</span>'
    ].join('');
  };

  /**
   * Sets the open/closed state of the mobile menu and synchronises all
   * related CSS classes and ARIA attributes.
   *
   * @param {boolean} isOpen - `true` to open the menu, `false` to close it.
   */
  const setMenuState = (isOpen) => {
    menu.classList.toggle('menu-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close mobile menu' : 'Open mobile menu');
    menuButton.classList.toggle('menu-open-state', isOpen);
    // Prevent background scrolling while the overlay menu is visible
    document.body.classList.toggle('menu-open', isOpen);
  };

  initializeHamburgerIcon();
  setMenuState(false);

  /** Toggles the menu between open and closed. */
  const toggleMenu = () => {
    const isCurrentlyOpen = menu.classList.contains('menu-open');
    setMenuState(!isCurrentlyOpen);
  };

  // Open/close on hamburger button click
  menuButton.addEventListener('click', toggleMenu);

  // Close menu when any navigation link inside it is clicked
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  // Close menu on Escape key for keyboard accessibility
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuState(false);
    }
  });

  // Close menu when the user clicks outside of it
  document.addEventListener('click', (event) => {
    if (!menu.classList.contains('menu-open')) {
      return;
    }

    if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
      setMenuState(false);
    }
  });

  // Close menu if the viewport expands to desktop width (≥1024 px)
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      setMenuState(false);
    }
  });
}

// ---------------------------------------------------------------------------
// Scroll-triggered reveal animations
// ---------------------------------------------------------------------------

/**
 * Uses the IntersectionObserver API to add the `active` class to elements
 * with a `.reveal` class once they scroll into view. This triggers the CSS
 * fade/slide-in transition defined in the stylesheet.
 *
 * Accessibility: if the visitor has requested reduced motion
 * (`prefers-reduced-motion: reduce`) all elements are revealed immediately
 * without animation. The same fallback is applied when IntersectionObserver
 * is not available (older browsers).
 */
function initializeRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal');

  if (!revealElements.length) {
    return;
  }

  // Respect the user's motion preference — reveal all immediately
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    revealElements.forEach((element) => element.classList.add('active'));
    return;
  }

  // Fallback for browsers that do not support IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('active'));
    return;
  }

  // Observe each element and activate it when 10% of it enters the viewport
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Stop observing after activation — the animation only plays once
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

// ---------------------------------------------------------------------------
// Team bio "Read More / Read Less" toggle
// ---------------------------------------------------------------------------

/**
 * Enables expandable biographies on the Team page. For each element whose ID
 * ends in `-bio`, the function looks for three related elements:
 *  - `<id>-read-more-btn` — the toggle button
 *  - `<id>-bio-summary`   — the short preview text
 *  - `<id>-bio-full`      — the full biography (hidden by default)
 *
 * Clicking the button toggles visibility between the summary and full text and
 * updates ARIA attributes so screen readers reflect the current state.
 */
function initializeBioReadMore() {
  const bioContainers = document.querySelectorAll('[id$="-bio"]');

  bioContainers.forEach(container => {
    // Derive the person's identifier prefix from the container ID (e.g. "jane" from "jane-bio")
    const name = container.id.replace('-bio', '');
    const readMoreButton = document.getElementById(`${name}-read-more-btn`);
    const fullBio = document.getElementById(`${name}-bio-full`);
    const summaryBio = document.getElementById(`${name}-bio-summary`);

    // Skip if any required element is missing — page may only have partial markup
    if (!readMoreButton || !fullBio || !summaryBio) {
      return;
    }

    // Set initial ARIA state — full bio is hidden on load
    readMoreButton.setAttribute('aria-controls', `${name}-bio-full`);
    const isAlreadyExpanded = fullBio.classList.contains('show');
    readMoreButton.setAttribute('aria-expanded', String(isAlreadyExpanded));
    fullBio.hidden = !isAlreadyExpanded;

    readMoreButton.addEventListener('click', () => {
      const isExpanded = fullBio.classList.toggle('show');
      fullBio.hidden = !isExpanded;
      summaryBio.hidden = isExpanded;
      readMoreButton.textContent = isExpanded ? 'Read Less' : 'Read More';
      readMoreButton.setAttribute('aria-expanded', String(isExpanded));
    });
  });
}

// ---------------------------------------------------------------------------
// External link enhancements
// ---------------------------------------------------------------------------

/**
 * Improves security and accessibility for all external and icon-only links:
 *
 *  1. Adds `rel="noopener noreferrer"` to every `target="_blank"` link to
 *     prevent tab-napping attacks and stop referrer leakage.
 *  2. Assigns `aria-label` and `title` attributes to icon-only external links
 *     that have no visible text, based on the link destination.
 *  3. Fills in `aria-label` and `title` for any icon-only internal link that
 *     has an SVG/icon but no text content.
 */
function enhanceExternalLinks() {
  const externalLinks = document.querySelectorAll('a[target="_blank"]');

  externalLinks.forEach((link) => {
    // Merge new rel values with any existing ones, then write back
    const relValues = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    relValues.add('noopener');
    relValues.add('noreferrer');
    link.setAttribute('rel', Array.from(relValues).join(' '));

    // Add a descriptive label if the link contains no visible text
    if (!link.getAttribute('aria-label') && !link.textContent.trim()) {
      const href = link.getAttribute('href') || '';
      let label = 'External link';

      if (href.startsWith('mailto:')) {
        label = 'Email link';
      } else if (href.includes('linkedin.com')) {
        label = 'LinkedIn profile';
      } else if (href.includes('facebook.com')) {
        label = 'Facebook profile';
      }

      link.setAttribute('aria-label', label);
      link.setAttribute('title', label);
    } else if (!link.getAttribute('title') && link.getAttribute('aria-label')) {
      // Mirror aria-label into title for tooltip consistency
      link.setAttribute('title', link.getAttribute('aria-label'));
    }
  });

  // Also handle icon-only links that are NOT target="_blank"
  const iconOnlyLinks = document.querySelectorAll('a');
  iconOnlyLinks.forEach((link) => {
    if (link.getAttribute('aria-label')) {
      // Ensure title mirrors aria-label for tooltip consistency
      if (!link.getAttribute('title')) {
        link.setAttribute('title', link.getAttribute('aria-label'));
      }
      return;
    }

    const hasVisibleText = link.textContent.trim().length > 0;
    const hasIcon = Boolean(link.querySelector('i, svg'));
    if (hasVisibleText || !hasIcon) {
      return;
    }

    // Derive a label from the href destination
    const href = link.getAttribute('href') || '';
    let label = 'Link';

    if (href.includes('linkedin.com')) {
      label = 'LinkedIn';
    } else if (href.includes('facebook.com')) {
      label = 'Facebook';
    } else if (href.includes('x.com') || href.includes('twitter.com')) {
      label = 'X profile';
    } else if (href.startsWith('mailto:')) {
      label = 'Email';
    } else if (href === '#') {
      label = 'Social profile';
    }

    link.setAttribute('aria-label', label);
    link.setAttribute('title', label);
  });
}

// ---------------------------------------------------------------------------
// Form label–field association
// ---------------------------------------------------------------------------

/**
 * Programmatically links `<label>` elements to their sibling form controls
 * when an explicit `for` attribute is absent. This ensures screen readers
 * can announce the field's purpose even for forms that omit `for`/`id` pairs.
 *
 * For each unlinked label the function:
 *  1. Looks for the nearest sibling `<input>`, `<select>`, or `<textarea>`.
 *  2. Generates a unique `id` for the field if it lacks one.
 *  3. Sets the label's `for` attribute and the field's `aria-label` / `title`.
 */
function connectFormLabels() {
  const forms = document.querySelectorAll('form');

  forms.forEach((form, formIndex) => {
    const labels = form.querySelectorAll('label');

    labels.forEach((label, labelIndex) => {
      // Skip labels that already have an explicit association
      if (label.getAttribute('for')) {
        return;
      }

      // Find the first form control that is a sibling of the label
      const field = label.parentElement
        ? label.parentElement.querySelector('input, select, textarea')
        : null;

      if (!field) {
        return;
      }

      // Generate a unique ID for the field if it does not already have one
      if (!field.id) {
        field.id = `form-${formIndex}-field-${labelIndex}`;
      }

      label.setAttribute('for', field.id);

      if (!field.getAttribute('aria-label')) {
        field.setAttribute('aria-label', label.textContent.trim());
      }

      if (!field.getAttribute('title')) {
        field.setAttribute('title', label.textContent.trim());
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Image performance optimisation
// ---------------------------------------------------------------------------

/**
 * Applies browser-level image loading optimisations to all `<img>` elements:
 *  - `decoding="async"` — allows the browser to decode images off the main
 *    thread, improving perceived performance.
 *  - `loading="lazy"`   — defers loading of images that are below the fold
 *    (only applied to images beyond the first three to avoid lazy-loading
 *    above-the-fold hero images).
 *
 * Only attributes that are not already set are modified.
 */
function optimizeImages() {
  const images = document.querySelectorAll('img');

  images.forEach((image, index) => {
    if (!image.hasAttribute('decoding')) {
      image.setAttribute('decoding', 'async');
    }

    // Skip the first three images — they are likely above the fold
    if (!image.hasAttribute('loading') && index > 2) {
      image.setAttribute('loading', 'lazy');
    }
  });
}

// ---------------------------------------------------------------------------
// Client ticker image fallback
// ---------------------------------------------------------------------------

/**
 * Provides a fallback for broken client/partner logo images inside the
 * scrolling ticker strip (`.ticker-track`). If a logo image fails to load,
 * it is replaced with the Compass Consult site logo so the ticker always
 * appears complete.
 */
function initializeTickerImageFallback() {
  document.querySelectorAll('.ticker-track img').forEach((image) => {
    image.addEventListener('error', () => {
      image.src = '/assets/logos/Logo.png';
      image.style.maxHeight = '100px';
    });
  });
}

// ---------------------------------------------------------------------------
// Utility helpers — exposed on window.CompassConsult
// ---------------------------------------------------------------------------

/**
 * Smoothly scrolls the page to the first element matching the given CSS
 * selector. Does nothing if no matching element exists.
 *
 * @param {string} selector - A valid CSS selector string (e.g. `"#contact"`).
 */
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Returns a debounced version of the given function. The returned function
 * will only invoke `func` after `wait` milliseconds have elapsed since the
 * last time it was called, preventing rapid repeated calls (e.g. on scroll
 * or resize events).
 *
 * @param {Function} func - The function to debounce.
 * @param {number}   wait - Delay in milliseconds.
 * @returns {Function} A debounced wrapper around `func`.
 */
function debounce(func, wait) {
  let timeout;

  return function debouncedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Returns `true` if the element is fully visible within the current viewport,
 * `false` otherwise. Useful for conditional logic that depends on whether an
 * element is on-screen.
 *
 * @param {Element} element - The DOM element to check.
 * @returns {boolean} Whether the element is entirely within the viewport.
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ---------------------------------------------------------------------------
// Sidebar scroll indicator
// ---------------------------------------------------------------------------

/**
 * Shows a fade-gradient and chevron indicator at the bottom of the desktop
 * sidebar scroll area when there is more content below the visible fold.
 * The indicator fades out once the user has scrolled to the bottom.
 */
function initializeSidebarScrollIndicator() {
  const scrollArea = document.getElementById('sidebar-scroll-area');
  const indicator = document.getElementById('sidebar-scroll-indicator');

  if (!scrollArea || !indicator) return;

  /**
   * Updates indicator visibility based on whether the scroll area has
   * remaining content below the current scroll position.
   */
  const updateIndicator = () => {
    const atBottom =
      scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 4;
    indicator.style.opacity = atBottom ? '0' : '1';
  };

  // Run once on load, then on every scroll event within the sidebar.
  updateIndicator();
  scrollArea.addEventListener('scroll', updateIndicator, { passive: true });
}

// ---------------------------------------------------------------------------
// Newsletter subscription form
// ---------------------------------------------------------------------------

/**
 * Intercepts the newsletter subscription form and submits the email address
 * to the /api/subscribers endpoint backed by Netlify Blobs, providing inline
 * feedback to the user.
 */
function initializeNewsletterForm() {
  const form = document.querySelector('form[name="newsletter-subscribe"]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = form.querySelector('input[name="email"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = emailInput.value.trim();

    if (!email) return;

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Subscribing...';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        submitBtn.textContent = 'Subscribed!';
        submitBtn.classList.remove('bg-compass-teal', 'hover:bg-compass-lightTeal');
        submitBtn.classList.add('bg-green-600');
        emailInput.value = '';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.classList.remove('bg-green-600');
          submitBtn.classList.add('bg-compass-teal', 'hover:bg-compass-lightTeal');
          submitBtn.disabled = false;
        }, 3000);
      } else {
        submitBtn.textContent = data.error || 'Error';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 3000);
      }
    } catch {
      submitBtn.textContent = 'Error — try again';
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 3000);
    }
  });
}

// ---------------------------------------------------------------------------
// Public API — attach helpers to a global namespace for optional page use
// ---------------------------------------------------------------------------

/**
 * Public API surface for the site. Functions exposed here can be called by
 * individual page scripts or the browser console during development.
 *
 * @namespace window.CompassConsult
 */
window.CompassConsult = {
  scrollToElement,
  debounce,
  isInViewport,
  initializeMobileMenu,
  initializeRevealAnimations
};
