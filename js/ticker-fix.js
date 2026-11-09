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
      '.embla-ticker{overflow:hidden!important;width:100%!important;height:50px!important;max-height:50px!important;min-height:50px!important;display:flex!important;align-items:center!important;contain:paint;}',
      '.embla-ticker__container{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;height:100%!important;min-height:50px!important;will-change:transform;transform:translateZ(0);}',
      '.embla-ticker__slide{flex:0 0 auto!important;display:flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;height:100%!important;width:auto!important;min-width:4rem!important;max-width:none!important;padding:0 2.25rem!important;}',
      '.embla-ticker img,.ticker-img{height:35px!important;max-height:35px!important;width:auto!important;max-width:160px!important;object-fit:contain!important;object-position:center!important;}',
      '.ticker-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;height:100%!important;}'
    ].join('');
    style.textContent += [
      '.embla-ticker__container.cc-ticker-marquee{width:max-content!important;animation:cc-ticker-marquee var(--ticker-duration,72s) linear infinite!important;}',
      '.embla-ticker.cc-ticker-marquee:hover .embla-ticker__container{animation-play-state:paused!important;}',
      '.embla-ticker.cc-ticker-marquee{touch-action:pan-y;cursor:grab;} .embla-ticker.cc-ticker-marquee.is-dragging{cursor:grabbing;}',
      '@keyframes cc-ticker-marquee{to{transform:translate3d(-50%,0,0)}}',
      '@media(prefers-reduced-motion:reduce){.embla-ticker__container.cc-ticker-marquee{animation:none!important;transform:translate3d(var(--ticker-drag-x,0px),0,0)!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function prepareLogos(viewport) {
    viewport.querySelectorAll('a, img').forEach((element) => { element.draggable = false; });
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

  function enableTickerDrag(viewport, container, originalWidth) {
    let activeDrag = null;
    let suppressClick = false;

    viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || activeDrag) return;
      const animation = container.getAnimations().find((candidate) => candidate.animationName === 'cc-ticker-marquee');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!animation && !reducedMotion) return;

      activeDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startTime: Number(animation?.currentTime) || 0,
        startOffset: Number.parseFloat(container.style.getPropertyValue('--ticker-drag-x')) || 0,
        animation,
        duration: animation?.effect?.getComputedTiming().duration || 0,
        moved: false
      };
      animation?.pause();
    });

    window.addEventListener('pointermove', (event) => {
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
      const deltaX = event.clientX - activeDrag.startX;
      if (Math.abs(deltaX) > 4) {
        activeDrag.moved = true;
        viewport.classList.add('is-dragging');
        event.preventDefault();
      }
      if (!activeDrag.moved) return;

      if (activeDrag.animation && originalWidth > 0) {
        activeDrag.animation.currentTime = activeDrag.startTime - (deltaX / originalWidth) * activeDrag.duration;
      } else {
        const minOffset = Math.min(0, viewport.clientWidth - originalWidth);
        const offset = Math.max(minOffset, Math.min(0, activeDrag.startOffset + deltaX));
        container.style.setProperty('--ticker-drag-x', `${offset}px`);
      }
    });

    const finishDrag = (event) => {
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
      if (activeDrag.moved) {
        suppressClick = true;
        window.setTimeout(() => { suppressClick = false; }, 0);
      }
      activeDrag.animation?.play();
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      activeDrag = null;
      viewport.classList.remove('is-dragging');
    };

    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    viewport.addEventListener('click', (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function boot() {
    injectStyles();
    const viewport = document.getElementById('clients-ticker');
    if (!viewport) return;
    prepareLogos(viewport);
    stripInteractiveMotion(viewport);
    viewport.addEventListener('dragstart', (event) => event.preventDefault());

    const start = () => {
      if (viewport.dataset.continuousTicker === 'true') return;
      const container = viewport.querySelector('.embla-ticker__container');
      if (!container) return;

      if (viewport._emblaInstance && typeof viewport._emblaInstance.destroy === 'function') {
        viewport._emblaInstance.destroy();
        delete viewport._emblaInstance;
      }

      const originalSlides = Array.from(container.children);
      if (!originalSlides.length) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        originalSlides.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.querySelectorAll('a, img').forEach((element) => { element.draggable = false; });
          clone.querySelectorAll('a, button, [tabindex]').forEach((element) => element.setAttribute('tabindex', '-1'));
          container.appendChild(clone);
        });
      }

      container.classList.add('cc-ticker-marquee');
      viewport.classList.add('cc-ticker-marquee');
      container.style.removeProperty('transform');
      const originalWidth = originalSlides.reduce((width, slide) => width + slide.getBoundingClientRect().width, 0);
      if (!reduceMotion) container.style.setProperty('--ticker-duration', `${Math.max(20, originalWidth / 45)}s`);
      enableTickerDrag(viewport, container, originalWidth);
      viewport.dataset.continuousTicker = 'true';
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
