/**
 * Shared pointer control for every logo ticker.
 * CSS keyframes keep scrolling when this script does not run.
 * With script: a transform drives the loop, drag, and touch flick.
 */

const SLOP = 8;
const FLICK_THRESHOLD = 0.35;
const FRICTION = 0.0035;
const RESUME_DELAY = 700;

export function parseDurationSeconds(value) {
  if (!value) return 0;
  const first = String(value).split(",")[0].trim();
  const amount = Number.parseFloat(first);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return first.endsWith("ms") ? amount / 1000 : amount;
}

export function wrapOffset(offset, loopWidth) {
  if (!loopWidth) return offset;
  let value = offset;
  while (value < -loopWidth) value += loopWidth;
  while (value > 0) value -= loopWidth;
  return value;
}

export function createTicker(viewport, options = {}) {
  const track = options.track || viewport.querySelector("[data-ticker-track]");
  if (!track) return null;

  const direction = options.direction
    || (viewport.dataset.tickerDirection === "right" ? 1 : -1);
  const reducedMotion = options.reducedMotion
    ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const resumeDelay = options.resumeDelay ?? RESUME_DELAY;
  let loopWidth = options.loopWidth || 0;
  let offset = 0;
  let baseSpeed = 0;
  let speed = 0;
  let momentum = 0;
  let lastTime = 0;
  let pointer = null;
  let suppressClick = false;
  let hoverPaused = false;
  let focusPaused = false;
  let resumeTimer = 0;

  const measure = () => {
    if (options.loopWidth) {
      loopWidth = options.loopWidth;
      return;
    }
    const set = track.querySelector("[data-ticker-set]");
    const width = set ? set.getBoundingClientRect().width : track.scrollWidth / 2;
    if (width > 1) loopWidth = width;
  };

  const applyBaseSpeed = () => {
    measure();
    const seconds = options.duration ?? parseDurationSeconds(getComputedStyle(track).animationDuration);
    if (reducedMotion || !loopWidth || !seconds) {
      baseSpeed = 0;
      return;
    }
    baseSpeed = direction * (loopWidth / (seconds * 1000));
    speed = baseSpeed;
  };

  const render = () => {
    track.style.setProperty("animation", "none", "important");
    track.style.transform = `translate3d(${offset}px,0,0)`;
  };

  const paused = () => hoverPaused || focusPaused;

  const scheduleResume = () => {
    speed = 0;
    globalThis.clearTimeout(resumeTimer);
    resumeTimer = globalThis.setTimeout(() => {
      speed = baseSpeed;
    }, resumeDelay);
  };

  const step = (now) => {
    const dt = lastTime ? Math.min(40, Math.max(0, now - lastTime)) : 0;
    lastTime = now;
    if (!pointer?.dragging) {
      if (momentum) {
        offset = wrapOffset(offset + momentum * dt, loopWidth);
        momentum *= Math.exp(-FRICTION * dt);
        if (Math.abs(momentum) < 0.02) {
          momentum = 0;
          scheduleResume();
        }
      } else if (!paused()) {
        offset = wrapOffset(offset + speed * dt, loopWidth);
      }
      render();
    }
    return offset;
  };

  const finishPointer = (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const active = pointer;
    pointer = null;
    viewport.classList.remove("is-dragging");
    if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (active.mode !== "x") return;
    if (active.moved) {
      suppressClick = true;
      globalThis.setTimeout(() => { suppressClick = false; }, 0);
    }
    const samples = active.samples.filter((sample) => event.timeStamp - sample.time < 90);
    const first = samples[0];
    const last = samples[samples.length - 1];
    const flick = first && last && last.time > first.time
      ? (last.x - first.x) / (last.time - first.time)
      : 0;
    if ((active.type === "touch" || active.type === "pen") && Math.abs(flick) > FLICK_THRESHOLD) {
      momentum = flick;
      speed = 0;
    } else {
      momentum = 0;
      scheduleResume();
    }
  };

  viewport.style.touchAction = "pan-y";
  viewport.style.cursor = "grab";
  viewport.querySelectorAll("a, img").forEach((element) => { element.draggable = false; });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || pointer) return;
    pointer = {
      id: event.pointerId,
      type: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      origin: offset,
      mode: "",
      moved: false,
      dragging: false,
      samples: [{ time: event.timeStamp, x: event.clientX }]
    };
    momentum = 0;
    globalThis.clearTimeout(resumeTimer);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    if (!pointer.mode) {
      if (Math.hypot(dx, dy) < SLOP) return;
      pointer.mode = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (pointer.mode === "y") return;
      pointer.dragging = true;
      viewport.classList.add("is-dragging");
      viewport.style.cursor = "grabbing";
      try { viewport.setPointerCapture?.(event.pointerId); } catch { /* The pointer is already active for this gesture. */ }
    }
    if (pointer.mode !== "x") return;
    pointer.moved = true;
    pointer.samples.push({ time: event.timeStamp, x: event.clientX });
    if (pointer.samples.length > 8) pointer.samples.shift();
    offset = wrapOffset(pointer.origin + dx, loopWidth);
    render();
    event.preventDefault();
  });

  viewport.addEventListener("pointerup", finishPointer);
  viewport.addEventListener("pointercancel", finishPointer);
  viewport.addEventListener("lostpointercapture", () => {
    if (pointer?.dragging) viewport.style.cursor = "grab";
  });

  viewport.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  viewport.addEventListener("dragstart", (event) => event.preventDefault());
  viewport.addEventListener("pointerover", (event) => {
    if (event.pointerType === "mouse") hoverPaused = true;
  });
  viewport.addEventListener("pointerout", (event) => {
    if (event.pointerType !== "mouse") return;
    if (event.relatedTarget && viewport.contains(event.relatedTarget)) return;
    hoverPaused = false;
  });
  viewport.addEventListener("focusin", () => { focusPaused = true; });
  viewport.addEventListener("focusout", (event) => {
    if (event.relatedTarget && viewport.contains(event.relatedTarget)) return;
    focusPaused = false;
  });

  applyBaseSpeed();
  render();
  if (options.autoFrame !== false && typeof requestAnimationFrame === "function") {
    const loop = (now) => {
      step(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return {
    step,
    get offset() { return offset; },
    get speed() { return speed; },
    get momentum() { return momentum; },
    get loopWidth() { return loopWidth; }
  };
}

export function attachTickers(root = document) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll("[data-ticker]").forEach((viewport) => {
    if (viewport.dataset.tickerReady === "true") return;
    const track = viewport.querySelector("[data-ticker-track]");
    if (!track) return;
    const duration = parseDurationSeconds(getComputedStyle(track).animationDuration);
    createTicker(viewport, {
      track,
      duration,
      reducedMotion,
      direction: viewport.dataset.tickerDirection === "right" ? 1 : -1
    });
    viewport.dataset.tickerReady = "true";
  });
}

function boot() {
  const run = () => attachTickers(document);
  if (document.readyState === "complete") {
    run();
    return;
  }
  document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("load", run);
  });
}

if (typeof document !== "undefined") boot();
