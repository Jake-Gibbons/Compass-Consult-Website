document.addEventListener("DOMContentLoaded",()=>{initializeCookieConsent(),initializeButtonIcons(),initializeIcons(),initializeYearAndDate(),initializeMobileMenu(),initializeAOSAnimations(),initializeSidebarEnhancements(),initializeStickyTalkButton(),initializeRevealAnimations(),initializeBioReadMore(),initializeInteractiveMotion(),initializeStaggeredCardReveal(),enhanceExternalLinks(),initializeComingSoonSocialLinks(),connectFormLabels(),optimizeImages(),initializeTickerImageFallback(),initializeTicker(),initializeSidebarScrollIndicator(),initializeNewsletterForm(),initializeContactForm(),registerServiceWorker()}),window.addEventListener("load",()=>{const e=document.getElementById("clients-ticker");e&&!e._emblaInstance&&initializeTicker()});const COOKIE_CONSENT_NAME="compass_cookie_preferences",COOKIE_CONSENT_MAX_AGE=3600*24*180,NEWSLETTER_SUBSCRIPTION_COOKIE_NAME="compass_newsletter_subscription",NEWSLETTER_SUBSCRIPTION_MAX_AGE=3600*24*365;function initializeCookieConsent(){ensureCookieConsentStyles();const e=createCookieConsentUi();if(!e)return;const n=canonicalizePath(window.location.pathname)==="/pages/cookies.html";let t=readStoredCookieConsent();const o=s=>{const l=normalizeCookieConsent(s);e.form.elements.functional.checked=l.functional,e.form.elements.analytics.checked=l.analytics,e.form.elements.marketing.checked=l.marketing},i=()=>{e.overlay.hidden=!0,document.body.classList.remove("cc-cookie-lock")},r=()=>{o(t||buildCookieConsent()),e.overlay.hidden=!1,document.body.classList.add("cc-cookie-lock"),window.setTimeout(()=>{e.form.elements.functional.focus()},0)},c=s=>{t=saveCookieConsent(s),o(t),e.banner.hidden=!0,e.trigger.hidden=!n,i(),applyCookieConsent(t,!0)},a=()=>{const s=new FormData(e.form);return buildCookieConsent({functional:s.get("functional")==="on",analytics:s.get("analytics")==="on",marketing:s.get("marketing")==="on"})};e.bannerManageButton.addEventListener("click",r),e.trigger.addEventListener("click",r),e.overlay.addEventListener("click",s=>{(s.target===e.overlay||s.target.hasAttribute("data-cc-close"))&&i()}),document.addEventListener("keydown",s=>{s.key==="Escape"&&!e.overlay.hidden&&i()}),e.acceptButtons.forEach(s=>{s.addEventListener("click",()=>{c({functional:!0,analytics:!0,marketing:!0})})}),e.rejectButtons.forEach(s=>{s.addEventListener("click",()=>{c({functional:!1,analytics:!1,marketing:!1})})}),e.saveButton.addEventListener("click",()=>{c(a())}),bindCookiePreferenceTriggers(r),o(t||buildCookieConsent()),e.banner.hidden=!!t,e.trigger.hidden=!t||!n,applyCookieConsent(t||buildCookieConsent()),window.CompassConsultCookieConsent={getPreferences:()=>readStoredCookieConsent()||buildCookieConsent(),hasConsent:hasCookieConsent,openPreferences:r,savePreferences:s=>c(s)}}function ensureCookieConsentStyles(){if(document.getElementById("cc-cookie-styles"))return;const e=document.createElement("style");e.id="cc-cookie-styles",e.textContent=`
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
  `,document.head.appendChild(e)}function createCookieConsentUi(){const e=document.getElementById("cc-cookie-banner");if(e)return{banner:e,bannerManageButton:document.getElementById("cc-cookie-banner-manage"),trigger:document.getElementById("cc-cookie-trigger"),overlay:document.getElementById("cc-cookie-overlay"),form:document.getElementById("cc-cookie-form"),saveButton:document.getElementById("cc-cookie-save"),acceptButtons:Array.from(document.querySelectorAll("[data-cc-accept]")),rejectButtons:Array.from(document.querySelectorAll("[data-cc-reject]"))};const n=document.createElement("div");return n.innerHTML=['<section id="cc-cookie-banner" class="cc-cookie-banner" aria-label="Cookie notice">','  <div class="cc-cookie-banner-copy">','    <p class="cc-cookie-text"><span class="cc-cookie-inline-title">Cookies:</span> we use one essential cookie to remember your choice. Optional cookies only run if you opt in. <a href="/pages/cookies.html" class="cc-cookie-link">Cookie Policy</a>.</p>',"  </div>",'  <div class="cc-cookie-actions">','    <button type="button" id="cc-cookie-banner-manage" class="cc-cookie-button cc-cookie-button-ghost">Customise</button>','    <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-secondary">Reject optional</button>','    <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',"  </div>","</section>",'<button type="button" id="cc-cookie-trigger" class="cc-cookie-trigger">Cookie settings</button>','<div id="cc-cookie-overlay" class="cc-cookie-overlay" hidden>','  <div class="cc-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cc-cookie-panel-title">','    <div class="cc-cookie-panel-header">',"      <div>",'        <span class="cc-cookie-eyebrow" style="color:#483086;">Cookie settings</span>','        <h2 id="cc-cookie-panel-title" class="cc-cookie-panel-title">Choose which cookies to allow</h2>','        <p class="cc-cookie-panel-text">Essential cookies stay on so the website can function and remember this choice. Everything else is optional.</p>',"      </div>",'      <button type="button" class="cc-cookie-close" aria-label="Close cookie settings" data-cc-close>&times;</button>',"    </div>",'    <form id="cc-cookie-form">','      <div class="cc-cookie-options">','        <label class="cc-cookie-option">','          <input type="checkbox" checked disabled>',"          <span>","            <strong>Strictly necessary</strong>","            <p>Stores your consent choice and supports essential site functions such as forms and security controls.</p>","            <small>Always active</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="functional">',"          <span>","            <strong>Functional</strong>","            <p>Reserved for optional convenience features if we introduce them later. No non-essential functional cookies are set by default.</p>","            <small>Optional</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="analytics">',"          <span>","            <strong>Analytics</strong>","            <p>Allows future measurement scripts or deferred analytics embeds to load only after you opt in.</p>","            <small>Optional</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="marketing">',"          <span>","            <strong>Marketing</strong>","            <p>Allows future campaign or third-party marketing content to load only after you opt in.</p>","            <small>Optional</small>","          </span>","        </label>","      </div>","    </form>",'    <div class="cc-cookie-panel-actions">','      <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-ghost">Reject optional</button>','      <button type="button" id="cc-cookie-save" class="cc-cookie-button cc-cookie-button-secondary" style="background:#111827;color:#ffffff;">Save preferences</button>','      <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',"    </div>","  </div>","</div>"].join(""),document.body.appendChild(n),{banner:document.getElementById("cc-cookie-banner"),bannerManageButton:document.getElementById("cc-cookie-banner-manage"),trigger:document.getElementById("cc-cookie-trigger"),overlay:document.getElementById("cc-cookie-overlay"),form:document.getElementById("cc-cookie-form"),saveButton:document.getElementById("cc-cookie-save"),acceptButtons:Array.from(document.querySelectorAll("[data-cc-accept]")),rejectButtons:Array.from(document.querySelectorAll("[data-cc-reject]"))}}function applyCookieConsent(e,n=!1){const t=normalizeCookieConsent(e);document.documentElement.dataset.cookieFunctional=String(t.functional),document.documentElement.dataset.cookieAnalytics=String(t.analytics),document.documentElement.dataset.cookieMarketing=String(t.marketing),activateDeferredCookieAssets(t),deleteCookie("compass_last_page"),n&&document.dispatchEvent(new CustomEvent("compass:cookie-consent-updated",{detail:t}))}function activateDeferredCookieAssets(e){document.querySelectorAll("[data-cookie-category]").forEach(n=>{const t=n.getAttribute("data-cookie-category"),o=t==="essential"||!!e[t];if(n.tagName==="SCRIPT"){const i=n;if(!o||i.dataset.cookieActivated==="true"||i.type!=="text/plain")return;const r=document.createElement("script");Array.from(i.attributes).forEach(c=>{c.name==="type"||c.name.startsWith("data-cookie-")||r.setAttribute(c.name,c.value)}),i.dataset.cookieSrc?r.src=i.dataset.cookieSrc:r.textContent=i.textContent,i.dataset.cookieActivated="true",i.parentNode.insertBefore(r,i.nextSibling);return}if(n.tagName==="IFRAME"&&o){const i=n;i.dataset.cookieSrc&&i.getAttribute("src")!==i.dataset.cookieSrc&&i.setAttribute("src",i.dataset.cookieSrc)}})}function bindCookiePreferenceTriggers(e){document.querySelectorAll("[data-cookie-preferences]").forEach(n=>{n.dataset.cookiePreferencesBound!=="true"&&(n.dataset.cookiePreferencesBound="true",n.addEventListener("click",t=>{t.preventDefault(),e()}))})}function readStoredCookieConsent(){const e=readCookie(COOKIE_CONSENT_NAME);if(!e)return null;try{return normalizeCookieConsent(JSON.parse(e))}catch(n){return null}}function saveCookieConsent(e){const n=normalizeCookieConsent(e);return writeCookie(COOKIE_CONSENT_NAME,JSON.stringify(n),{maxAge:COOKIE_CONSENT_MAX_AGE}),n}function hasCookieConsent(e){if(e==="essential")return!0;const n=readStoredCookieConsent();return!!(n&&n[e])}function buildCookieConsent(e={}){return normalizeCookieConsent(e)}function normalizeCookieConsent(e={}){return{essential:!0,functional:!!e.functional,analytics:!!e.analytics,marketing:!!e.marketing,updatedAt:typeof e.updatedAt=="string"?e.updatedAt:new Date().toISOString()}}function readCookie(e){const n=`${e}=`,t=document.cookie.split(";").map(o=>o.trim()).find(o=>o.startsWith(n));return t?decodeURIComponent(t.slice(n.length)):""}function writeCookie(e,n,t={}){let o=`${e}=${encodeURIComponent(n)}; path=/; SameSite=Lax`;typeof t.maxAge=="number"&&(o+=`; max-age=${t.maxAge}`),window.location.protocol==="https:"&&(o+="; Secure"),document.cookie=o}function deleteCookie(e){document.cookie=`${e}=; path=/; max-age=0; SameSite=Lax`}function readStoredNewsletterSubscription(){const e=readCookie(NEWSLETTER_SUBSCRIPTION_COOKIE_NAME);if(!e)return null;try{return normalizeNewsletterSubscription(JSON.parse(e))}catch(n){return null}}function saveStoredNewsletterSubscription(e){const n=normalizeNewsletterSubscription(e);return n?(writeCookie(NEWSLETTER_SUBSCRIPTION_COOKIE_NAME,JSON.stringify(n),{maxAge:NEWSLETTER_SUBSCRIPTION_MAX_AGE}),n):null}function clearStoredNewsletterSubscription(){deleteCookie(NEWSLETTER_SUBSCRIPTION_COOKIE_NAME)}function normalizeNewsletterSubscription(e={}){const n=typeof e.id=="string"?e.id.trim():"",t=typeof e.email=="string"?e.email.trim().toLowerCase():"",o=typeof e.subscribedAt=="string"?e.subscribedAt:new Date().toISOString();return!n&&!t?null:{...n?{id:n}:{},...t?{email:t}:{},subscribedAt:o}}function canonicalizePath(e){return!e||e==="/"?"/index.html":e}function initializeButtonIcons(){document.querySelectorAll("button").forEach(e=>{if(e.dataset.iconEnhanced==="true"||e.classList.contains("calendar-nav-button")||e.querySelector("svg, i[data-lucide]"))return;const n=e.textContent.trim();if(!n)return;const t=getButtonIconName(e,n),o=document.createElement("span");for(o.className="button-label";e.firstChild;)o.appendChild(e.firstChild);const i=document.createElement("i");i.setAttribute("data-lucide",t),i.setAttribute("aria-hidden","true"),i.className="button-auto-icon w-4 h-4 shrink-0",e.classList.add("button-with-icon"),e.append(o,i),e.dataset.iconEnhanced="true"})}function getButtonIconName(e,n){const t=`${n} ${e.getAttribute("aria-label")||""}`.toLowerCase();return t.includes("subscribe")||t.includes("email")||t.includes("mail")||t.includes("send")||t.includes("message")||t.includes("contact")?"mail":t.includes("call")||t.includes("phone")?"phone":t.includes("location")||t.includes("address")||t.includes("map")||t.includes("directions")?"map-pin":t.includes("download")?"download":t.includes("sort")||t.includes("order")?"arrow-up-down":t.includes("calendar")?"calendar":"arrow-right"}function initializeComingSoonSocialLinks(){const e='<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>';document.querySelectorAll("footer .flex.space-x-4").forEach(t=>{if(t.querySelectorAll('a[href="#"]').forEach(i=>{i.remove()}),t.querySelector('a[href^="mailto:"]'))return;const o=document.createElement("a");o.href="mailto:enquiries@compassconsultes.co.uk",o.setAttribute("aria-label","Email Compass Consult"),o.setAttribute("title","Email Compass Consult"),o.className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-compass-teal hover:text-white transition-all hover:-translate-y-1",o.innerHTML=e,t.appendChild(o)})}function initializeAOSAnimations(){!window.AOS||typeof window.AOS.init!="function"||(window.AOS.init({duration:650,easing:"ease-out-cubic",once:!0,offset:24}),window.addEventListener("load",()=>{typeof window.AOS.refreshHard=="function"&&window.AOS.refreshHard()}))}function initializeSidebarEnhancements(){const e=document.querySelectorAll("aside.hidden.lg\\:flex");if(!e.length)return;const n=window.matchMedia("(min-width: 1024px)");e.forEach(t=>{const o=t.querySelector('a[href="/pages/contact.html"]');if(!o)return;t.classList.add("sidebar-standard"),t.classList.remove("p-8","justify-between");const i=Array.from(t.children).filter(u=>u.tagName&&u.tagName.toLowerCase()==="div"),r=o.closest("div"),c=i.find(u=>u!==r),a=c||t;c&&c.parentElement===t&&c.classList.add("sidebar-main"),r&&r.parentElement===t&&r.classList.add("sidebar-cta");const s=o.querySelector('i[data-lucide="arrow-right"]');s&&s.classList.add("transition-transform");let l=t.querySelector(".sidebar-scroll-hint");l||(l=document.createElement("p"),l.className="sidebar-scroll-hint",l.innerHTML='<svg aria-hidden="true" focusable="false" class="sidebar-scroll-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg><span>Scroll for more</span>',r&&r.parentElement===t?t.insertBefore(l,r):t.appendChild(l));const d=()=>{const u=a.scrollHeight>a.clientHeight+8,m=u?a.scrollTop+a.clientHeight>=a.scrollHeight-12:!0,f=n.matches&&u&&!m;l.classList.toggle("is-visible",f)};a.addEventListener("scroll",d,{passive:!0}),window.addEventListener("resize",d),typeof n.addEventListener=="function"?n.addEventListener("change",d):typeof n.addListener=="function"&&n.addListener(d),d()})}function initializeStickyTalkButton(){if(document.querySelector(".sticky-talk-button"))return;const n=window.location.pathname.toLowerCase();if(n.endsWith("/contact.html")||n==="/contact.html")return;const o=n.endsWith("/index.html")||n==="/"||n==="/index.html",i=document.createElement("a");if(i.href="/pages/contact.html",i.className=`sticky-talk-button${o?" is-hidden":""}`,i.setAttribute("aria-label","Talk to Compass Consult"),i.setAttribute("title","Talk to us"),i.innerHTML=['<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">','<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"></path>',"</svg>","<span>Talk to Us</span>"].join(""),document.body.appendChild(i),o){const c=()=>{const a=window.scrollY>24;i.classList.toggle("is-hidden",!a)};c(),window.addEventListener("scroll",c,{passive:!0})}const r=document.querySelector("footer");r&&new IntersectionObserver(([a])=>{i.classList.toggle("is-lifted",a.isIntersecting),i.classList.toggle("is-footer-hidden",a.isIntersecting)},{threshold:.05}).observe(r)}function initializeIcons(){window.lucide&&typeof window.lucide.createIcons=="function"&&window.lucide.createIcons()}function initializeYearAndDate(){const e=new Date().getFullYear();document.querySelectorAll(".year-span").forEach(o=>{o.textContent=String(e)});const n=document.getElementById("year");n&&(n.textContent=String(e));const t=document.getElementById("date");t&&!t.textContent.trim()&&(t.textContent=new Date().toLocaleDateString())}function initializeMobileMenu(){const e=document.getElementById("mobile-menu-btn"),n=document.getElementById("mobile-menu");if(!e||!n)return;n.id||(n.id="mobile-menu"),e.getAttribute("type")||e.setAttribute("type","button"),e.getAttribute("aria-label")||e.setAttribute("aria-label","Toggle mobile menu"),e.setAttribute("aria-controls",n.id),e.setAttribute("aria-expanded","false"),n.classList.remove("hidden"),n.hidden=!1;const t=()=>{e.querySelector(".hamburger-icon")||(e.innerHTML=['<span class="hamburger-icon" aria-hidden="true">','<span class="bar"></span>','<span class="bar"></span>','<span class="bar"></span>',"</span>"].join(""))},o=r=>{n.classList.toggle("menu-open",r),e.setAttribute("aria-expanded",String(r)),e.setAttribute("aria-label",r?"Close mobile menu":"Open mobile menu"),e.classList.toggle("menu-open-state",r),document.body.classList.toggle("menu-open",r)};t(),o(!1);const i=()=>{const r=n.classList.contains("menu-open");o(!r)};e.addEventListener("click",i),n.querySelectorAll("a").forEach(r=>{r.addEventListener("click",()=>o(!1))}),document.addEventListener("keydown",r=>{r.key==="Escape"&&o(!1)}),document.addEventListener("click",r=>{n.classList.contains("menu-open")&&!n.contains(r.target)&&!e.contains(r.target)&&o(!1)}),window.addEventListener("resize",()=>{window.innerWidth>=1024&&o(!1)})}function initializeRevealAnimations(){const e=document.querySelectorAll(".reveal");if(!e.length)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.forEach(o=>o.classList.add("active"));return}if(!("IntersectionObserver"in window)){e.forEach(o=>o.classList.add("active"));return}const t=new IntersectionObserver(o=>{o.forEach(i=>{i.isIntersecting&&(i.target.classList.add("active"),t.unobserve(i.target))})},{threshold:.1});e.forEach(o=>t.observe(o))}function initializeBioReadMore(){document.querySelectorAll('[id$="-bio"]').forEach(n=>{const t=n.id.replace("-bio",""),o=document.getElementById(`${t}-read-more-btn`),i=document.getElementById(`${t}-bio-full`),r=document.getElementById(`${t}-bio-summary`);if(!o||!i||!r)return;o.setAttribute("aria-controls",`${t}-bio-full`);const c=i.classList.contains("show");o.setAttribute("aria-expanded",String(c)),i.setAttribute("aria-hidden",String(!c)),i.style.overflow="hidden",i.style.maxHeight=c?`${i.scrollHeight}px`:"0px",r.hidden=c,o.classList.add("interactive-anim","interactive-anim--text");const a=()=>{i.classList.contains("show")&&(i.style.maxHeight=`${i.scrollHeight}px`)};window.addEventListener("resize",debounce(a,120)),o.addEventListener("click",()=>{const s=i.classList.toggle("show");i.style.maxHeight=s?`${i.scrollHeight}px`:"0px",i.setAttribute("aria-hidden",String(!s)),r.hidden=s,o.textContent=s?"Read Less":"Read More",o.setAttribute("aria-expanded",String(s))})})}function initializeInteractiveMotion(){document.querySelectorAll(["a[href]","button",'[role="button"]','input[type="submit"]','input[type="button"]',".event-card-toggle",'[id$="-read-more-btn"]'].join(",")).forEach(n=>{if(n.classList.contains("interactive-anim"))return;n.classList.add("interactive-anim");const t=getMotionTone(n);n.classList.add(`interactive-tone-${t}`),n.matches('button, input[type="submit"], input[type="button"], a[class*="btn"], a.rounded-full')?n.classList.add("interactive-anim--button"):n.matches("#mobile-menu a, .nav-link")?n.classList.add("interactive-anim--menu"):n.matches("a[href]")&&n.classList.add("interactive-anim--link"),n.matches('[id$="-read-more-btn"], .event-card-toggle')&&n.classList.add("interactive-anim--text"),n.addEventListener("pointerdown",()=>{n.classList.add("is-pressed")});const o=()=>n.classList.remove("is-pressed");n.addEventListener("pointerup",o),n.addEventListener("pointercancel",o),n.addEventListener("pointerleave",o),n.addEventListener("blur",o)}),document.querySelectorAll(".event-card").forEach(n=>{n.classList.add("interactive-card"),n.classList.add(`motion-tone-${getMotionTone(n)}`)}),document.querySelectorAll("input, select, textarea").forEach(n=>{n.classList.add("interactive-form-control")})}function initializeStaggeredCardReveal(){const e=[".event-card","section .rounded-2xl","section article.rounded-xl","section .shadow-md",".interactive-card"].join(","),n=Array.from(new Set(Array.from(document.querySelectorAll(e))));if(!n.length)return;const t=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(n.forEach(i=>{i.classList.add("motion-enter");const r=getMotionTone(i);i.classList.add(`motion-tone-${r}`);const c=i.closest("section"),a=c?Array.from(c.querySelectorAll(e)):n,s=Math.max(0,a.indexOf(i)),l=r==="dramatic"?1.2:r==="restrained"?.85:1,d=Math.round(Math.min(s,7)*65*l);i.style.setProperty("--motion-enter-delay",`${d}ms`)}),t||!("IntersectionObserver"in window)){n.forEach(i=>i.classList.add("is-in-view"));return}const o=new IntersectionObserver(i=>{i.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-in-view"),o.unobserve(r.target))})},{threshold:.16,rootMargin:"0px 0px -6% 0px"});n.forEach(i=>o.observe(i))}function getMotionTone(e){const n=e.closest("section, header, footer, nav, aside, main");if(!n)return"balanced";const t=n.tagName.toLowerCase(),o=(n.className||"").toLowerCase();return t==="footer"||t==="nav"||t==="aside"?"restrained":o.includes("bg-compass-dark")||o.includes("hero")||o.includes("gradient")||o.includes("animate-blob")?"dramatic":"balanced"}function enhanceExternalLinks(){document.querySelectorAll('a[target="_blank"]').forEach(t=>{const o=new Set((t.getAttribute("rel")||"").split(/\s+/).filter(Boolean));if(o.add("noopener"),o.add("noreferrer"),t.setAttribute("rel",Array.from(o).join(" ")),!t.getAttribute("aria-label")&&!t.textContent.trim()){const i=t.getAttribute("href")||"";let r="External link";i.startsWith("mailto:")?r="Email link":i.includes("linkedin.com")?r="LinkedIn profile":i.includes("facebook.com")&&(r="Facebook profile"),t.setAttribute("aria-label",r),t.setAttribute("title",r)}else!t.getAttribute("title")&&t.getAttribute("aria-label")&&t.setAttribute("title",t.getAttribute("aria-label"))}),document.querySelectorAll("a").forEach(t=>{if(t.getAttribute("aria-label")){t.getAttribute("title")||t.setAttribute("title",t.getAttribute("aria-label"));return}const o=t.textContent.trim().length>0,i=!!t.querySelector("i, svg");if(o||!i)return;const r=t.getAttribute("href")||"";let c="Link";r.includes("linkedin.com")?c="LinkedIn":r.includes("facebook.com")?c="Facebook":r.includes("x.com")||r.includes("twitter.com")?c="X profile":r.startsWith("mailto:")?c="Email":r==="#"&&(c="Social profile"),t.setAttribute("aria-label",c),t.setAttribute("title",c)})}function connectFormLabels(){document.querySelectorAll("form").forEach((n,t)=>{n.querySelectorAll("label").forEach((i,r)=>{if(i.getAttribute("for"))return;const c=i.parentElement?i.parentElement.querySelector("input, select, textarea"):null;c&&(c.id||(c.id=`form-${t}-field-${r}`),i.setAttribute("for",c.id),c.getAttribute("aria-label")||c.setAttribute("aria-label",i.textContent.trim()),c.getAttribute("title")||c.setAttribute("title",i.textContent.trim()))})})}function optimizeImages(){document.querySelectorAll("img").forEach((n,t)=>{n.hasAttribute("decoding")||n.setAttribute("decoding","async"),!n.hasAttribute("loading")&&t>2&&n.setAttribute("loading","lazy"),n.closest(".ticker-track")&&(n.setAttribute("loading","lazy"),n.setAttribute("fetchpriority","low"))})}function initializeTickerImageFallback(){document.querySelectorAll(".embla-ticker img").forEach(e=>{e.addEventListener("error",()=>{e.src="/assets/logos/optimized/Logo-320.webp",e.style.maxHeight="100px"})})}function initializeTicker(){const e=document.getElementById("clients-ticker");if(!e||e._emblaInstance||typeof EmblaCarousel=="undefined")return;const n=[];typeof EmblaCarouselAutoScroll!="undefined"&&n.push(EmblaCarouselAutoScroll({playOnInit:!0,startDelay:0,speed:1,direction:"forward",stopOnInteraction:!1,stopOnMouseEnter:!0,stopOnFocusIn:!1}));const t=EmblaCarousel(e,{loop:!0,dragFree:!0,align:"start",containScroll:!1},n);e._emblaInstance=t,t.on("pointerDown",()=>e.classList.add("is-dragging")),t.on("pointerUp",()=>e.classList.remove("is-dragging"))}function registerServiceWorker(){"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}function scrollToElement(e){const n=document.querySelector(e);n&&n.scrollIntoView({behavior:"smooth"})}function debounce(e,n){let t;return function(...i){clearTimeout(t),t=setTimeout(()=>{e(...i)},n)}}function isInViewport(e){const n=e.getBoundingClientRect();return n.top>=0&&n.left>=0&&n.bottom<=(window.innerHeight||document.documentElement.clientHeight)&&n.right<=(window.innerWidth||document.documentElement.clientWidth)}function initializeSidebarScrollIndicator(){const e=document.getElementById("sidebar-scroll-area"),n=document.getElementById("sidebar-scroll-indicator");if(!e||!n)return;const t=()=>{const o=e.scrollTop+e.clientHeight>=e.scrollHeight-4;n.style.opacity=o?"0":"1"};t(),e.addEventListener("scroll",t,{passive:!0})}function initializeNewsletterForm(){const e=Array.from(document.querySelectorAll('form[name="newsletter-subscribe"]'));if(!e.length)return;const n=(t,o={})=>{const i=!!o.clearFeedback;e.forEach(r=>{const c=ensureNewsletterFeedbackElement(r),a=ensureNewsletterUnsubscribeElement(r,c);i&&updateNewsletterFeedback(c,null),syncNewsletterSubscriptionUi(r,a,t)})};n(readStoredNewsletterSubscription(),{clearFeedback:!0}),e.forEach(t=>{t.setAttribute("action","/api/subscribers"),t.setAttribute("method","POST");const o=ensureNewsletterFeedbackElement(t),i=ensureNewsletterUnsubscribeElement(t,o);i.button.addEventListener("click",async()=>{const r=readStoredNewsletterSubscription();if(!r){clearStoredNewsletterSubscription(),n(null,{clearFeedback:!0});return}const c=i.button.textContent;i.button.textContent="Unsubscribing...",i.button.disabled=!0,updateNewsletterFeedback(o,null);try{const a=new URLSearchParams;r.id?a.set("id",r.id):r.email&&a.set("email",r.email);const s=await fetch(`/api/subscribers?${a.toString()}`,{method:"DELETE",headers:{Accept:"application/json"}}),l=await s.json().catch(()=>null);if(!s.ok&&s.status!==404)throw new Error(l&&l.error?l.error:"Unsubscribe failed.");clearStoredNewsletterSubscription(),n(null,{clearFeedback:!0}),updateNewsletterFeedback(o,{tone:"success",title:"You have been unsubscribed.",body:"The newsletter subscribe box is available again if you want to join later."})}catch(a){i.button.textContent=c,i.button.disabled=!1,updateNewsletterFeedback(o,{tone:"error",title:"Unsubscribe failed.",body:a instanceof Error?a.message:"Please try again in a moment."})}}),t.addEventListener("submit",async r=>{r.preventDefault();const c=t.querySelector('input[name="email"]'),a=t.querySelector('button[type="submit"]');if(!c||!a)return;const s=c.value.trim();if(!s||!c.checkValidity()){c.reportValidity();return}const l=a.textContent;a.textContent="Subscribing...",a.disabled=!0,updateNewsletterFeedback(o,null);try{const d=await fetch("/api/subscribers",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({email:s})}),u=await d.json().catch(()=>null);if(!d.ok)throw new Error(u&&u.error?u.error:"Subscription failed.");const m=saveStoredNewsletterSubscription(u&&typeof u=="object"?u.subscriber||u:{email:s});t.reset(),a.textContent=l,a.disabled=!1,n(m),updateNewsletterFeedback(o,u&&u.message==="Already subscribed"?{tone:"info",title:"Already subscribed.",body:"That email address is already on the Compass Consult newsletter list on this device."}:{tone:"success",title:"Thanks for subscribing.",body:"You have been added to the Compass Consult newsletter list on this device."})}catch(d){a.textContent=l,a.disabled=!1,updateNewsletterFeedback(o,{tone:"error",title:"Subscription failed.",body:d instanceof Error?d.message:"Please try again in a moment."})}})})}function ensureNewsletterUnsubscribeElement(e,n){const t=n.nextElementSibling;if(t&&t instanceof HTMLDivElement&&t.dataset.newsletterUnsubscribe==="true")return{container:t,button:t.querySelector("[data-newsletter-unsubscribe-button]"),email:t.querySelector("[data-newsletter-subscribed-email]")};const o=document.createElement("div");o.dataset.newsletterUnsubscribe="true",o.hidden=!0,o.className="mt-3 rounded-lg border border-gray-700 bg-gray-800/70 px-4 py-3 text-sm text-gray-200";const i=document.createElement("p");i.className="leading-6",i.innerHTML='You are already subscribed<span data-newsletter-subscribed-email class="font-semibold text-white"></span>.';const r=document.createElement("button");return r.type="button",r.dataset.newsletterUnsubscribeButton="true",r.className="mt-3 inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-red-400/35 px-4 py-2 font-semibold text-red-100 transition-colors hover:border-red-300 hover:bg-red-500/10",r.textContent="Unsubscribe",o.append(i,r),n.insertAdjacentElement("afterend",o),{container:o,button:r,email:o.querySelector("[data-newsletter-subscribed-email]")}}function syncNewsletterSubscriptionUi(e,n,t){const o=!!t,i=e.querySelectorAll("input, button");if(e.hidden=o,e.setAttribute("aria-hidden",String(o)),i.forEach(r=>{r.disabled=o}),n.container.hidden=!o,n.button.disabled=!1,n.button.textContent="Unsubscribe",!o){n.email.textContent="";return}n.email.textContent=t.email?` as ${t.email}`:""}function ensureNewsletterFeedbackElement(e){const n=e.nextElementSibling;if(n&&n instanceof HTMLDivElement&&n.dataset.newsletterFeedback==="true")return n;const t=document.createElement("div");return t.dataset.newsletterFeedback="true",t.hidden=!0,t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),e.insertAdjacentElement("afterend",t),t}function updateNewsletterFeedback(e,n){if(!n){e.hidden=!0,e.textContent="",e.className="";return}const t={success:"border-green-700/40 bg-green-950/40 text-green-100",info:"border-sky-700/40 bg-sky-950/40 text-sky-100",error:"border-red-700/40 bg-red-950/40 text-red-100"};e.hidden=!1,e.className=`mt-3 rounded-lg border px-4 py-3 text-sm ${t[n.tone]}`,e.innerHTML=`<strong class="block text-white">${n.title}</strong><span class="mt-1 block">${n.body}</span>`}function initializeContactForm(){const e=document.getElementById("contact-form");if(!e)return;const n=[{name:"name",validate:t=>t.trim().length>0},{name:"email",validate:t=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.trim())},{name:"message",validate:t=>t.trim().length>0}];n.forEach(({name:t})=>{const o=e.querySelector(`[name="${t}"]`);o&&o.addEventListener("input",()=>{o.classList.remove("border-red-400");const i=e.querySelector(`[data-error="${t}"]`);i&&i.classList.add("hidden")})}),e.addEventListener("submit",async t=>{t.preventDefault();let o=!0;if(n.forEach(({name:a,validate:s})=>{const l=e.querySelector(`[name="${a}"]`),d=e.querySelector(`[data-error="${a}"]`);l&&(s(l.value)?(l.classList.remove("border-red-400"),d&&d.classList.add("hidden")):(o=!1,l.classList.add("border-red-400"),d&&d.classList.remove("hidden")))}),!o)return;const i=e.querySelector('button[type="submit"]'),r=i.textContent;i.textContent="Sending...",i.disabled=!0;const c=document.getElementById("contact-error");c&&c.classList.add("hidden");try{const a=new FormData(e);if(!(await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(a).toString()})).ok)throw new Error("Submission failed");e.classList.add("hidden");const l=document.getElementById("contact-success");l&&(l.classList.remove("hidden"),window.lucide&&window.lucide.createIcons())}catch(a){i.textContent=r,i.disabled=!1,c&&c.classList.remove("hidden")}})}window.CompassConsult={scrollToElement,debounce,isInViewport,initializeMobileMenu,initializeRevealAnimations,hasCookieConsent,openCookiePreferences:()=>{window.CompassConsultCookieConsent&&window.CompassConsultCookieConsent.openPreferences()},getCookiePreferences:()=>readStoredCookieConsent()||buildCookieConsent()};
