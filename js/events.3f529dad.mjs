import { classifyEvent } from "./news-events-status.25c4e66c.mjs";

function scheduleFromCard(card) {
  return {
    precision: card.dataset.datePrecision || "unknown",
    allDay: card.dataset.allDay === "true",
    start: card.dataset.eventStart || null,
    end: card.dataset.eventEnd || null,
    editorialPlacement: card.dataset.editorialPlacement || "past"
  };
}

function startKey(card) {
  const schedule = scheduleFromCard(card);
  if (!schedule.start || schedule.precision === "unknown" || schedule.precision === "day-month") return "";
  return schedule.start;
}

function sortCards(container, direction) {
  if (!container) return;
  const cards = [...container.querySelectorAll(":scope > .story-card")];
  cards.sort((left, right) => {
    const leftKey = startKey(left);
    const rightKey = startKey(right);
    if (!leftKey && !rightKey) return Number(left.dataset.feedOrder || 0) - Number(right.dataset.feedOrder || 0);
    if (!leftKey) return 1;
    if (!rightKey) return -1;
    const delta = leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    return direction === "soonest" ? delta : -delta;
  });
  for (const card of cards) container.appendChild(card);
}

function placeByClock(now) {
  const upcoming = document.getElementById("upcoming-events-list");
  const past = document.getElementById("past-events-list");
  if (!upcoming || !past) return;
  const cards = [...document.querySelectorAll("#upcoming-events-list .story-card, #past-events-list .story-card")];
  for (const card of cards) {
    const automatic = classifyEvent(scheduleFromCard(card), now);
    const placement = automatic || card.dataset.editorialPlacement || "past";
    const target = placement === "upcoming" ? upcoming : past;
    if (card.parentElement !== target) target.appendChild(card);
    card.dataset.resolvedPlacement = placement;
  }
  const empty = document.getElementById("upcoming-empty");
  if (empty) empty.hidden = upcoming.querySelector(".story-card") !== null;
}

function searchMatches(haystack, query) {
  const terms = query.split(/\s+/).filter(Boolean);
  const words = haystack.split(/[^a-z0-9]+/).filter(Boolean);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

function applyFilter() {
  const selected = document.querySelector(".story-tab.is-active")?.dataset.filter || "all";
  const query = (document.getElementById("story-search")?.value || "").trim().toLowerCase();
  const cards = [...document.querySelectorAll(".story-card")];
  let visible = 0;
  for (const card of cards) {
    const kindMatch = selected === "all" || card.dataset.kind === selected;
    const textMatch = !query || searchMatches(card.dataset.search || "", query);
    const show = kindMatch && textMatch;
    card.hidden = !show;
    if (show) visible += 1;
  }
  for (const section of document.querySelectorAll("[data-section-kind]")) {
    const kindMatch = selected === "all" || section.dataset.sectionKind === selected;
    const hasVisible = [...section.querySelectorAll(".story-card")].some((card) => !card.hidden);
    section.hidden = !kindMatch || !hasVisible;
  }
  const empty = document.getElementById("story-search-empty");
  if (empty) empty.hidden = !query || visible > 0;
}

function selectTab(tab) {
  for (const other of document.querySelectorAll(".story-tab")) {
    const active = other === tab;
    other.classList.toggle("is-active", active);
    other.setAttribute("aria-selected", String(active));
    other.tabIndex = active ? 0 : -1;
  }
  applyFilter();
}

function start() {
  placeByClock(new Date());
  sortCards(document.getElementById("upcoming-events-list"), "soonest");
  sortCards(document.getElementById("past-events-list"), "newest");

  const tabs = [...document.querySelectorAll(".story-tab")];
  for (const tab of tabs) {
    if (!tab.classList.contains("is-active")) tab.tabIndex = -1;
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      let next = null;
      if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      selectTab(next);
      next.focus();
    });
  }
  document.getElementById("story-search")?.addEventListener("input", applyFilter);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
