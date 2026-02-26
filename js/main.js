/**
 * Main JavaScript File
 * Compass Consult Website
 *
 * Shared behavior used across all static pages.
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeIcons();
  initializeYearAndDate();
  initializeMobileMenu();
  initializeRevealAnimations();
  initializeBioReadMore();
  enhanceExternalLinks();
  connectFormLabels();
  optimizeImages();
  initializeTickerImageFallback();
});

function initializeIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function initializeYearAndDate() {
  const currentYear = new Date().getFullYear();

  document.querySelectorAll('.year-span').forEach((element) => {
    element.textContent = String(currentYear);
  });

  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = String(currentYear);
  }

  const dateElement = document.getElementById('date');
  if (dateElement && !dateElement.textContent.trim()) {
    dateElement.textContent = new Date().toLocaleDateString();
  }
}

function initializeMobileMenu() {
  const menuButton = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');

  if (!menuButton || !menu) {
    return;
  }

  if (!menu.id) {
    menu.id = 'mobile-menu';
  }

  if (!menuButton.getAttribute('type')) {
    menuButton.setAttribute('type', 'button');
  }

  if (!menuButton.getAttribute('aria-label')) {
    menuButton.setAttribute('aria-label', 'Toggle mobile menu');
  }

  menuButton.setAttribute('aria-controls', menu.id);
  menuButton.setAttribute('aria-expanded', 'false');
  menu.hidden = menu.classList.contains('hidden');

  const setMenuState = (isOpen) => {
    menu.classList.toggle('hidden', !isOpen);
    menu.hidden = !isOpen;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  };

  const toggleMenu = () => {
    const isCurrentlyOpen = !menu.classList.contains('hidden');
    setMenuState(!isCurrentlyOpen);
  };

  menuButton.addEventListener('click', toggleMenu);

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuState(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (menu.classList.contains('hidden')) {
      return;
    }

    if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
      setMenuState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      setMenuState(false);
    }
  });
}

function initializeRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal');

  if (!revealElements.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    revealElements.forEach((element) => element.classList.add('active'));
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('active'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

function initializeBioReadMore() {
  const readMoreButton = document.getElementById('jon-read-more-btn');
  const fullBio = document.getElementById('jon-bio-full');
  const summaryBio = document.getElementById('jon-bio-summary');

  if (!readMoreButton || !fullBio || !summaryBio) {
    return;
  }

  readMoreButton.setAttribute('aria-controls', 'jon-bio-full');
  readMoreButton.setAttribute('aria-expanded', String(fullBio.classList.contains('show')));
  fullBio.hidden = !fullBio.classList.contains('show');

  readMoreButton.addEventListener('click', () => {
    const isExpanded = fullBio.classList.toggle('show');
    fullBio.hidden = !isExpanded;
    summaryBio.hidden = isExpanded;
    readMoreButton.textContent = isExpanded ? 'Read Less' : 'Read More';
    readMoreButton.setAttribute('aria-expanded', String(isExpanded));
  });
}

function enhanceExternalLinks() {
  const externalLinks = document.querySelectorAll('a[target="_blank"]');

  externalLinks.forEach((link) => {
    const relValues = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    relValues.add('noopener');
    relValues.add('noreferrer');
    link.setAttribute('rel', Array.from(relValues).join(' '));

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
    }
  });
}

function connectFormLabels() {
  const forms = document.querySelectorAll('form');

  forms.forEach((form, formIndex) => {
    const labels = form.querySelectorAll('label');

    labels.forEach((label, labelIndex) => {
      if (label.getAttribute('for')) {
        return;
      }

      const field = label.parentElement
        ? label.parentElement.querySelector('input, select, textarea')
        : null;

      if (!field) {
        return;
      }

      if (!field.id) {
        field.id = `form-${formIndex}-field-${labelIndex}`;
      }

      label.setAttribute('for', field.id);
    });
  });
}

function optimizeImages() {
  const images = document.querySelectorAll('img');

  images.forEach((image, index) => {
    if (!image.hasAttribute('decoding')) {
      image.setAttribute('decoding', 'async');
    }

    if (!image.hasAttribute('loading') && index > 2) {
      image.setAttribute('loading', 'lazy');
    }
  });
}

function initializeTickerImageFallback() {
  document.querySelectorAll('.ticker-track img').forEach((image) => {
    image.addEventListener('error', () => {
      image.src = 'assets/logos/Logo.png';
      image.style.maxHeight = '100px';
    });
  });
}

function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

function debounce(func, wait) {
  let timeout;

  return function debouncedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

window.CompassConsult = {
  scrollToElement,
  debounce,
  isInViewport,
  initializeMobileMenu,
  initializeRevealAnimations
};
