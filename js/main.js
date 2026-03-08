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
  initializeStickyTalkButton();
  initializeRevealAnimations();
  initializeBioReadMore();
  enhanceExternalLinks();
  initializeComingSoonSocialLinks();
  connectFormLabels();
  optimizeImages();
  initializeTickerImageFallback();
  initializeAOS();
});

function initializeComingSoonSocialLinks() {
  const pendingSocialLinks = document.querySelectorAll('a[href="#"][aria-label="Social profile"]');
  let tooltipElement = null;
  let hideTooltipTimeout = null;

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

  const showTooltip = (anchorElement) => {
    const tooltip = ensureTooltip();
    const rect = anchorElement.getBoundingClientRect();
    const top = window.scrollY + rect.top - 10;
    const left = window.scrollX + rect.left + rect.width / 2;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.classList.add('show');

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

function initializeStickyTalkButton() {
  const talkButton = document.querySelector('.sticky-talk-button');
  if (talkButton) {
    return; // Already initialized
  }

  const path = window.location.pathname.toLowerCase();
  const isContactPage = path.endsWith('/contact.html') || path === '/contact.html';
  if (isContactPage) {
    return;
  }

  const isHomePage = path.endsWith('/index.html') || path === '/' || path === '/index.html';

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
    const observer = new IntersectionObserver(
      ([entry]) => {
        newTalkButton.classList.toggle('is-lifted', entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(footer);
  }
}

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

  menu.classList.remove('hidden');
  menu.hidden = false;

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

  const setMenuState = (isOpen) => {
    menu.classList.toggle('menu-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close mobile menu' : 'Open mobile menu');
    menuButton.classList.toggle('menu-open-state', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  };

  initializeHamburgerIcon();
  setMenuState(false);

  const toggleMenu = () => {
    const isCurrentlyOpen = menu.classList.contains('menu-open');
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
    if (!menu.classList.contains('menu-open')) {
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
  const bioContainers = document.querySelectorAll('[id$="-bio"]');

  bioContainers.forEach(container => {
    const name = container.id.replace('-bio', '');
    const readMoreButton = document.getElementById(`${name}-read-more-btn`);
    const fullBio = document.getElementById(`${name}-bio-full`);
    const summaryBio = document.getElementById(`${name}-bio-summary`);

    if (!readMoreButton || !fullBio || !summaryBio) {
      return;
    }

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
      link.setAttribute('title', label);
    } else if (!link.getAttribute('title') && link.getAttribute('aria-label')) {
      link.setAttribute('title', link.getAttribute('aria-label'));
    }
  });

  const iconOnlyLinks = document.querySelectorAll('a');
  iconOnlyLinks.forEach((link) => {
    if (link.getAttribute('aria-label')) {
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

      if (!field.getAttribute('aria-label')) {
        field.setAttribute('aria-label', label.textContent.trim());
      }

      if (!field.getAttribute('title')) {
        field.setAttribute('title', label.textContent.trim());
      }
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
      image.src = '/assets/logos/Logo.png';
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
