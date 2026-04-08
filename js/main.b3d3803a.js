document.addEventListener("DOMContentLoaded",()=>{initializeCookieConsent(),initializeButtonIcons(),initializeIcons(),initializeYearAndDate(),initializeMobileMenu(),initializeAOSAnimations(),initializeSidebarEnhancements(),initializeStickyTalkButton(),initializeRevealAnimations(),initializeBioReadMore(),initializeInteractiveMotion(),initializeStaggeredCardReveal(),enhanceExternalLinks(),initializeComingSoonSocialLinks(),connectFormLabels(),optimizeImages(),initializeTickerImageFallback(),initializeSidebarScrollIndicator(),initializeNewsletterForm(),initializeContactForm(),registerServiceWorker()});const COOKIE_CONSENT_NAME="compass_cookie_preferences",COOKIE_CONSENT_MAX_AGE=3600*24*180;function initializeCookieConsent(){ensureCookieConsentStyles();const e=createCookieConsentUi();if(!e)return;const t=canonicalizePath(window.location.pathname)==="/pages/cookies.html";let o=readStoredCookieConsent();const i=a=>{const s=normalizeCookieConsent(a);e.form.elements.functional.checked=s.functional,e.form.elements.analytics.checked=s.analytics,e.form.elements.marketing.checked=s.marketing},n=()=>{e.overlay.hidden=!0,document.body.classList.remove("cc-cookie-lock")},r=()=>{i(o||buildCookieConsent()),e.overlay.hidden=!1,document.body.classList.add("cc-cookie-lock"),window.setTimeout(()=>{e.form.elements.functional.focus()},0)},c=a=>{o=saveCookieConsent(a),i(o),e.banner.hidden=!0,e.trigger.hidden=!t,n(),applyCookieConsent(o,!0)},l=()=>{const a=new FormData(e.form);return buildCookieConsent({functional:a.get("functional")==="on",analytics:a.get("analytics")==="on",marketing:a.get("marketing")==="on"})};e.bannerManageButton.addEventListener("click",r),e.trigger.addEventListener("click",r),e.overlay.addEventListener("click",a=>{(a.target===e.overlay||a.target.hasAttribute("data-cc-close"))&&n()}),document.addEventListener("keydown",a=>{a.key==="Escape"&&!e.overlay.hidden&&n()}),e.acceptButtons.forEach(a=>{a.addEventListener("click",()=>{c({functional:!0,analytics:!0,marketing:!0})})}),e.rejectButtons.forEach(a=>{a.addEventListener("click",()=>{c({functional:!1,analytics:!1,marketing:!1})})}),e.saveButton.addEventListener("click",()=>{c(l())}),bindCookiePreferenceTriggers(r),i(o||buildCookieConsent()),e.banner.hidden=!!o,e.trigger.hidden=!o||!t,applyCookieConsent(o||buildCookieConsent()),window.CompassConsultCookieConsent={getPreferences:()=>readStoredCookieConsent()||buildCookieConsent(),hasConsent:hasCookieConsent,openPreferences:r,savePreferences:a=>c(a)}}function ensureCookieConsentStyles(){if(document.getElementById("cc-cookie-styles"))return;const e=document.createElement("style");e.id="cc-cookie-styles",e.textContent=`
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
  `,document.head.appendChild(e)}function createCookieConsentUi(){const e=document.getElementById("cc-cookie-banner");if(e)return{banner:e,bannerManageButton:document.getElementById("cc-cookie-banner-manage"),trigger:document.getElementById("cc-cookie-trigger"),overlay:document.getElementById("cc-cookie-overlay"),form:document.getElementById("cc-cookie-form"),saveButton:document.getElementById("cc-cookie-save"),acceptButtons:Array.from(document.querySelectorAll("[data-cc-accept]")),rejectButtons:Array.from(document.querySelectorAll("[data-cc-reject]"))};const t=document.createElement("div");return t.innerHTML=['<section id="cc-cookie-banner" class="cc-cookie-banner" aria-label="Cookie notice">','  <div class="cc-cookie-banner-copy">','    <p class="cc-cookie-text"><span class="cc-cookie-inline-title">Cookies:</span> we use one essential cookie to remember your choice. Optional cookies only run if you opt in. <a href="/pages/cookies.html" class="cc-cookie-link">Cookie Policy</a>.</p>',"  </div>",'  <div class="cc-cookie-actions">','    <button type="button" id="cc-cookie-banner-manage" class="cc-cookie-button cc-cookie-button-ghost">Customise</button>','    <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-secondary">Reject optional</button>','    <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',"  </div>","</section>",'<button type="button" id="cc-cookie-trigger" class="cc-cookie-trigger">Cookie settings</button>','<div id="cc-cookie-overlay" class="cc-cookie-overlay" hidden>','  <div class="cc-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cc-cookie-panel-title">','    <div class="cc-cookie-panel-header">',"      <div>",'        <span class="cc-cookie-eyebrow" style="color:#483086;">Cookie settings</span>','        <h2 id="cc-cookie-panel-title" class="cc-cookie-panel-title">Choose which cookies to allow</h2>','        <p class="cc-cookie-panel-text">Essential cookies stay on so the website can function and remember this choice. Everything else is optional.</p>',"      </div>",'      <button type="button" class="cc-cookie-close" aria-label="Close cookie settings" data-cc-close>&times;</button>',"    </div>",'    <form id="cc-cookie-form">','      <div class="cc-cookie-options">','        <label class="cc-cookie-option">','          <input type="checkbox" checked disabled>',"          <span>","            <strong>Strictly necessary</strong>","            <p>Stores your consent choice and supports essential site functions such as forms and security controls.</p>","            <small>Always active</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="functional">',"          <span>","            <strong>Functional</strong>","            <p>Reserved for optional convenience features if we introduce them later. No non-essential functional cookies are set by default.</p>","            <small>Optional</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="analytics">',"          <span>","            <strong>Analytics</strong>","            <p>Allows future measurement scripts or deferred analytics embeds to load only after you opt in.</p>","            <small>Optional</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="marketing">',"          <span>","            <strong>Marketing</strong>","            <p>Allows future campaign or third-party marketing content to load only after you opt in.</p>","            <small>Optional</small>","          </span>","        </label>","      </div>","    </form>",'    <div class="cc-cookie-panel-actions">','      <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-ghost">Reject optional</button>','      <button type="button" id="cc-cookie-save" class="cc-cookie-button cc-cookie-button-secondary" style="background:#111827;color:#ffffff;">Save preferences</button>','      <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',"    </div>","  </div>","</div>"].join(""),document.body.appendChild(t),{banner:document.getElementById("cc-cookie-banner"),bannerManageButton:document.getElementById("cc-cookie-banner-manage"),trigger:document.getElementById("cc-cookie-trigger"),overlay:document.getElementById("cc-cookie-overlay"),form:document.getElementById("cc-cookie-form"),saveButton:document.getElementById("cc-cookie-save"),acceptButtons:Array.from(document.querySelectorAll("[data-cc-accept]")),rejectButtons:Array.from(document.querySelectorAll("[data-cc-reject]"))}}function applyCookieConsent(e,t=!1){const o=normalizeCookieConsent(e);document.documentElement.dataset.cookieFunctional=String(o.functional),document.documentElement.dataset.cookieAnalytics=String(o.analytics),document.documentElement.dataset.cookieMarketing=String(o.marketing),activateDeferredCookieAssets(o),deleteCookie("compass_last_page"),t&&document.dispatchEvent(new CustomEvent("compass:cookie-consent-updated",{detail:o}))}function activateDeferredCookieAssets(e){document.querySelectorAll("[data-cookie-category]").forEach(t=>{const o=t.getAttribute("data-cookie-category"),i=o==="essential"||!!e[o];if(t.tagName==="SCRIPT"){const n=t;if(!i||n.dataset.cookieActivated==="true"||n.type!=="text/plain")return;const r=document.createElement("script");Array.from(n.attributes).forEach(c=>{c.name==="type"||c.name.startsWith("data-cookie-")||r.setAttribute(c.name,c.value)}),n.dataset.cookieSrc?r.src=n.dataset.cookieSrc:r.textContent=n.textContent,n.dataset.cookieActivated="true",n.parentNode.insertBefore(r,n.nextSibling);return}if(t.tagName==="IFRAME"&&i){const n=t;n.dataset.cookieSrc&&n.getAttribute("src")!==n.dataset.cookieSrc&&n.setAttribute("src",n.dataset.cookieSrc)}})}function bindCookiePreferenceTriggers(e){document.querySelectorAll("[data-cookie-preferences]").forEach(t=>{t.dataset.cookiePreferencesBound!=="true"&&(t.dataset.cookiePreferencesBound="true",t.addEventListener("click",o=>{o.preventDefault(),e()}))})}function readStoredCookieConsent(){const e=readCookie(COOKIE_CONSENT_NAME);if(!e)return null;try{return normalizeCookieConsent(JSON.parse(e))}catch(t){return null}}function saveCookieConsent(e){const t=normalizeCookieConsent(e);return writeCookie(COOKIE_CONSENT_NAME,JSON.stringify(t),{maxAge:COOKIE_CONSENT_MAX_AGE}),t}function hasCookieConsent(e){if(e==="essential")return!0;const t=readStoredCookieConsent();return!!(t&&t[e])}function buildCookieConsent(e={}){return normalizeCookieConsent(e)}function normalizeCookieConsent(e={}){return{essential:!0,functional:!!e.functional,analytics:!!e.analytics,marketing:!!e.marketing,updatedAt:typeof e.updatedAt=="string"?e.updatedAt:new Date().toISOString()}}function readCookie(e){const t=`${e}=`,o=document.cookie.split(";").map(i=>i.trim()).find(i=>i.startsWith(t));return o?decodeURIComponent(o.slice(t.length)):""}function writeCookie(e,t,o={}){let i=`${e}=${encodeURIComponent(t)}; path=/; SameSite=Lax`;typeof o.maxAge=="number"&&(i+=`; max-age=${o.maxAge}`),window.location.protocol==="https:"&&(i+="; Secure"),document.cookie=i}function deleteCookie(e){document.cookie=`${e}=; path=/; max-age=0; SameSite=Lax`}function canonicalizePath(e){return!e||e==="/"?"/index.html":e}function initializeButtonIcons(){document.querySelectorAll("button").forEach(e=>{if(e.dataset.iconEnhanced==="true"||e.classList.contains("calendar-nav-button")||e.querySelector("svg, i[data-lucide]"))return;const t=e.textContent.trim();if(!t)return;const o=getButtonIconName(e,t),i=document.createElement("span");for(i.className="button-label";e.firstChild;)i.appendChild(e.firstChild);const n=document.createElement("i");n.setAttribute("data-lucide",o),n.setAttribute("aria-hidden","true"),n.className="button-auto-icon w-4 h-4 shrink-0",e.classList.add("button-with-icon"),e.append(i,n),e.dataset.iconEnhanced="true"})}function getButtonIconName(e,t){const o=`${t} ${e.getAttribute("aria-label")||""}`.toLowerCase();return o.includes("subscribe")||o.includes("email")||o.includes("mail")||o.includes("send")||o.includes("message")||o.includes("contact")?"mail":o.includes("call")||o.includes("phone")?"phone":o.includes("location")||o.includes("address")||o.includes("map")||o.includes("directions")?"map-pin":o.includes("download")?"download":o.includes("sort")||o.includes("order")?"arrow-up-down":o.includes("calendar")?"calendar":"arrow-right"}function initializeComingSoonSocialLinks(){const e='<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>';document.querySelectorAll("footer .flex.space-x-4").forEach(o=>{if(o.querySelectorAll('a[href="#"]').forEach(n=>{n.remove()}),o.querySelector('a[href^="mailto:"]'))return;const i=document.createElement("a");i.href="mailto:enquiries@compassconsultes.co.uk",i.setAttribute("aria-label","Email Compass Consult"),i.setAttribute("title","Email Compass Consult"),i.className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-compass-teal hover:text-white transition-all hover:-translate-y-1",i.innerHTML=e,o.appendChild(i)})}function initializeAOSAnimations(){!window.AOS||typeof window.AOS.init!="function"||(window.AOS.init({duration:650,easing:"ease-out-cubic",once:!0,offset:24}),window.addEventListener("load",()=>{typeof window.AOS.refreshHard=="function"&&window.AOS.refreshHard()}))}function initializeSidebarEnhancements(){const e=document.querySelectorAll("aside.hidden.lg\\:flex");if(!e.length)return;const t=window.matchMedia("(min-width: 1024px)");e.forEach(o=>{const i=o.querySelector('a[href="/pages/contact.html"]');if(!i)return;o.classList.add("sidebar-standard"),o.classList.remove("p-8","justify-between");const n=Array.from(o.children).filter(u=>u.tagName&&u.tagName.toLowerCase()==="div"),r=i.closest("div"),c=n.find(u=>u!==r),l=c||o;c&&c.parentElement===o&&c.classList.add("sidebar-main"),r&&r.parentElement===o&&r.classList.add("sidebar-cta");const a=i.querySelector('i[data-lucide="arrow-right"]');a&&a.classList.add("transition-transform");let s=o.querySelector(".sidebar-scroll-hint");s||(s=document.createElement("p"),s.className="sidebar-scroll-hint",s.innerHTML='<svg aria-hidden="true" focusable="false" class="sidebar-scroll-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg><span>Scroll for more</span>',r&&r.parentElement===o?o.insertBefore(s,r):o.appendChild(s));const d=()=>{const u=l.scrollHeight>l.clientHeight+8,m=u?l.scrollTop+l.clientHeight>=l.scrollHeight-12:!0,f=t.matches&&u&&!m;s.classList.toggle("is-visible",f)};l.addEventListener("scroll",d,{passive:!0}),window.addEventListener("resize",d),typeof t.addEventListener=="function"?t.addEventListener("change",d):typeof t.addListener=="function"&&t.addListener(d),d()})}function initializeStickyTalkButton(){if(document.querySelector(".sticky-talk-button"))return;const t=window.location.pathname.toLowerCase();if(t.endsWith("/contact.html")||t==="/contact.html")return;const i=t.endsWith("/index.html")||t==="/"||t==="/index.html",n=document.createElement("a");if(n.href="/pages/contact.html",n.className=`sticky-talk-button${i?" is-hidden":""}`,n.setAttribute("aria-label","Talk to Compass Consult"),n.setAttribute("title","Talk to us"),n.innerHTML=['<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">','<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"></path>',"</svg>","<span>Talk to Us</span>"].join(""),document.body.appendChild(n),i){const c=()=>{const l=window.scrollY>24;n.classList.toggle("is-hidden",!l)};c(),window.addEventListener("scroll",c,{passive:!0})}const r=document.querySelector("footer");r&&new IntersectionObserver(([l])=>{n.classList.toggle("is-lifted",l.isIntersecting),n.classList.toggle("is-footer-hidden",l.isIntersecting)},{threshold:.05}).observe(r)}function initializeIcons(){window.lucide&&typeof window.lucide.createIcons=="function"&&window.lucide.createIcons()}function initializeYearAndDate(){const e=new Date().getFullYear();document.querySelectorAll(".year-span").forEach(i=>{i.textContent=String(e)});const t=document.getElementById("year");t&&(t.textContent=String(e));const o=document.getElementById("date");o&&!o.textContent.trim()&&(o.textContent=new Date().toLocaleDateString())}function initializeMobileMenu(){const e=document.getElementById("mobile-menu-btn"),t=document.getElementById("mobile-menu");if(!e||!t)return;t.id||(t.id="mobile-menu"),e.getAttribute("type")||e.setAttribute("type","button"),e.getAttribute("aria-label")||e.setAttribute("aria-label","Toggle mobile menu"),e.setAttribute("aria-controls",t.id),e.setAttribute("aria-expanded","false"),t.classList.remove("hidden"),t.hidden=!1;const o=()=>{e.querySelector(".hamburger-icon")||(e.innerHTML=['<span class="hamburger-icon" aria-hidden="true">','<span class="bar"></span>','<span class="bar"></span>','<span class="bar"></span>',"</span>"].join(""))},i=r=>{t.classList.toggle("menu-open",r),e.setAttribute("aria-expanded",String(r)),e.setAttribute("aria-label",r?"Close mobile menu":"Open mobile menu"),e.classList.toggle("menu-open-state",r),document.body.classList.toggle("menu-open",r)};o(),i(!1);const n=()=>{const r=t.classList.contains("menu-open");i(!r)};e.addEventListener("click",n),t.querySelectorAll("a").forEach(r=>{r.addEventListener("click",()=>i(!1))}),document.addEventListener("keydown",r=>{r.key==="Escape"&&i(!1)}),document.addEventListener("click",r=>{t.classList.contains("menu-open")&&!t.contains(r.target)&&!e.contains(r.target)&&i(!1)}),window.addEventListener("resize",()=>{window.innerWidth>=1024&&i(!1)})}function initializeRevealAnimations(){const e=document.querySelectorAll(".reveal");if(!e.length)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.forEach(i=>i.classList.add("active"));return}if(!("IntersectionObserver"in window)){e.forEach(i=>i.classList.add("active"));return}const o=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(n.target.classList.add("active"),o.unobserve(n.target))})},{threshold:.1});e.forEach(i=>o.observe(i))}function initializeBioReadMore(){document.querySelectorAll('[id$="-bio"]').forEach(t=>{const o=t.id.replace("-bio",""),i=document.getElementById(`${o}-read-more-btn`),n=document.getElementById(`${o}-bio-full`),r=document.getElementById(`${o}-bio-summary`);if(!i||!n||!r)return;i.setAttribute("aria-controls",`${o}-bio-full`);const c=n.classList.contains("show");i.setAttribute("aria-expanded",String(c)),n.setAttribute("aria-hidden",String(!c)),n.style.overflow="hidden",n.style.maxHeight=c?`${n.scrollHeight}px`:"0px",r.hidden=c,i.classList.add("interactive-anim","interactive-anim--text");const l=()=>{n.classList.contains("show")&&(n.style.maxHeight=`${n.scrollHeight}px`)};window.addEventListener("resize",debounce(l,120)),i.addEventListener("click",()=>{const a=n.classList.toggle("show");n.style.maxHeight=a?`${n.scrollHeight}px`:"0px",n.setAttribute("aria-hidden",String(!a)),r.hidden=a,i.textContent=a?"Read Less":"Read More",i.setAttribute("aria-expanded",String(a))})})}function initializeInteractiveMotion(){document.querySelectorAll(["a[href]","button",'[role="button"]','input[type="submit"]','input[type="button"]',".event-card-toggle",'[id$="-read-more-btn"]'].join(",")).forEach(t=>{if(t.classList.contains("interactive-anim"))return;t.classList.add("interactive-anim");const o=getMotionTone(t);t.classList.add(`interactive-tone-${o}`),t.matches('button, input[type="submit"], input[type="button"], a[class*="btn"], a.rounded-full')?t.classList.add("interactive-anim--button"):t.matches("#mobile-menu a, .nav-link")?t.classList.add("interactive-anim--menu"):t.matches("a[href]")&&t.classList.add("interactive-anim--link"),t.matches('[id$="-read-more-btn"], .event-card-toggle')&&t.classList.add("interactive-anim--text"),t.addEventListener("pointerdown",()=>{t.classList.add("is-pressed")});const i=()=>t.classList.remove("is-pressed");t.addEventListener("pointerup",i),t.addEventListener("pointercancel",i),t.addEventListener("pointerleave",i),t.addEventListener("blur",i)}),document.querySelectorAll(".event-card").forEach(t=>{t.classList.add("interactive-card"),t.classList.add(`motion-tone-${getMotionTone(t)}`)}),document.querySelectorAll("input, select, textarea").forEach(t=>{t.classList.add("interactive-form-control")})}function initializeStaggeredCardReveal(){const e=[".event-card","section .rounded-2xl","section article.rounded-xl","section .shadow-md",".interactive-card"].join(","),t=Array.from(new Set(Array.from(document.querySelectorAll(e))));if(!t.length)return;const o=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(t.forEach(n=>{n.classList.add("motion-enter");const r=getMotionTone(n);n.classList.add(`motion-tone-${r}`);const c=n.closest("section"),l=c?Array.from(c.querySelectorAll(e)):t,a=Math.max(0,l.indexOf(n)),s=r==="dramatic"?1.2:r==="restrained"?.85:1,d=Math.round(Math.min(a,7)*65*s);n.style.setProperty("--motion-enter-delay",`${d}ms`)}),o||!("IntersectionObserver"in window)){t.forEach(n=>n.classList.add("is-in-view"));return}const i=new IntersectionObserver(n=>{n.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-in-view"),i.unobserve(r.target))})},{threshold:.16,rootMargin:"0px 0px -6% 0px"});t.forEach(n=>i.observe(n))}function getMotionTone(e){const t=e.closest("section, header, footer, nav, aside, main");if(!t)return"balanced";const o=t.tagName.toLowerCase(),i=(t.className||"").toLowerCase();return o==="footer"||o==="nav"||o==="aside"?"restrained":i.includes("bg-compass-dark")||i.includes("hero")||i.includes("gradient")||i.includes("animate-blob")?"dramatic":"balanced"}function enhanceExternalLinks(){document.querySelectorAll('a[target="_blank"]').forEach(o=>{const i=new Set((o.getAttribute("rel")||"").split(/\s+/).filter(Boolean));if(i.add("noopener"),i.add("noreferrer"),o.setAttribute("rel",Array.from(i).join(" ")),!o.getAttribute("aria-label")&&!o.textContent.trim()){const n=o.getAttribute("href")||"";let r="External link";n.startsWith("mailto:")?r="Email link":n.includes("linkedin.com")?r="LinkedIn profile":n.includes("facebook.com")&&(r="Facebook profile"),o.setAttribute("aria-label",r),o.setAttribute("title",r)}else!o.getAttribute("title")&&o.getAttribute("aria-label")&&o.setAttribute("title",o.getAttribute("aria-label"))}),document.querySelectorAll("a").forEach(o=>{if(o.getAttribute("aria-label")){o.getAttribute("title")||o.setAttribute("title",o.getAttribute("aria-label"));return}const i=o.textContent.trim().length>0,n=!!o.querySelector("i, svg");if(i||!n)return;const r=o.getAttribute("href")||"";let c="Link";r.includes("linkedin.com")?c="LinkedIn":r.includes("facebook.com")?c="Facebook":r.includes("x.com")||r.includes("twitter.com")?c="X profile":r.startsWith("mailto:")?c="Email":r==="#"&&(c="Social profile"),o.setAttribute("aria-label",c),o.setAttribute("title",c)})}function connectFormLabels(){document.querySelectorAll("form").forEach((t,o)=>{t.querySelectorAll("label").forEach((n,r)=>{if(n.getAttribute("for"))return;const c=n.parentElement?n.parentElement.querySelector("input, select, textarea"):null;c&&(c.id||(c.id=`form-${o}-field-${r}`),n.setAttribute("for",c.id),c.getAttribute("aria-label")||c.setAttribute("aria-label",n.textContent.trim()),c.getAttribute("title")||c.setAttribute("title",n.textContent.trim()))})})}function optimizeImages(){document.querySelectorAll("img").forEach((t,o)=>{t.hasAttribute("decoding")||t.setAttribute("decoding","async"),!t.hasAttribute("loading")&&o>2&&t.setAttribute("loading","lazy"),t.closest(".ticker-track")&&(t.setAttribute("loading","lazy"),t.setAttribute("fetchpriority","low"))})}function initializeTickerImageFallback(){document.querySelectorAll(".ticker-track img").forEach(e=>{e.addEventListener("error",()=>{e.src="/assets/logos/optimized/Logo-320.webp",e.style.maxHeight="100px"})})}function registerServiceWorker(){"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}function scrollToElement(e){const t=document.querySelector(e);t&&t.scrollIntoView({behavior:"smooth"})}function debounce(e,t){let o;return function(...n){clearTimeout(o),o=setTimeout(()=>{e(...n)},t)}}function isInViewport(e){const t=e.getBoundingClientRect();return t.top>=0&&t.left>=0&&t.bottom<=(window.innerHeight||document.documentElement.clientHeight)&&t.right<=(window.innerWidth||document.documentElement.clientWidth)}function initializeSidebarScrollIndicator(){const e=document.getElementById("sidebar-scroll-area"),t=document.getElementById("sidebar-scroll-indicator");if(!e||!t)return;const o=()=>{const i=e.scrollTop+e.clientHeight>=e.scrollHeight-4;t.style.opacity=i?"0":"1"};o(),e.addEventListener("scroll",o,{passive:!0})}function initializeNewsletterForm(){const e=document.querySelectorAll('form[name="newsletter-subscribe"]');e.length&&e.forEach(t=>{t.setAttribute("action","/api/subscribers"),t.setAttribute("method","POST");const o=ensureNewsletterFeedbackElement(t);t.addEventListener("submit",async i=>{i.preventDefault();const n=t.querySelector('input[name="email"]'),r=t.querySelector('button[type="submit"]');if(!n||!r)return;const c=n.value.trim();if(!c||!n.checkValidity()){n.reportValidity();return}const l=r.textContent;r.textContent="Subscribing...",r.disabled=!0,updateNewsletterFeedback(o,null);try{const a=await fetch("/api/subscribers",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({email:c})}),s=await a.json().catch(()=>null);if(!a.ok)throw new Error(s&&s.error?s.error:"Subscription failed.");t.reset(),r.textContent=l,r.disabled=!1,updateNewsletterFeedback(o,s&&s.message==="Already subscribed"?{tone:"info",title:"Already subscribed.",body:"That email address is already on the Compass Consult newsletter list."}:{tone:"success",title:"Thanks for subscribing.",body:"You have been added to the Compass Consult newsletter list."})}catch(a){r.textContent=l,r.disabled=!1,updateNewsletterFeedback(o,{tone:"error",title:"Subscription failed.",body:a instanceof Error?a.message:"Please try again in a moment."})}})})}function ensureNewsletterFeedbackElement(e){const t=e.nextElementSibling;if(t&&t instanceof HTMLDivElement&&t.dataset.newsletterFeedback==="true")return t;const o=document.createElement("div");return o.dataset.newsletterFeedback="true",o.hidden=!0,o.setAttribute("role","status"),o.setAttribute("aria-live","polite"),e.insertAdjacentElement("afterend",o),o}function updateNewsletterFeedback(e,t){if(!t){e.hidden=!0,e.textContent="",e.className="";return}const o={success:"border-green-700/40 bg-green-950/40 text-green-100",info:"border-sky-700/40 bg-sky-950/40 text-sky-100",error:"border-red-700/40 bg-red-950/40 text-red-100"};e.hidden=!1,e.className=`mt-3 rounded-lg border px-4 py-3 text-sm ${o[t.tone]}`,e.innerHTML=`<strong class="block text-white">${t.title}</strong><span class="mt-1 block">${t.body}</span>`}function initializeContactForm(){const e=document.getElementById("contact-form");if(!e)return;const t=[{name:"name",validate:o=>o.trim().length>0},{name:"email",validate:o=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.trim())},{name:"message",validate:o=>o.trim().length>0}];t.forEach(({name:o})=>{const i=e.querySelector(`[name="${o}"]`);i&&i.addEventListener("input",()=>{i.classList.remove("border-red-400");const n=e.querySelector(`[data-error="${o}"]`);n&&n.classList.add("hidden")})}),e.addEventListener("submit",async o=>{o.preventDefault();let i=!0;if(t.forEach(({name:l,validate:a})=>{const s=e.querySelector(`[name="${l}"]`),d=e.querySelector(`[data-error="${l}"]`);s&&(a(s.value)?(s.classList.remove("border-red-400"),d&&d.classList.add("hidden")):(i=!1,s.classList.add("border-red-400"),d&&d.classList.remove("hidden")))}),!i)return;const n=e.querySelector('button[type="submit"]'),r=n.textContent;n.textContent="Sending...",n.disabled=!0;const c=document.getElementById("contact-error");c&&c.classList.add("hidden");try{const l=new FormData(e);if(!(await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(l).toString()})).ok)throw new Error("Submission failed");e.classList.add("hidden");const s=document.getElementById("contact-success");s&&(s.classList.remove("hidden"),window.lucide&&window.lucide.createIcons())}catch(l){n.textContent=r,n.disabled=!1,c&&c.classList.remove("hidden")}})}window.CompassConsult={scrollToElement,debounce,isInViewport,initializeMobileMenu,initializeRevealAnimations,hasCookieConsent,openCookiePreferences:()=>{window.CompassConsultCookieConsent&&window.CompassConsultCookieConsent.openPreferences()},getCookiePreferences:()=>readStoredCookieConsent()||buildCookieConsent()};
