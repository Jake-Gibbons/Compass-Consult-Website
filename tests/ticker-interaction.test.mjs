import { describe, expect, it, vi } from "vitest";
import { createTicker, wrapOffset } from "../js/ticker-interaction.mjs";

function element() {
  const listeners = new Map();
  const node = {
    dataset: {},
    style: {},
    classList: {
      add() {},
      remove() {}
    },
    listeners,
    addEventListener(type, fn, options) {
      const list = listeners.get(type) || [];
      list.push({ fn, options });
      listeners.set(type, list);
    },
    dispatch(type, event) {
      for (const { fn } of listeners.get(type) || []) fn(event);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture() { return false; },
    contains() { return false; },
    getBoundingClientRect() { return { width: 400, height: 48, x: 0, y: 0 }; }
  };
  return node;
}

function ticker() {
  const viewport = element();
  const track = element();
  track.style = { setProperty() {}, transform: "" };
  const created = createTicker(viewport, {
    track,
    loopWidth: 1000,
    direction: -1,
    duration: 10,
    reducedMotion: false,
    resumeDelay: 40,
    autoFrame: false
  });
  return { viewport, track, ticker: created };
}

function pointer(type, extra) {
  return {
    button: 0,
    pointerId: 1,
    pointerType: type,
    clientX: 0,
    clientY: 0,
    timeStamp: 0,
    preventDefault() { this.defaultPrevented = true; },
    ...extra
  };
}

describe("ticker pointer control", () => {
  it("wraps the offset in both directions without a jump", () => {
    expect(wrapOffset(-1005, 1000)).toBeCloseTo(-5);
    expect(wrapOffset(12, 1000)).toBeCloseTo(-988);
    expect(wrapOffset(-400, 1000)).toBe(-400);
  });

  it("moves the strip when a pointer drags horizontally", () => {
    const { viewport, track, ticker: control } = ticker();
    control.step(1000);
    viewport.dispatch("pointerdown", pointer("mouse", { clientX: 200, clientY: 20, timeStamp: 1000 }));
    viewport.dispatch("pointermove", pointer("mouse", { clientX: 120, clientY: 22, timeStamp: 1020 }));
    expect(track.style.transform).toBe("translate3d(-80px,0,0)");
    viewport.dispatch("pointerup", pointer("mouse", { clientX: 120, clientY: 22, timeStamp: 1040 }));
  });

  it("does not block a vertical gesture", () => {
    const { viewport, track, ticker: control } = ticker();
    control.step(1000);
    const down = pointer("touch", { clientX: 40, clientY: 20, timeStamp: 1000 });
    const move = pointer("touch", { clientX: 42, clientY: 70, timeStamp: 1030 });
    viewport.dispatch("pointerdown", down);
    viewport.dispatch("pointermove", move);
    expect(move.defaultPrevented).toBeUndefined();
    expect(track.style.transform).toBe("translate3d(0px,0,0)");
  });

  it("keeps moving after a touch flick, then resumes automatic scroll", () => {
    vi.useFakeTimers();
    const { viewport, track, ticker: control } = ticker();
    control.step(0);
    viewport.dispatch("pointerdown", pointer("touch", { clientX: 300, clientY: 10, timeStamp: 0 }));
    viewport.dispatch("pointermove", pointer("touch", { clientX: 220, clientY: 12, timeStamp: 16 }));
    viewport.dispatch("pointermove", pointer("touch", { clientX: 80, clientY: 12, timeStamp: 40 }));
    viewport.dispatch("pointerup", pointer("touch", { clientX: 80, clientY: 12, timeStamp: 48 }));
    const released = control.offset;
    control.step(64);
    control.step(80);
    const coasting = control.offset;
    expect(coasting).not.toBeCloseTo(released);
    expect(control.momentum).not.toBe(0);
    let time = 80;
    for (; time < 2000; time += 16) control.step(time);
    expect(control.momentum).toBe(0);
    const idle = control.offset;
    control.step(time + 100);
    expect(control.offset).toBeCloseTo(idle);
    vi.advanceTimersByTime(40);
    control.step(time + 200);
    expect(control.offset).toBeLessThan(idle);
    expect(track.style.transform).toContain("translate3d(");
    vi.useRealTimers();
  });
});
