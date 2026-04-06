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
  initializeCookieConsent();     // Ask for consent, persist preferences, and apply cookie-driven UX
  initializeButtonIcons();      // Add icons to text-based buttons before Lucide renders
  initializeIcons();            // Render Lucide SVG icons
  initializeYearAndDate();      // Inject current year / date into placeholders
  initializeMobileMenu();       // Wire up the hamburger navigation
  initializeAOSAnimations();    // Initialize AOS when available on pages that use it
  initializeSidebarEnhancements(); // Keep sidebar CTA pinned + show overflow hint
  initializeStickyTalkButton(); // Create the floating "Talk to Us" CTA
  initializeRevealAnimations(); // Scroll-triggered reveal animations
  initializeBioReadMore();      // Expandable "Read More" bio sections
  initializeInteractiveMotion(); // Add tactile animation to interactive controls
  initializeStaggeredCardReveal(); // Stagger section cards as they enter view
  enhanceExternalLinks();       // Add noopener/noreferrer + aria-labels
  initializeComingSoonSocialLinks(); // "Coming soon" tooltip for pending social links
  connectFormLabels();          // Associate <label> elements with their <input> partners
  optimizeImages();             // Add async decoding and lazy-loading attributes
  initializeTickerImageFallback(); // Replace broken ticker logos with the site logo
  initializeSidebarScrollIndicator(); // Show/hide sidebar scroll hint
  initializeNewsletterForm();        // Newsletter subscription via Netlify Forms
  initializeContactForm();           // Contact enquiry form via Netlify Forms
  registerServiceWorker();           // Enable installability/offline shell support
});

// ---------------------------------------------------------------------------
// Cookie consent and preferences
// ---------------------------------------------------------------------------

const COOKIE_CONSENT_NAME = 'compass_cookie_preferences';
const COOKIE_NEWSLETTER_NAME = 'compass_newsletter_subscribed';
const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;
const COOKIE_NEWSLETTER_MAX_AGE = 60 * 60 * 24 * 180;

/**
 * Creates the cookie consent banner, preference panel, and site-wide settings
 * trigger. Preferences are stored in first-party cookies so all static pages
 * can honour the same decision.
 */
function initializeCookieConsent() {
  ensureCookieConsentStyles();
  const ui = createCookieConsentUi();
  if (!ui) {
    return;
  }

  const isCookiePolicyPage = canonicalizePath(window.location.pathname) === '/pages/cookies.html';
  let currentConsent = readStoredCookieConsent();

  const syncForm = (consent) => {
    const normalizedConsent = normalizeCookieConsent(consent);
    ui.form.elements.functional.checked = normalizedConsent.functional;
    ui.form.elements.analytics.checked = normalizedConsent.analytics;
    ui.form.elements.marketing.checked = normalizedConsent.marketing;
  };

  const closePanel = () => {
    ui.overlay.hidden = true;
    document.body.classList.remove('cc-cookie-lock');
  };

  const openPanel = () => {
    syncForm(currentConsent || buildCookieConsent());
    ui.overlay.hidden = false;
    document.body.classList.add('cc-cookie-lock');
    window.setTimeout(() => {
      ui.form.elements.functional.focus();
    }, 0);
  };

  const commitConsent = (nextConsent) => {
    currentConsent = saveCookieConsent(nextConsent);
    syncForm(currentConsent);
    ui.banner.hidden = true;
    ui.trigger.hidden = !isCookiePolicyPage;
    closePanel();
    applyCookieConsent(currentConsent, true);
  };

  const getPanelConsent = () => {
    const formData = new FormData(ui.form);
    return buildCookieConsent({
      functional: formData.get('functional') === 'on',
      analytics: formData.get('analytics') === 'on',
      marketing: formData.get('marketing') === 'on'
    });
  };

  ui.bannerManageButton.addEventListener('click', openPanel);
  ui.trigger.addEventListener('click', openPanel);
  ui.overlay.addEventListener('click', (event) => {
    if (event.target === ui.overlay || event.target.hasAttribute('data-cc-close')) {
      closePanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !ui.overlay.hidden) {
      closePanel();
    }
  });

  ui.acceptButtons.forEach((button) => {
    button.addEventListener('click', () => {
      commitConsent({ functional: true, analytics: true, marketing: true });
    });
  });

  ui.rejectButtons.forEach((button) => {
    button.addEventListener('click', () => {
      commitConsent({ functional: false, analytics: false, marketing: false });
    });
  });

  ui.saveButton.addEventListener('click', () => {
    commitConsent(getPanelConsent());
  });

  bindCookiePreferenceTriggers(openPanel);
  syncForm(currentConsent || buildCookieConsent());
  ui.banner.hidden = Boolean(currentConsent);
  ui.trigger.hidden = !currentConsent || !isCookiePolicyPage;
  applyCookieConsent(currentConsent || buildCookieConsent());

  window.CompassConsultCookieConsent = {
    getPreferences: () => readStoredCookieConsent() || buildCookieConsent(),
    hasConsent: hasCookieConsent,
    openPreferences: openPanel,
    savePreferences: (nextConsent) => commitConsent(nextConsent)
  };
}

/**
 * Injects the styles for the cookie consent UI once per page.
 */
function ensureCookieConsentStyles() {
  if (document.getElementById('cc-cookie-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'cc-cookie-styles';
  style.textContent = `
    .cc-cookie-lock { overflow: hidden; }
    .cc-cookie-banner,
    .cc-cookie-trigger,
    .cc-cookie-overlay {
      font-family: inherit;
    }
    .cc-cookie-banner {
      position: fixed;
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
      width: auto;
      z-index: 90;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.8rem 1rem;
      border-radius: 1rem;
      background: rgba(17, 24, 39, 0.92);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 12px 34px rgba(15, 23, 42, 0.24);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      overflow: hidden;
      animation: cc-cookie-banner-enter 520ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cc-cookie-banner::before {
      content: '';
      position: absolute;
      inset: -1px;
      background: linear-gradient(115deg, rgba(103, 232, 249, 0) 15%, rgba(103, 232, 249, 0.16) 42%, rgba(255, 255, 255, 0.08) 50%, rgba(103, 232, 249, 0) 72%);
      transform: translateX(-32%);
      animation: cc-cookie-banner-sheen 7s ease-in-out infinite;
      pointer-events: none;
    }
    .cc-cookie-banner > * {
      position: relative;
      z-index: 1;
    }
    .cc-cookie-banner-copy {
      min-width: 0;
      flex: 1 1 auto;
    }
    .cc-cookie-banner[hidden],
    .cc-cookie-trigger[hidden],
    .cc-cookie-overlay[hidden] {
      display: none;
    }
    .cc-cookie-eyebrow {
      display: inline-block;
      margin: 0 0 0.5rem;
      color: #7dd3fc;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .cc-cookie-title {
      margin: 0;
      color: #ffffff;
      font-size: 1.1rem;
      line-height: 1.2;
    }
    .cc-cookie-text {
      margin: 0;
      color: rgba(255, 255, 255, 0.82);
      font-size: 0.92rem;
      line-height: 1.45;
    }
    .cc-cookie-inline-title {
      color: #ffffff;
      font-weight: 700;
    }
    .cc-cookie-link {
      color: #67e8f9;
      text-decoration: underline;
      text-underline-offset: 0.18rem;
    }
    .cc-cookie-actions,
    .cc-cookie-panel-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
    .cc-cookie-actions {
      flex: 0 0 auto;
      justify-content: flex-end;
    }
    .cc-cookie-button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 0.68rem 0.95rem;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, color 180ms ease;
    }
    .cc-cookie-button:hover,
    .cc-cookie-button:focus-visible {
      transform: translateY(-1px);
      outline: none;
    }
    .cc-cookie-button-primary {
      background: linear-gradient(135deg, #2da8b4 0%, #483086 100%);
      color: #ffffff;
      box-shadow: 0 18px 32px rgba(45, 168, 180, 0.24);
    }
    .cc-cookie-button-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    .cc-cookie-button-ghost {
      background: transparent;
      color: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.16);
    }
    .cc-cookie-trigger {
      position: fixed;
      top: 6rem;
      right: 1rem;
      z-index: 80;
      padding: 0.65rem 0.95rem;
      border: 0;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.94);
      color: #111827;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
      font: inherit;
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      animation: cc-cookie-trigger-enter 420ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cc-cookie-overlay {
      position: fixed;
      inset: 0;
      z-index: 95;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.45);
      animation: cc-cookie-overlay-fade 220ms ease-out;
    }
    .cc-cookie-panel {
      width: min(100%, 42rem);
      max-height: calc(100vh - 2rem);
      overflow: auto;
      background: #ffffff;
      color: #111827;
      border-radius: 1.5rem;
      padding: 1.5rem;
      box-shadow: 0 30px 90px rgba(15, 23, 42, 0.3);
      animation: cc-cookie-panel-enter 280ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cc-cookie-panel-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .cc-cookie-panel-title {
      margin: 0;
      color: #111827;
      font-size: 1.5rem;
      line-height: 1.2;
    }
    .cc-cookie-panel-text {
      margin: 0.75rem 0 0;
      color: #4b5563;
      line-height: 1.65;
    }
    .cc-cookie-close {
      appearance: none;
      border: 0;
      background: transparent;
      color: #6b7280;
      font-size: 1.75rem;
      line-height: 1;
      cursor: pointer;
    }
    .cc-cookie-options {
      display: grid;
      gap: 0.85rem;
      margin: 1.25rem 0 1.5rem;
    }
    .cc-cookie-option {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.9rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      background: #f8fafc;
      align-items: start;
    }
    .cc-cookie-option input {
      margin-top: 0.3rem;
      width: 1.1rem;
      height: 1.1rem;
      accent-color: #483086;
    }
    .cc-cookie-option strong {
      display: block;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .cc-cookie-option p {
      margin: 0;
      color: #4b5563;
      line-height: 1.55;
    }
    .cc-cookie-option small {
      display: inline-block;
      margin-top: 0.35rem;
      color: #6b7280;
    }
    @keyframes cc-cookie-banner-enter {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes cc-cookie-trigger-enter {
      from {
        opacity: 0;
        transform: translateY(-12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes cc-cookie-overlay-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes cc-cookie-panel-enter {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes cc-cookie-banner-sheen {
      0%, 100% {
        transform: translateX(-35%);
        opacity: 0;
      }
      12%, 58% {
        opacity: 1;
      }
      48% {
        transform: translateX(35%);
        opacity: 0.85;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .cc-cookie-banner,
      .cc-cookie-banner::before,
      .cc-cookie-trigger,
      .cc-cookie-overlay,
      .cc-cookie-panel {
        animation: none;
      }
      .cc-cookie-button {
        transition: none;
      }
    }
    @media (max-width: 960px) {
      .cc-cookie-banner {
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .cc-cookie-actions {
        justify-content: flex-start;
      }
    }
    @media (max-width: 640px) {
      .cc-cookie-banner {
        left: 0.75rem;
        right: 0.75rem;
        bottom: 0.75rem;
        width: auto;
        padding: 0.7rem 0.8rem;
        gap: 0.65rem;
      }
      .cc-cookie-text {
        font-size: 0.8rem;
      }
      .cc-cookie-actions {
        width: 100%;
        gap: 0.45rem;
        justify-content: flex-start;
      }
      .cc-cookie-trigger {
        top: 5.75rem;
        right: 0.75rem;
      }
      .cc-cookie-panel {
        padding: 1.1rem;
      }
      .cc-cookie-button {
        width: auto;
        min-height: 2.4rem;
        padding: 0.6rem 0.8rem;
        justify-content: center;
      }
    }
  `;

  document.head.appendChild(style);
}

/**
 * Creates the banner, modal panel, and persistent settings trigger.
 *
 * @returns {{banner: HTMLElement, bannerManageButton: HTMLButtonElement, trigger: HTMLButtonElement, overlay: HTMLElement, form: HTMLFormElement, saveButton: HTMLButtonElement, acceptButtons: HTMLButtonElement[], rejectButtons: HTMLButtonElement[]}|null}
 */
function createCookieConsentUi() {
  const existingBanner = document.getElementById('cc-cookie-banner');
  if (existingBanner) {
    return {
      banner: existingBanner,
      bannerManageButton: document.getElementById('cc-cookie-banner-manage'),
      trigger: document.getElementById('cc-cookie-trigger'),
      overlay: document.getElementById('cc-cookie-overlay'),
      form: document.getElementById('cc-cookie-form'),
      saveButton: document.getElementById('cc-cookie-save'),
      acceptButtons: Array.from(document.querySelectorAll('[data-cc-accept]')),
      rejectButtons: Array.from(document.querySelectorAll('[data-cc-reject]'))
    };
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = [
    '<section id="cc-cookie-banner" class="cc-cookie-banner" aria-label="Cookie notice">',
    '  <div class="cc-cookie-banner-copy">',
    '    <p class="cc-cookie-text"><span class="cc-cookie-inline-title">Cookies:</span> we use one essential cookie to remember your choice. Optional cookies only run if you opt in. <a href="/pages/cookies.html" class="cc-cookie-link">Cookie Policy</a>.</p>',
    '  </div>',
    '  <div class="cc-cookie-actions">',
    '    <button type="button" id="cc-cookie-banner-manage" class="cc-cookie-button cc-cookie-button-ghost">Customise</button>',
    '    <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-secondary">Reject optional</button>',
    '    <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',
    '  </div>',
    '</section>',
    '<button type="button" id="cc-cookie-trigger" class="cc-cookie-trigger">Cookie settings</button>',
    '<div id="cc-cookie-overlay" class="cc-cookie-overlay" hidden>',
    '  <div class="cc-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cc-cookie-panel-title">',
    '    <div class="cc-cookie-panel-header">',
    '      <div>',
    '        <span class="cc-cookie-eyebrow" style="color:#483086;">Cookie settings</span>',
    '        <h2 id="cc-cookie-panel-title" class="cc-cookie-panel-title">Choose which cookies to allow</h2>',
    '        <p class="cc-cookie-panel-text">Essential cookies stay on so the website can function and remember this choice. Everything else is optional.</p>',
    '      </div>',
    '      <button type="button" class="cc-cookie-close" aria-label="Close cookie settings" data-cc-close>&times;</button>',
    '    </div>',
    '    <form id="cc-cookie-form">',
    '      <div class="cc-cookie-options">',
    '        <label class="cc-cookie-option">',
    '          <input type="checkbox" checked disabled>',
    '          <span>',
    '            <strong>Strictly necessary</strong>',
    '            <p>Stores your consent choice and supports essential site functions such as forms and security controls.</p>',
    '            <small>Always active</small>',
    '          </span>',
    '        </label>',
    '        <label class="cc-cookie-option">',
    '          <input type="checkbox" name="functional">',
    '          <span>',
    '            <strong>Functional</strong>',
    '            <p>Remembers whether you have already subscribed to the newsletter so we can show a thank-you message instead of the sign-up form.</p>',
    '            <small>Optional</small>',
    '          </span>',
    '        </label>',
    '        <label class="cc-cookie-option">',
    '          <input type="checkbox" name="analytics">',
    '          <span>',
    '            <strong>Analytics</strong>',
    '            <p>Allows future measurement scripts or deferred analytics embeds to load only after you opt in.</p>',
    '            <small>Optional</small>',
    '          </span>',
    '        </label>',
    '        <label class="cc-cookie-option">',
    '          <input type="checkbox" name="marketing">',
    '          <span>',
    '            <strong>Marketing</strong>',
    '            <p>Allows future campaign or third-party marketing content to load only after you opt in.</p>',
    '            <small>Optional</small>',
    '          </span>',
    '        </label>',
    '      </div>',
    '    </form>',
    '    <div class="cc-cookie-panel-actions">',
    '      <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-ghost">Reject optional</button>',
    '      <button type="button" id="cc-cookie-save" class="cc-cookie-button cc-cookie-button-secondary" style="background:#111827;color:#ffffff;">Save preferences</button>',
    '      <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  document.body.appendChild(wrapper);

  return {
    banner: document.getElementById('cc-cookie-banner'),
    bannerManageButton: document.getElementById('cc-cookie-banner-manage'),
    trigger: document.getElementById('cc-cookie-trigger'),
    overlay: document.getElementById('cc-cookie-overlay'),
    form: document.getElementById('cc-cookie-form'),
    saveButton: document.getElementById('cc-cookie-save'),
    acceptButtons: Array.from(document.querySelectorAll('[data-cc-accept]')),
    rejectButtons: Array.from(document.querySelectorAll('[data-cc-reject]'))
  };
}

/**
 * Applies the active consent state to the page.
 *
 * @param {Record<string, boolean|string>} consent
 * @param {boolean} shouldBroadcast
 */
function applyCookieConsent(consent, shouldBroadcast = false) {
  const normalizedConsent = normalizeCookieConsent(consent);
  document.documentElement.dataset.cookieFunctional = String(normalizedConsent.functional);
  document.documentElement.dataset.cookieAnalytics = String(normalizedConsent.analytics);
  document.documentElement.dataset.cookieMarketing = String(normalizedConsent.marketing);

  activateDeferredCookieAssets(normalizedConsent);
  deleteCookie('compass_last_page');

  if (shouldBroadcast) {
    document.dispatchEvent(
      new CustomEvent('compass:cookie-consent-updated', { detail: normalizedConsent })
    );
  }
}

/**
 * Converts future optional scripts and embeds into live elements once the
 * relevant consent category has been granted.
 *
 * Supported markup:
 *  - <script type="text/plain" data-cookie-category="analytics" data-cookie-src="..."></script>
 *  - <iframe data-cookie-category="marketing" data-cookie-src="..."></iframe>
 *
 * @param {{functional: boolean, analytics: boolean, marketing: boolean}} consent
 */
function activateDeferredCookieAssets(consent) {
  document.querySelectorAll('[data-cookie-category]').forEach((element) => {
    const category = element.getAttribute('data-cookie-category');
    const isAllowed = category === 'essential' || Boolean(consent[category]);

    if (element.tagName === 'SCRIPT') {
      const script = /** @type {HTMLScriptElement} */ (element);
      if (!isAllowed || script.dataset.cookieActivated === 'true' || script.type !== 'text/plain') {
        return;
      }

      const liveScript = document.createElement('script');
      Array.from(script.attributes).forEach((attribute) => {
        if (attribute.name === 'type' || attribute.name.startsWith('data-cookie-')) {
          return;
        }

        liveScript.setAttribute(attribute.name, attribute.value);
      });

      if (script.dataset.cookieSrc) {
        liveScript.src = script.dataset.cookieSrc;
      } else {
        liveScript.textContent = script.textContent;
      }

      script.dataset.cookieActivated = 'true';
      script.parentNode.insertBefore(liveScript, script.nextSibling);
      return;
    }

    if (element.tagName === 'IFRAME' && isAllowed) {
      const frame = /** @type {HTMLIFrameElement} */ (element);
      if (frame.dataset.cookieSrc && frame.getAttribute('src') !== frame.dataset.cookieSrc) {
        frame.setAttribute('src', frame.dataset.cookieSrc);
      }
    }
  });
}

/**
 * Binds any in-page preference triggers to the cookie settings dialog.
 *
 * @param {Function} openPanel
 */
function bindCookiePreferenceTriggers(openPanel) {
  document.querySelectorAll('[data-cookie-preferences]').forEach((trigger) => {
    if (trigger.dataset.cookiePreferencesBound === 'true') {
      return;
    }

    trigger.dataset.cookiePreferencesBound = 'true';
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openPanel();
    });
  });
}

/**
 * Reads and normalizes the stored cookie consent record.
 *
 * @returns {{essential: boolean, functional: boolean, analytics: boolean, marketing: boolean, updatedAt: string}|null}
 */
function readStoredCookieConsent() {
  const value = readCookie(COOKIE_CONSENT_NAME);
  if (!value) {
    return null;
  }

  try {
    return normalizeCookieConsent(JSON.parse(value));
  } catch {
    return null;
  }
}

/**
 * Persists the consent object in a first-party cookie.
 *
 * @param {Record<string, boolean|string>} consent
 * @returns {{essential: boolean, functional: boolean, analytics: boolean, marketing: boolean, updatedAt: string}}
 */
function saveCookieConsent(consent) {
  const normalizedConsent = normalizeCookieConsent(consent);
  writeCookie(COOKIE_CONSENT_NAME, JSON.stringify(normalizedConsent), {
    maxAge: COOKIE_CONSENT_MAX_AGE
  });
  return normalizedConsent;
}

/**
 * Returns whether the visitor has granted consent for the given category.
 *
 * @param {'essential'|'functional'|'analytics'|'marketing'} category
 * @returns {boolean}
 */
function hasCookieConsent(category) {
  if (category === 'essential') {
    return true;
  }

  const consent = readStoredCookieConsent();
  return Boolean(consent && consent[category]);
}

/**
 * Creates a valid consent record.
 *
 * @param {Record<string, boolean|string>} [overrides]
 * @returns {{essential: boolean, functional: boolean, analytics: boolean, marketing: boolean, updatedAt: string}}
 */
function buildCookieConsent(overrides = {}) {
  return normalizeCookieConsent(overrides);
}

/**
 * Ensures the consent record always has the expected shape.
 *
 * @param {Record<string, boolean|string>} consent
 * @returns {{essential: boolean, functional: boolean, analytics: boolean, marketing: boolean, updatedAt: string}}
 */
function normalizeCookieConsent(consent = {}) {
  return {
    essential: true,
    functional: Boolean(consent.functional),
    analytics: Boolean(consent.analytics),
    marketing: Boolean(consent.marketing),
    updatedAt: typeof consent.updatedAt === 'string' ? consent.updatedAt : new Date().toISOString()
  };
}

/**
 * Reads a first-party cookie by name.
 *
 * @param {string} name
 * @returns {string}
 */
function readCookie(name) {
  const cookieName = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(cookieName));

  return match ? decodeURIComponent(match.slice(cookieName.length)) : '';
}

/**
 * Writes a first-party cookie with sensible defaults for a static site.
 *
 * @param {string} name
 * @param {string} value
 * @param {{maxAge?: number}} [options]
 */
function writeCookie(name, value, options = {}) {
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;

  if (typeof options.maxAge === 'number') {
    cookie += `; max-age=${options.maxAge}`;
  }

  if (window.location.protocol === 'https:') {
    cookie += '; Secure';
  }

  document.cookie = cookie;
}

/**
 * Removes a first-party cookie by expiring it immediately.
 *
 * @param {string} name
 */
function deleteCookie(name) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Canonicalizes a pathname so the homepage has a stable value.
 *
 * @param {string} path
 * @returns {string}
 */
function canonicalizePath(path) {
  if (!path || path === '/') {
    return '/index.html';
  }

  return path;
}

// ---------------------------------------------------------------------------
// Button icon enhancement
// ---------------------------------------------------------------------------

/**
 * Adds Lucide icon placeholders to text-only buttons so site-wide button
 * styling stays consistent without duplicating icon markup in every page.
 * Existing icon buttons are left untouched.
 */
function initializeButtonIcons() {
  document.querySelectorAll('button').forEach((button) => {
    if (button.dataset.iconEnhanced === 'true') {
      return;
    }

    if (button.classList.contains('calendar-nav-button')) {
      return;
    }

    if (button.querySelector('svg, i[data-lucide]')) {
      return;
    }

    const buttonLabel = button.textContent.trim();
    if (!buttonLabel) {
      return;
    }

    const iconName = getButtonIconName(button, buttonLabel);
    const labelWrapper = document.createElement('span');
    labelWrapper.className = 'button-label';

    while (button.firstChild) {
      labelWrapper.appendChild(button.firstChild);
    }

    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', iconName);
    icon.setAttribute('aria-hidden', 'true');
    icon.className = 'button-auto-icon w-4 h-4 shrink-0';

    button.classList.add('button-with-icon');
    button.append(labelWrapper, icon);
    button.dataset.iconEnhanced = 'true';
  });
}

/**
 * Maps common button labels to the nearest bundled Lucide icon.
 *
 * @param {HTMLButtonElement} button - Button element being enhanced.
 * @param {string} label - Visible button label.
 * @returns {string} Lucide icon name.
 */
function getButtonIconName(button, label) {
  const iconContext = `${label} ${button.getAttribute('aria-label') || ''}`.toLowerCase();

  if (
    iconContext.includes('subscribe') ||
    iconContext.includes('email') ||
    iconContext.includes('mail') ||
    iconContext.includes('send') ||
    iconContext.includes('message') ||
    iconContext.includes('contact')
  ) {
    return 'mail';
  }

  if (iconContext.includes('call') || iconContext.includes('phone')) {
    return 'phone';
  }

  if (
    iconContext.includes('location') ||
    iconContext.includes('address') ||
    iconContext.includes('map') ||
    iconContext.includes('directions')
  ) {
    return 'map-pin';
  }

  if (iconContext.includes('download')) {
    return 'download';
  }

  if (iconContext.includes('sort') || iconContext.includes('order')) {
    return 'arrow-up-down';
  }

  if (iconContext.includes('calendar')) {
    return 'calendar';
  }

  return 'arrow-right';
}

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
// Optional AOS initialization
// ---------------------------------------------------------------------------

/**
 * Initializes Animate On Scroll when a page includes the AOS library.
 * Safe no-op on pages where AOS is not loaded.
 */
function initializeAOSAnimations() {
  if (!window.AOS || typeof window.AOS.init !== 'function') {
    return;
  }

  window.AOS.init({
    duration: 650,
    easing: 'ease-out-cubic',
    once: true,
    offset: 24
  });

  window.addEventListener('load', () => {
    if (typeof window.AOS.refreshHard === 'function') {
      window.AOS.refreshHard();
    }
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
  if (footer) {
    // Lift the CTA on every breakpoint so it never masks the footer.
    const observer = new IntersectionObserver(
      ([entry]) => {
        newTalkButton.classList.toggle('is-lifted', entry.isIntersecting);
        newTalkButton.classList.toggle('is-footer-hidden', entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(footer);
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
    fullBio.setAttribute('aria-hidden', String(!isAlreadyExpanded));
    fullBio.style.overflow = 'hidden';
    fullBio.style.maxHeight = isAlreadyExpanded ? `${fullBio.scrollHeight}px` : '0px';
    summaryBio.hidden = isAlreadyExpanded;

    readMoreButton.classList.add('interactive-anim', 'interactive-anim--text');

    const syncExpandedHeight = () => {
      if (fullBio.classList.contains('show')) {
        fullBio.style.maxHeight = `${fullBio.scrollHeight}px`;
      }
    };

    window.addEventListener('resize', debounce(syncExpandedHeight, 120));

    readMoreButton.addEventListener('click', () => {
      const isExpanded = fullBio.classList.toggle('show');
      fullBio.style.maxHeight = isExpanded ? `${fullBio.scrollHeight}px` : '0px';
      fullBio.setAttribute('aria-hidden', String(!isExpanded));
      summaryBio.hidden = isExpanded;
      readMoreButton.textContent = isExpanded ? 'Read Less' : 'Read More';
      readMoreButton.setAttribute('aria-expanded', String(isExpanded));
    });
  });
}

// ---------------------------------------------------------------------------
// Global interactive motion refresh
// ---------------------------------------------------------------------------

/**
 * Applies a consistent motion style to all interactive elements so taps,
 * clicks, and hover states feel responsive across the site.
 */
function initializeInteractiveMotion() {
  const targets = document.querySelectorAll([
    'a[href]',
    'button',
    '[role="button"]',
    'input[type="submit"]',
    'input[type="button"]',
    '.event-card-toggle',
    '[id$="-read-more-btn"]'
  ].join(','));

  targets.forEach((target) => {
    if (target.classList.contains('interactive-anim')) {
      return;
    }

    target.classList.add('interactive-anim');

    const motionTone = getMotionTone(target);
    target.classList.add(`interactive-tone-${motionTone}`);

    if (target.matches('button, input[type="submit"], input[type="button"], a[class*="btn"], a.rounded-full')) {
      target.classList.add('interactive-anim--button');
    } else if (target.matches('#mobile-menu a, .nav-link')) {
      target.classList.add('interactive-anim--menu');
    } else if (target.matches('a[href]')) {
      target.classList.add('interactive-anim--link');
    }

    if (target.matches('[id$="-read-more-btn"], .event-card-toggle')) {
      target.classList.add('interactive-anim--text');
    }

    target.addEventListener('pointerdown', () => {
      target.classList.add('is-pressed');
    });

    const release = () => target.classList.remove('is-pressed');
    target.addEventListener('pointerup', release);
    target.addEventListener('pointercancel', release);
    target.addEventListener('pointerleave', release);
    target.addEventListener('blur', release);
  });

  document.querySelectorAll('.event-card').forEach((card) => {
    card.classList.add('interactive-card');
    card.classList.add(`motion-tone-${getMotionTone(card)}`);
  });

  document.querySelectorAll('input, select, textarea').forEach((control) => {
    control.classList.add('interactive-form-control');
  });
}

/**
 * Staggers card-like surfaces into view to make section transitions feel
 * more intentional on scroll-heavy pages.
 */
function initializeStaggeredCardReveal() {
  const selector = [
    '.event-card',
    'section .rounded-2xl',
    'section article.rounded-xl',
    'section .shadow-md',
    '.interactive-card'
  ].join(',');

  const cards = Array.from(new Set(Array.from(document.querySelectorAll(selector))));
  if (!cards.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  cards.forEach((card) => {
    card.classList.add('motion-enter');

    const motionTone = getMotionTone(card);
    card.classList.add(`motion-tone-${motionTone}`);

    const nearestSection = card.closest('section');
    const siblingCards = nearestSection
      ? Array.from(nearestSection.querySelectorAll(selector))
      : cards;
    const localIndex = Math.max(0, siblingCards.indexOf(card));
    const cadenceMultiplier = motionTone === 'dramatic' ? 1.2 : motionTone === 'restrained' ? 0.85 : 1;
    const delay = Math.round(Math.min(localIndex, 7) * 65 * cadenceMultiplier);

    card.style.setProperty('--motion-enter-delay', `${delay}ms`);
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: '0px 0px -6% 0px' }
  );

  cards.forEach((card) => observer.observe(card));
}

/**
 * Resolves a motion tone for an element based on the closest layout region.
 * dramatic: hero/gradient-dark sections
 * restrained: navigation/footer/utility regions
 * balanced: default content sections
 *
 * @param {Element} element
 * @returns {'dramatic'|'balanced'|'restrained'}
 */
function getMotionTone(element) {
  const region = element.closest('section, header, footer, nav, aside, main');
  if (!region) {
    return 'balanced';
  }

  const tag = region.tagName.toLowerCase();
  const classes = (region.className || '').toLowerCase();

  if (tag === 'footer' || tag === 'nav' || tag === 'aside') {
    return 'restrained';
  }

  if (
    classes.includes('bg-compass-dark') ||
    classes.includes('hero') ||
    classes.includes('gradient') ||
    classes.includes('animate-blob')
  ) {
    return 'dramatic';
  }

  return 'balanced';
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

    if (image.closest('.ticker-track')) {
      image.setAttribute('loading', 'lazy');
      image.setAttribute('fetchpriority', 'low');
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
      image.src = '/assets/logos/optimized/Logo-320.webp';
      image.style.maxHeight = '100px';
    });
  });
}

/**
 * Registers the PWA service worker for installability and offline support.
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Gracefully degrade when service worker registration is unavailable.
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
 * to Netlify Forms, providing inline feedback to the user.
 */
function initializeNewsletterForm() {
  const forms = document.querySelectorAll('form[name="newsletter-subscribe"]');
  if (!forms.length) return;

  forms.forEach((form) => {
    if (hasNewsletterSubscriptionCookie()) {
      renderNewsletterSubscribedState(form);
      return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('input[name="email"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!emailInput || !submitBtn) return;

      const email = emailInput.value.trim();
      if (!email || !emailInput.checkValidity()) {
        emailInput.reportValidity();
        return;
      }

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Subscribing...';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        formData.set('email', email);

        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString(),
        });

        if (!res.ok) {
          throw new Error('Subscription failed.');
        }

        saveNewsletterSubscriptionCookie();
        emailInput.value = '';
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        renderNewsletterSubscribedState(form);
      } catch (error) {
        submitBtn.textContent = error instanceof Error ? error.message : 'Error';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  });
}

/**
 * Replaces the newsletter subscription form with a persistent thank-you
 * message when a successful subscription cookie is present.
 *
 * @param {HTMLFormElement} form
 */
function renderNewsletterSubscribedState(form) {
  if (form.dataset.newsletterStateRendered === 'true') {
    form.hidden = true;
    return;
  }

  const thankYouMessage = document.createElement('div');
  thankYouMessage.className = 'rounded-lg border border-green-700/40 bg-green-950/40 px-4 py-3 text-sm text-green-100';
  thankYouMessage.setAttribute('role', 'status');
  thankYouMessage.innerHTML = '<strong class="block text-green-50">Thanks for subscribing.</strong><span class="block mt-1 text-green-100/90">You are already on the Compass Consult newsletter list.</span>';

  form.hidden = true;
  form.dataset.newsletterStateRendered = 'true';
  form.insertAdjacentElement('afterend', thankYouMessage);
}

/**
 * Checks whether the newsletter subscription state cookie is present.
 *
 * @returns {boolean}
 */
function hasNewsletterSubscriptionCookie() {
  return readCookie(COOKIE_NEWSLETTER_NAME) === 'true';
}

/**
 * Stores a lightweight subscription-state cookie without persisting the
 * subscriber's email address in the browser.
 */
function saveNewsletterSubscriptionCookie() {
  writeCookie(COOKIE_NEWSLETTER_NAME, 'true', {
    maxAge: COOKIE_NEWSLETTER_MAX_AGE
  });
}

// ---------------------------------------------------------------------------
// Contact enquiry form (Netlify Forms)
// ---------------------------------------------------------------------------

/**
 * Handles the contact enquiry form with client-side validation and AJAX
 * submission via Netlify Forms. Shows inline success/error messages.
 */
function initializeContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = [
    { name: 'name', validate: (v) => v.trim().length > 0 },
    { name: 'email', validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { name: 'message', validate: (v) => v.trim().length > 0 }
  ];

  // Clear error on input
  fields.forEach(({ name }) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;
    input.addEventListener('input', () => {
      input.classList.remove('border-red-400');
      const err = form.querySelector(`[data-error="${name}"]`);
      if (err) err.classList.add('hidden');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate
    let valid = true;
    fields.forEach(({ name, validate }) => {
      const input = form.querySelector(`[name="${name}"]`);
      const err = form.querySelector(`[data-error="${name}"]`);
      if (!input) return;
      if (!validate(input.value)) {
        valid = false;
        input.classList.add('border-red-400');
        if (err) err.classList.remove('hidden');
      } else {
        input.classList.remove('border-red-400');
        if (err) err.classList.add('hidden');
      }
    });

    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const errorEl = document.getElementById('contact-error');
    if (errorEl) errorEl.classList.add('hidden');

    try {
      const formData = new FormData(form);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      form.classList.add('hidden');
      const successEl = document.getElementById('contact-success');
      if (successEl) {
        successEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    } catch {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      if (errorEl) errorEl.classList.remove('hidden');
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
  initializeRevealAnimations,
  hasCookieConsent,
  openCookiePreferences: () => {
    if (window.CompassConsultCookieConsent) {
      window.CompassConsultCookieConsent.openPreferences();
    }
  },
  getCookiePreferences: () => readStoredCookieConsent() || buildCookieConsent()
};
