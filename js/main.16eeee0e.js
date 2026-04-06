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
 */document.addEventListener("DOMContentLoaded",()=>{initializeCookieConsent(),initializeButtonIcons(),initializeIcons(),initializeYearAndDate(),initializeMobileMenu(),initializeAOSAnimations(),initializeSidebarEnhancements(),initializeStickyTalkButton(),initializeRevealAnimations(),initializeBioReadMore(),initializeInteractiveMotion(),initializeStaggeredCardReveal(),enhanceExternalLinks(),initializeComingSoonSocialLinks(),connectFormLabels(),optimizeImages(),initializeTickerImageFallback(),initializeSidebarScrollIndicator(),initializeNewsletterForm(),initializeContactForm(),registerServiceWorker()});const COOKIE_CONSENT_NAME="compass_cookie_preferences",COOKIE_LAST_PAGE_NAME="compass_last_page",COOKIE_CONSENT_MAX_AGE=3600*24*180,COOKIE_HISTORY_MAX_AGE=3600*24*30;function initializeCookieConsent(){ensureCookieConsentStyles();const t=createCookieConsentUi();if(!t)return;const e=canonicalizePath(window.location.pathname)==="/pages/cookies.html";let o=readStoredCookieConsent();const i=a=>{const l=normalizeCookieConsent(a);t.form.elements.functional.checked=l.functional,t.form.elements.analytics.checked=l.analytics,t.form.elements.marketing.checked=l.marketing},n=()=>{t.overlay.hidden=!0,document.body.classList.remove("cc-cookie-lock")},c=()=>{i(o||buildCookieConsent()),t.overlay.hidden=!1,document.body.classList.add("cc-cookie-lock"),window.setTimeout(()=>{t.form.elements.functional.focus()},0)},r=a=>{o=saveCookieConsent(a),i(o),t.banner.hidden=!0,t.trigger.hidden=!e,n(),applyCookieConsent(o,!0)},s=()=>{const a=new FormData(t.form);return buildCookieConsent({functional:a.get("functional")==="on",analytics:a.get("analytics")==="on",marketing:a.get("marketing")==="on"})};t.bannerManageButton.addEventListener("click",c),t.trigger.addEventListener("click",c),t.overlay.addEventListener("click",a=>{(a.target===t.overlay||a.target.hasAttribute("data-cc-close"))&&n()}),document.addEventListener("keydown",a=>{a.key==="Escape"&&!t.overlay.hidden&&n()}),t.acceptButtons.forEach(a=>{a.addEventListener("click",()=>{r({functional:!0,analytics:!0,marketing:!0})})}),t.rejectButtons.forEach(a=>{a.addEventListener("click",()=>{r({functional:!1,analytics:!1,marketing:!1})})}),t.saveButton.addEventListener("click",()=>{r(s())}),bindCookiePreferenceTriggers(c),i(o||buildCookieConsent()),t.banner.hidden=!!o,t.trigger.hidden=!o||!e,applyCookieConsent(o||buildCookieConsent()),window.CompassConsultCookieConsent={getPreferences:()=>readStoredCookieConsent()||buildCookieConsent(),hasConsent:hasCookieConsent,openPreferences:c,savePreferences:a=>r(a)}}function ensureCookieConsentStyles(){if(document.getElementById("cc-cookie-styles"))return;const t=document.createElement("style");t.id="cc-cookie-styles",t.textContent=`
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
    }
    .cc-cookie-overlay {
      position: fixed;
      inset: 0;
      z-index: 95;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.45);
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
        padding: 0.85rem;
      }
      .cc-cookie-trigger {
        top: 5.75rem;
        right: 0.75rem;
      }
      .cc-cookie-panel {
        padding: 1.1rem;
      }
      .cc-cookie-button {
        width: 100%;
        justify-content: center;
      }
    }
  `,document.head.appendChild(t)}function createCookieConsentUi(){const t=document.getElementById("cc-cookie-banner");if(t)return{banner:t,bannerManageButton:document.getElementById("cc-cookie-banner-manage"),trigger:document.getElementById("cc-cookie-trigger"),overlay:document.getElementById("cc-cookie-overlay"),form:document.getElementById("cc-cookie-form"),saveButton:document.getElementById("cc-cookie-save"),acceptButtons:Array.from(document.querySelectorAll("[data-cc-accept]")),rejectButtons:Array.from(document.querySelectorAll("[data-cc-reject]"))};const e=document.createElement("div");return e.innerHTML=['<section id="cc-cookie-banner" class="cc-cookie-banner" aria-label="Cookie notice">','  <div class="cc-cookie-banner-copy">','    <p class="cc-cookie-text"><span class="cc-cookie-inline-title">Cookies:</span> we use one essential cookie to remember your choice. Optional cookies only run if you opt in. <a href="/pages/cookies.html" class="cc-cookie-link">Cookie Policy</a>.</p>',"  </div>",'  <div class="cc-cookie-actions">','    <button type="button" id="cc-cookie-banner-manage" class="cc-cookie-button cc-cookie-button-ghost">Customise</button>','    <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-secondary">Reject optional</button>','    <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',"  </div>","</section>",'<button type="button" id="cc-cookie-trigger" class="cc-cookie-trigger">Cookie settings</button>','<div id="cc-cookie-overlay" class="cc-cookie-overlay" hidden>','  <div class="cc-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cc-cookie-panel-title">','    <div class="cc-cookie-panel-header">',"      <div>",'        <span class="cc-cookie-eyebrow" style="color:#483086;">Cookie settings</span>','        <h2 id="cc-cookie-panel-title" class="cc-cookie-panel-title">Choose which cookies to allow</h2>','        <p class="cc-cookie-panel-text">Essential cookies stay on so the website can function and remember this choice. Everything else is optional.</p>',"      </div>",'      <button type="button" class="cc-cookie-close" aria-label="Close cookie settings" data-cc-close>&times;</button>',"    </div>",'    <form id="cc-cookie-form">','      <div class="cc-cookie-options">','        <label class="cc-cookie-option">','          <input type="checkbox" checked disabled>',"          <span>","            <strong>Strictly necessary</strong>","            <p>Stores your consent choice and supports essential site functions such as forms and security controls.</p>","            <small>Always active</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="functional">',"          <span>","            <strong>Functional</strong>","            <p>Remembers the last page you viewed so the site can offer a quick return link as you move around.</p>","            <small>Optional</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="analytics">',"          <span>","            <strong>Analytics</strong>","            <p>Allows future measurement scripts or deferred analytics embeds to load only after you opt in.</p>","            <small>Optional</small>","          </span>","        </label>",'        <label class="cc-cookie-option">','          <input type="checkbox" name="marketing">',"          <span>","            <strong>Marketing</strong>","            <p>Allows future campaign or third-party marketing content to load only after you opt in.</p>","            <small>Optional</small>","          </span>","        </label>","      </div>","    </form>",'    <div class="cc-cookie-panel-actions">','      <button type="button" data-cc-reject class="cc-cookie-button cc-cookie-button-ghost">Reject optional</button>','      <button type="button" id="cc-cookie-save" class="cc-cookie-button cc-cookie-button-secondary" style="background:#111827;color:#ffffff;">Save preferences</button>','      <button type="button" data-cc-accept class="cc-cookie-button cc-cookie-button-primary">Accept all</button>',"    </div>","  </div>","</div>"].join(""),document.body.appendChild(e),{banner:document.getElementById("cc-cookie-banner"),bannerManageButton:document.getElementById("cc-cookie-banner-manage"),trigger:document.getElementById("cc-cookie-trigger"),overlay:document.getElementById("cc-cookie-overlay"),form:document.getElementById("cc-cookie-form"),saveButton:document.getElementById("cc-cookie-save"),acceptButtons:Array.from(document.querySelectorAll("[data-cc-accept]")),rejectButtons:Array.from(document.querySelectorAll("[data-cc-reject]"))}}function applyCookieConsent(t,e=!1){const o=normalizeCookieConsent(t);document.documentElement.dataset.cookieFunctional=String(o.functional),document.documentElement.dataset.cookieAnalytics=String(o.analytics),document.documentElement.dataset.cookieMarketing=String(o.marketing),activateDeferredCookieAssets(o),updateRecentPageNavigation(o),e&&document.dispatchEvent(new CustomEvent("compass:cookie-consent-updated",{detail:o}))}function activateDeferredCookieAssets(t){document.querySelectorAll("[data-cookie-category]").forEach(e=>{const o=e.getAttribute("data-cookie-category"),i=o==="essential"||!!t[o];if(e.tagName==="SCRIPT"){const n=e;if(!i||n.dataset.cookieActivated==="true"||n.type!=="text/plain")return;const c=document.createElement("script");Array.from(n.attributes).forEach(r=>{r.name==="type"||r.name.startsWith("data-cookie-")||c.setAttribute(r.name,r.value)}),n.dataset.cookieSrc?c.src=n.dataset.cookieSrc:c.textContent=n.textContent,n.dataset.cookieActivated="true",n.parentNode.insertBefore(c,n.nextSibling);return}if(e.tagName==="IFRAME"&&i){const n=e;n.dataset.cookieSrc&&n.getAttribute("src")!==n.dataset.cookieSrc&&n.setAttribute("src",n.dataset.cookieSrc)}})}function updateRecentPageNavigation(t){if(document.querySelectorAll("[data-cookie-history-link]").forEach(i=>i.remove()),!t.functional){deleteCookie(COOKIE_LAST_PAGE_NAME);return}const e=readStoredRecentPage(),o=canonicalizePath(window.location.pathname);e&&canonicalizePath(e.path)!==o&&(injectRecentPageLink(e,"desktop"),injectRecentPageLink(e,"mobile"),window.lucide&&typeof window.lucide.createIcons=="function"&&window.lucide.createIcons()),writeCookie(COOKIE_LAST_PAGE_NAME,JSON.stringify({path:o,title:getPageTitleForCookie()}),{maxAge:COOKIE_HISTORY_MAX_AGE})}function injectRecentPageLink(t,e){const o=e==="desktop"?document.querySelector("aside.hidden.lg\\:flex nav"):document.querySelector("#mobile-menu > div");if(!o||!t.path||!t.title)return;const i=document.createElement("a");if(i.href=t.path,i.dataset.cookieHistoryLink="true",i.title=`Resume from ${t.title}`,i.className=e==="desktop"?"nav-link flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-semibold transition-all text-gray-600 hover:bg-gray-50 hover:text-compass-purple":"flex items-center gap-2 py-2 px-3 text-gray-700 hover:text-compass-purple",i.innerHTML=`<i data-lucide="history" class="w-4 h-4 shrink-0"></i>Resume: ${escapeHtml(truncateText(t.title,28))}`,e==="desktop"){o.appendChild(i);return}const n=o.querySelector('a[href="/pages/contact.html"]');n?o.insertBefore(i,n):o.appendChild(i)}function bindCookiePreferenceTriggers(t){document.querySelectorAll("[data-cookie-preferences]").forEach(e=>{e.dataset.cookiePreferencesBound!=="true"&&(e.dataset.cookiePreferencesBound="true",e.addEventListener("click",o=>{o.preventDefault(),t()}))})}function readStoredCookieConsent(){const t=readCookie(COOKIE_CONSENT_NAME);if(!t)return null;try{return normalizeCookieConsent(JSON.parse(t))}catch{return null}}function saveCookieConsent(t){const e=normalizeCookieConsent(t);return writeCookie(COOKIE_CONSENT_NAME,JSON.stringify(e),{maxAge:COOKIE_CONSENT_MAX_AGE}),e}function hasCookieConsent(t){if(t==="essential")return!0;const e=readStoredCookieConsent();return!!(e&&e[t])}function buildCookieConsent(t={}){return normalizeCookieConsent(t)}function normalizeCookieConsent(t={}){return{essential:!0,functional:!!t.functional,analytics:!!t.analytics,marketing:!!t.marketing,updatedAt:typeof t.updatedAt=="string"?t.updatedAt:new Date().toISOString()}}function readStoredRecentPage(){const t=readCookie(COOKIE_LAST_PAGE_NAME);if(!t)return null;try{const e=JSON.parse(t);return!e||typeof e.path!="string"||typeof e.title!="string"?null:{path:e.path,title:e.title}}catch{return null}}function readCookie(t){const e=`${t}=`,o=document.cookie.split(";").map(i=>i.trim()).find(i=>i.startsWith(e));return o?decodeURIComponent(o.slice(e.length)):""}function writeCookie(t,e,o={}){let i=`${t}=${encodeURIComponent(e)}; path=/; SameSite=Lax`;typeof o.maxAge=="number"&&(i+=`; max-age=${o.maxAge}`),window.location.protocol==="https:"&&(i+="; Secure"),document.cookie=i}function deleteCookie(t){document.cookie=`${t}=; path=/; max-age=0; SameSite=Lax`}function getPageTitleForCookie(){return document.title.replace(/\s*-\s*Compass Consult\s*$/i,"").trim()||"Compass Consult"}function canonicalizePath(t){return!t||t==="/"?"/index.html":t}function escapeHtml(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function truncateText(t,e){return t.length<=e?t:`${t.slice(0,e-1).trimEnd()}...`}function initializeButtonIcons(){document.querySelectorAll("button").forEach(t=>{if(t.dataset.iconEnhanced==="true"||t.classList.contains("calendar-nav-button")||t.querySelector("svg, i[data-lucide]"))return;const e=t.textContent.trim();if(!e)return;const o=getButtonIconName(t,e),i=document.createElement("span");for(i.className="button-label";t.firstChild;)i.appendChild(t.firstChild);const n=document.createElement("i");n.setAttribute("data-lucide",o),n.setAttribute("aria-hidden","true"),n.className="button-auto-icon w-4 h-4 shrink-0",t.classList.add("button-with-icon"),t.append(i,n),t.dataset.iconEnhanced="true"})}function getButtonIconName(t,e){const o=`${e} ${t.getAttribute("aria-label")||""}`.toLowerCase();return o.includes("subscribe")||o.includes("email")||o.includes("mail")||o.includes("send")||o.includes("message")||o.includes("contact")?"mail":o.includes("call")||o.includes("phone")?"phone":o.includes("location")||o.includes("address")||o.includes("map")||o.includes("directions")?"map-pin":o.includes("download")?"download":o.includes("sort")||o.includes("order")?"arrow-up-down":o.includes("calendar")?"calendar":"arrow-right"}function initializeComingSoonSocialLinks(){const t=document.querySelectorAll('a[href="#"][aria-label="Social profile"]');let e=null,o=null;const i=()=>e||(e=document.createElement("div"),e.className="coming-soon-tooltip",e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),e.textContent="Coming soon",document.body.appendChild(e),e),n=c=>{const r=i(),s=c.getBoundingClientRect(),a=window.scrollY+s.top-10,l=window.scrollX+s.left+s.width/2;r.style.top=`${a}px`,r.style.left=`${l}px`,r.classList.add("show"),o&&window.clearTimeout(o),o=window.setTimeout(()=>{r.classList.remove("show")},1200)};t.forEach(c=>{c.addEventListener("click",r=>{r.preventDefault(),n(c)})})}function initializeAOSAnimations(){!window.AOS||typeof window.AOS.init!="function"||(window.AOS.init({duration:650,easing:"ease-out-cubic",once:!0,offset:24}),window.addEventListener("load",()=>{typeof window.AOS.refreshHard=="function"&&window.AOS.refreshHard()}))}function initializeSidebarEnhancements(){const t=document.querySelectorAll("aside.hidden.lg\\:flex");if(!t.length)return;const e=window.matchMedia("(min-width: 1024px)");t.forEach(o=>{const i=o.querySelector('a[href="/pages/contact.html"]');if(!i)return;o.classList.add("sidebar-standard"),o.classList.remove("p-8","justify-between");const n=Array.from(o.children).filter(u=>u.tagName&&u.tagName.toLowerCase()==="div"),c=i.closest("div"),r=n.find(u=>u!==c),s=r||o;r&&r.parentElement===o&&r.classList.add("sidebar-main"),c&&c.parentElement===o&&c.classList.add("sidebar-cta");const a=i.querySelector('i[data-lucide="arrow-right"]');a&&a.classList.add("transition-transform");let l=o.querySelector(".sidebar-scroll-hint");l||(l=document.createElement("p"),l.className="sidebar-scroll-hint",l.innerHTML='<svg aria-hidden="true" focusable="false" class="sidebar-scroll-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg><span>Scroll for more</span>',c&&c.parentElement===o?o.insertBefore(l,c):o.appendChild(l));const d=()=>{const u=s.scrollHeight>s.clientHeight+8,m=u?s.scrollTop+s.clientHeight>=s.scrollHeight-12:!0,f=e.matches&&u&&!m;l.classList.toggle("is-visible",f)};s.addEventListener("scroll",d,{passive:!0}),window.addEventListener("resize",d),typeof e.addEventListener=="function"?e.addEventListener("change",d):typeof e.addListener=="function"&&e.addListener(d),d()})}function initializeStickyTalkButton(){if(document.querySelector(".sticky-talk-button"))return;const e=window.location.pathname.toLowerCase();if(e.endsWith("/contact.html")||e==="/contact.html")return;const i=e.endsWith("/index.html")||e==="/"||e==="/index.html",n=document.createElement("a");if(n.href="/pages/contact.html",n.className=`sticky-talk-button${i?" is-hidden":""}`,n.setAttribute("aria-label","Talk to Compass Consult"),n.setAttribute("title","Talk to us"),n.innerHTML=['<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">','<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"></path>',"</svg>","<span>Talk to Us</span>"].join(""),document.body.appendChild(n),i){const r=()=>{const s=window.scrollY>24;n.classList.toggle("is-hidden",!s)};r(),window.addEventListener("scroll",r,{passive:!0})}const c=document.querySelector("footer");c&&new IntersectionObserver(([s])=>{n.classList.toggle("is-lifted",s.isIntersecting),n.classList.toggle("is-footer-hidden",s.isIntersecting)},{threshold:.05}).observe(c)}function initializeIcons(){window.lucide&&typeof window.lucide.createIcons=="function"&&window.lucide.createIcons()}function initializeYearAndDate(){const t=new Date().getFullYear();document.querySelectorAll(".year-span").forEach(i=>{i.textContent=String(t)});const e=document.getElementById("year");e&&(e.textContent=String(t));const o=document.getElementById("date");o&&!o.textContent.trim()&&(o.textContent=new Date().toLocaleDateString())}function initializeMobileMenu(){const t=document.getElementById("mobile-menu-btn"),e=document.getElementById("mobile-menu");if(!t||!e)return;e.id||(e.id="mobile-menu"),t.getAttribute("type")||t.setAttribute("type","button"),t.getAttribute("aria-label")||t.setAttribute("aria-label","Toggle mobile menu"),t.setAttribute("aria-controls",e.id),t.setAttribute("aria-expanded","false"),e.classList.remove("hidden"),e.hidden=!1;const o=()=>{t.querySelector(".hamburger-icon")||(t.innerHTML=['<span class="hamburger-icon" aria-hidden="true">','<span class="bar"></span>','<span class="bar"></span>','<span class="bar"></span>',"</span>"].join(""))},i=c=>{e.classList.toggle("menu-open",c),t.setAttribute("aria-expanded",String(c)),t.setAttribute("aria-label",c?"Close mobile menu":"Open mobile menu"),t.classList.toggle("menu-open-state",c),document.body.classList.toggle("menu-open",c)};o(),i(!1);const n=()=>{const c=e.classList.contains("menu-open");i(!c)};t.addEventListener("click",n),e.querySelectorAll("a").forEach(c=>{c.addEventListener("click",()=>i(!1))}),document.addEventListener("keydown",c=>{c.key==="Escape"&&i(!1)}),document.addEventListener("click",c=>{e.classList.contains("menu-open")&&!e.contains(c.target)&&!t.contains(c.target)&&i(!1)}),window.addEventListener("resize",()=>{window.innerWidth>=1024&&i(!1)})}function initializeRevealAnimations(){const t=document.querySelectorAll(".reveal");if(!t.length)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){t.forEach(i=>i.classList.add("active"));return}if(!("IntersectionObserver"in window)){t.forEach(i=>i.classList.add("active"));return}const o=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(n.target.classList.add("active"),o.unobserve(n.target))})},{threshold:.1});t.forEach(i=>o.observe(i))}function initializeBioReadMore(){document.querySelectorAll('[id$="-bio"]').forEach(e=>{const o=e.id.replace("-bio",""),i=document.getElementById(`${o}-read-more-btn`),n=document.getElementById(`${o}-bio-full`),c=document.getElementById(`${o}-bio-summary`);if(!i||!n||!c)return;i.setAttribute("aria-controls",`${o}-bio-full`);const r=n.classList.contains("show");i.setAttribute("aria-expanded",String(r)),n.setAttribute("aria-hidden",String(!r)),n.style.overflow="hidden",n.style.maxHeight=r?`${n.scrollHeight}px`:"0px",c.hidden=r,i.classList.add("interactive-anim","interactive-anim--text");const s=()=>{n.classList.contains("show")&&(n.style.maxHeight=`${n.scrollHeight}px`)};window.addEventListener("resize",debounce(s,120)),i.addEventListener("click",()=>{const a=n.classList.toggle("show");n.style.maxHeight=a?`${n.scrollHeight}px`:"0px",n.setAttribute("aria-hidden",String(!a)),c.hidden=a,i.textContent=a?"Read Less":"Read More",i.setAttribute("aria-expanded",String(a))})})}function initializeInteractiveMotion(){document.querySelectorAll(["a[href]","button",'[role="button"]','input[type="submit"]','input[type="button"]',".event-card-toggle",'[id$="-read-more-btn"]'].join(",")).forEach(e=>{if(e.classList.contains("interactive-anim"))return;e.classList.add("interactive-anim");const o=getMotionTone(e);e.classList.add(`interactive-tone-${o}`),e.matches('button, input[type="submit"], input[type="button"], a[class*="btn"], a.rounded-full')?e.classList.add("interactive-anim--button"):e.matches("#mobile-menu a, .nav-link")?e.classList.add("interactive-anim--menu"):e.matches("a[href]")&&e.classList.add("interactive-anim--link"),e.matches('[id$="-read-more-btn"], .event-card-toggle')&&e.classList.add("interactive-anim--text"),e.addEventListener("pointerdown",()=>{e.classList.add("is-pressed")});const i=()=>e.classList.remove("is-pressed");e.addEventListener("pointerup",i),e.addEventListener("pointercancel",i),e.addEventListener("pointerleave",i),e.addEventListener("blur",i)}),document.querySelectorAll(".event-card").forEach(e=>{e.classList.add("interactive-card"),e.classList.add(`motion-tone-${getMotionTone(e)}`)}),document.querySelectorAll("input, select, textarea").forEach(e=>{e.classList.add("interactive-form-control")})}function initializeStaggeredCardReveal(){const t=[".event-card","section .rounded-2xl","section article.rounded-xl","section .shadow-md",".interactive-card"].join(","),e=Array.from(new Set(Array.from(document.querySelectorAll(t))));if(!e.length)return;const o=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(e.forEach(n=>{n.classList.add("motion-enter");const c=getMotionTone(n);n.classList.add(`motion-tone-${c}`);const r=n.closest("section"),s=r?Array.from(r.querySelectorAll(t)):e,a=Math.max(0,s.indexOf(n)),l=c==="dramatic"?1.2:c==="restrained"?.85:1,d=Math.round(Math.min(a,7)*65*l);n.style.setProperty("--motion-enter-delay",`${d}ms`)}),o||!("IntersectionObserver"in window)){e.forEach(n=>n.classList.add("is-in-view"));return}const i=new IntersectionObserver(n=>{n.forEach(c=>{c.isIntersecting&&(c.target.classList.add("is-in-view"),i.unobserve(c.target))})},{threshold:.16,rootMargin:"0px 0px -6% 0px"});e.forEach(n=>i.observe(n))}function getMotionTone(t){const e=t.closest("section, header, footer, nav, aside, main");if(!e)return"balanced";const o=e.tagName.toLowerCase(),i=(e.className||"").toLowerCase();return o==="footer"||o==="nav"||o==="aside"?"restrained":i.includes("bg-compass-dark")||i.includes("hero")||i.includes("gradient")||i.includes("animate-blob")?"dramatic":"balanced"}function enhanceExternalLinks(){document.querySelectorAll('a[target="_blank"]').forEach(o=>{const i=new Set((o.getAttribute("rel")||"").split(/\s+/).filter(Boolean));if(i.add("noopener"),i.add("noreferrer"),o.setAttribute("rel",Array.from(i).join(" ")),!o.getAttribute("aria-label")&&!o.textContent.trim()){const n=o.getAttribute("href")||"";let c="External link";n.startsWith("mailto:")?c="Email link":n.includes("linkedin.com")?c="LinkedIn profile":n.includes("facebook.com")&&(c="Facebook profile"),o.setAttribute("aria-label",c),o.setAttribute("title",c)}else!o.getAttribute("title")&&o.getAttribute("aria-label")&&o.setAttribute("title",o.getAttribute("aria-label"))}),document.querySelectorAll("a").forEach(o=>{if(o.getAttribute("aria-label")){o.getAttribute("title")||o.setAttribute("title",o.getAttribute("aria-label"));return}const i=o.textContent.trim().length>0,n=!!o.querySelector("i, svg");if(i||!n)return;const c=o.getAttribute("href")||"";let r="Link";c.includes("linkedin.com")?r="LinkedIn":c.includes("facebook.com")?r="Facebook":c.includes("x.com")||c.includes("twitter.com")?r="X profile":c.startsWith("mailto:")?r="Email":c==="#"&&(r="Social profile"),o.setAttribute("aria-label",r),o.setAttribute("title",r)})}function connectFormLabels(){document.querySelectorAll("form").forEach((e,o)=>{e.querySelectorAll("label").forEach((n,c)=>{if(n.getAttribute("for"))return;const r=n.parentElement?n.parentElement.querySelector("input, select, textarea"):null;r&&(r.id||(r.id=`form-${o}-field-${c}`),n.setAttribute("for",r.id),r.getAttribute("aria-label")||r.setAttribute("aria-label",n.textContent.trim()),r.getAttribute("title")||r.setAttribute("title",n.textContent.trim()))})})}function optimizeImages(){document.querySelectorAll("img").forEach((e,o)=>{e.hasAttribute("decoding")||e.setAttribute("decoding","async"),!e.hasAttribute("loading")&&o>2&&e.setAttribute("loading","lazy"),e.closest(".ticker-track")&&(e.setAttribute("loading","lazy"),e.setAttribute("fetchpriority","low"))})}function initializeTickerImageFallback(){document.querySelectorAll(".ticker-track img").forEach(t=>{t.addEventListener("error",()=>{t.src="/assets/logos/optimized/Logo-320.webp",t.style.maxHeight="100px"})})}function registerServiceWorker(){"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}function scrollToElement(t){const e=document.querySelector(t);e&&e.scrollIntoView({behavior:"smooth"})}function debounce(t,e){let o;return function(...n){clearTimeout(o),o=setTimeout(()=>{t(...n)},e)}}function isInViewport(t){const e=t.getBoundingClientRect();return e.top>=0&&e.left>=0&&e.bottom<=(window.innerHeight||document.documentElement.clientHeight)&&e.right<=(window.innerWidth||document.documentElement.clientWidth)}function initializeSidebarScrollIndicator(){const t=document.getElementById("sidebar-scroll-area"),e=document.getElementById("sidebar-scroll-indicator");if(!t||!e)return;const o=()=>{const i=t.scrollTop+t.clientHeight>=t.scrollHeight-4;e.style.opacity=i?"0":"1"};o(),t.addEventListener("scroll",o,{passive:!0})}function initializeNewsletterForm(){const t=document.querySelectorAll('form[name="newsletter-subscribe"]');t.length&&t.forEach(e=>{e.addEventListener("submit",async o=>{o.preventDefault();const i=e.querySelector('input[name="email"]'),n=e.querySelector('button[type="submit"]');if(!i||!n)return;const c=i.value.trim();if(!c||!i.checkValidity()){i.reportValidity();return}const r=n.textContent;n.textContent="Subscribing...",n.disabled=!0;try{const s=new FormData(e);if(s.set("email",c),!(await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(s).toString()})).ok)throw new Error("Subscription failed.");n.textContent="Subscribed!",n.classList.remove("bg-compass-teal","hover:bg-compass-lightTeal"),n.classList.add("bg-green-600"),i.value="",setTimeout(()=>{n.textContent=r,n.classList.remove("bg-green-600"),n.classList.add("bg-compass-teal","hover:bg-compass-lightTeal"),n.disabled=!1},3e3)}catch(s){n.textContent=s instanceof Error?s.message:"Error",setTimeout(()=>{n.textContent=r,n.disabled=!1},3e3)}})})}function initializeContactForm(){const t=document.getElementById("contact-form");if(!t)return;const e=[{name:"name",validate:o=>o.trim().length>0},{name:"email",validate:o=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.trim())},{name:"message",validate:o=>o.trim().length>0}];e.forEach(({name:o})=>{const i=t.querySelector(`[name="${o}"]`);i&&i.addEventListener("input",()=>{i.classList.remove("border-red-400");const n=t.querySelector(`[data-error="${o}"]`);n&&n.classList.add("hidden")})}),t.addEventListener("submit",async o=>{o.preventDefault();let i=!0;if(e.forEach(({name:s,validate:a})=>{const l=t.querySelector(`[name="${s}"]`),d=t.querySelector(`[data-error="${s}"]`);l&&(a(l.value)?(l.classList.remove("border-red-400"),d&&d.classList.add("hidden")):(i=!1,l.classList.add("border-red-400"),d&&d.classList.remove("hidden")))}),!i)return;const n=t.querySelector('button[type="submit"]'),c=n.textContent;n.textContent="Sending...",n.disabled=!0;const r=document.getElementById("contact-error");r&&r.classList.add("hidden");try{const s=new FormData(t);if(!(await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(s).toString()})).ok)throw new Error("Submission failed");t.classList.add("hidden");const l=document.getElementById("contact-success");l&&(l.classList.remove("hidden"),window.lucide&&window.lucide.createIcons())}catch{n.textContent=c,n.disabled=!1,r&&r.classList.remove("hidden")}})}window.CompassConsult={scrollToElement,debounce,isInViewport,initializeMobileMenu,initializeRevealAnimations,hasCookieConsent,openCookiePreferences:()=>{window.CompassConsultCookieConsent&&window.CompassConsultCookieConsent.openPreferences()},getCookiePreferences:()=>readStoredCookieConsent()||buildCookieConsent()};
