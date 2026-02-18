/**
 * Main JavaScript File
 * Compass Consult Website
 * 
 * Currently all logic is inline in index.html
 * This file is prepared for future extraction of JavaScript functionality
 */

// =====================
// Initialization
// =====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Compass Consult Website loaded');
  
  // Initialize features
  // initializeNavigation();
  // initializeAnimations();
  // initializeCounters();
  // initializeScrollEffects();
});

// =====================
// Navigation Functions
// =====================

/**
 * Initialize mobile menu toggle
 */
function initializeNavigation() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
}

// =====================
// Animation Functions
// =====================

/**
 * Initialize scroll animations
 */
function initializeAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

// =====================
// Counter Animation Functions
// =====================

/**
 * Animate number counters
 */
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  
  window.requestAnimationFrame(step);
}

/**
 * Initialize stat counters
 */
function initializeCounters() {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'));
        animateValue(entry.target, 0, target, 2000);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(counter => {
    counterObserver.observe(counter);
  });
}

// =====================
// Scroll Effects
// =====================

/**
 * Add scroll effect to navbar
 */
function initializeScrollEffects() {
  const navbar = document.getElementById('navbar');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('shadow-md');
    } else {
      navbar.classList.remove('shadow-md');
    }
  });
}

// =====================
// Utility Functions
// =====================

/**
 * Smooth scroll to element
 */
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if element is in viewport
 */
function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// =====================
// Export for use
// =====================

// If using modules:
// export { animateValue, scrollToElement, debounce, isInViewport };

// Or use as global functions (current setup)
window.CompassConsult = {
  animateValue,
  scrollToElement,
  debounce,
  isInViewport,
  initializeNavigation,
  initializeAnimations,
  initializeCounters,
  initializeScrollEffects
};
