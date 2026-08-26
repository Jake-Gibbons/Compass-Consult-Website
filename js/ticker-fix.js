/**
 * Homepage ticker repair.
 * Ensures logos stay in a single horizontal strip and Embla can measure them.
 */
(function repairHomepageTicker() {
  const TICKER_STYLE_ID = 'cc-ticker-fix-styles';

  function injectStyles() {
    if (document.getElementById(TICKER_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = TICKER_STYLE_ID;
    style.textContent = [
      '.embla-ticker{overflow:hidden!important;width:100%!important;height:50px!important;max-height:50px!important;min-height:50px!important;}',
      '.embla-ticker__container{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;height:50px!important;}',
      '.embla-ticker__slide{flex:0 0 auto!important;width:auto!important;min-width:auto!important;max-width:none!important;}',
      '.embla-ticker img,.ticker-img{height:35px!important;max-height:35px!important;width:auto!important;max-width:140px!important;object-fit:contain!important;}'
    ].join('');
    document.head.appendChild(style);
  }

  function eagerLoadLogos(viewport) {
    viewport.querySelectorAll('img').forEach((image) => {
      image.setAttribute('loading', 'eager');
      image.setAttribute('decoding', 'async');
      image.style.height = '35px';
      image.style.maxHeight = '35px';
      image.style.width = 'auto';
      image.style.maxWidth = '140px';
      image.style.objectFit = 'contain';
    });
  }

  function duplicateSlides(viewport) {
    const container = viewport.querySelector('.embla-ticker__container');
    if (!container || container.dataset.duplicated === 'true') return;
    container.innerHTML += container.innerHTML;
    container.dataset.duplicated = 'true';
  }

  function boot() {
    injectStyles();
    const viewport = document.getElementById('clients-ticker');
    if (!viewport) return;
    eagerLoadLogos(viewport);
    duplicateSlides(viewport);

    const start = () => {
      if (viewport._emblaInstance && typeof viewport._emblaInstance.reInit === 'function') {
        viewport._emblaInstance.reInit();
        const autoScroll = viewport._emblaInstance.plugins && viewport._emblaInstance.plugins().autoScroll;
        if (autoScroll && typeof autoScroll.play === 'function') autoScroll.play();
        return;
      }
      if (typeof initializeTicker === 'function') initializeTicker();
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
