/**
 * Homepage ticker repair and performance.
 * Keeps logos in one evenly spaced row and avoids extra clone/composite work.
 */
(function repairHomepageTicker() {
  const TICKER_STYLE_ID = 'cc-ticker-fix-styles';

  function injectStyles() {
    if (document.getElementById(TICKER_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = TICKER_STYLE_ID;
    style.textContent = [
      '.embla-ticker{overflow:hidden!important;width:100%!important;height:50px!important;max-height:50px!important;min-height:50px!important;contain:paint;}',
      '.embla-ticker__container{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;height:50px!important;will-change:transform;transform:translateZ(0);}',
      '.embla-ticker__slide{flex:0 0 auto!important;display:flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:4rem!important;max-width:none!important;padding:0 2.25rem!important;}',
      '.embla-ticker img,.ticker-img{height:35px!important;max-height:35px!important;width:auto!important;max-width:160px!important;object-fit:contain!important;}'
    ].join('');
    document.head.appendChild(style);
  }

  function prepareLogos(viewport) {
    viewport.querySelectorAll('img').forEach((image, index) => {
      image.setAttribute('decoding', 'async');
      image.setAttribute('loading', index < 8 ? 'eager' : 'lazy');
      image.style.height = '35px';
      image.style.maxHeight = '35px';
      image.style.width = 'auto';
      image.style.maxWidth = '160px';
      image.style.objectFit = 'contain';
      image.addEventListener('error', () => {
        if (image.dataset.fallbackApplied === 'true') return;
        image.dataset.fallbackApplied = 'true';
        image.src = '/assets/logos/optimized/Logo-320.webp';
        image.style.maxHeight = '35px';
      });
    });
  }

  function stripInteractiveMotion(viewport) {
    viewport.querySelectorAll('a').forEach((link) => {
      link.classList.remove(
        'interactive-anim',
        'interactive-anim--link',
        'interactive-anim--button',
        'interactive-tone-restrained',
        'interactive-tone-balanced',
        'interactive-tone-dramatic'
      );
    });
  }

  function bindPerformanceGuards(viewport) {
    const embla = viewport._emblaInstance;
    if (!embla || typeof embla.plugins !== 'function') return;
    const plugins = embla.plugins();
    const autoScroll = plugins && plugins.autoScroll;
    if (!autoScroll) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion && typeof autoScroll.stop === 'function') {
      autoScroll.stop();
      return;
    }

    if (viewport.dataset.perfGuards === 'true') return;
    viewport.dataset.perfGuards = 'true';
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && typeof autoScroll.stop === 'function') autoScroll.stop();
      else if (!document.hidden && typeof autoScroll.play === 'function') autoScroll.play();
    });
  }

  function boot() {
    injectStyles();
    const viewport = document.getElementById('clients-ticker');
    if (!viewport) return;
    prepareLogos(viewport);
    stripInteractiveMotion(viewport);

    const start = () => {
      if (viewport._emblaInstance && typeof viewport._emblaInstance.reInit === 'function') {
        viewport._emblaInstance.reInit();
        const autoScroll = viewport._emblaInstance.plugins && viewport._emblaInstance.plugins().autoScroll;
        if (autoScroll && typeof autoScroll.play === 'function') autoScroll.play();
        bindPerformanceGuards(viewport);
        return;
      }
      if (typeof initializeTicker === 'function') {
        initializeTicker();
        bindPerformanceGuards(viewport);
      }
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
