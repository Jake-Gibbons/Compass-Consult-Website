import { classifyEvent } from "./news-events-status.1a8d74c0.mjs";

const SHOW_MORE_LIMIT = 4;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function scheduleFromCard(card) {
  return {
    precision: card.dataset.datePrecision || "unknown",
    allDay: card.dataset.allDay === "true",
    start: card.dataset.eventStart || null,
    end: card.dataset.eventEnd || null,
    editorialPlacement: card.dataset.editorialPlacement || "past"
  };
}

function machineStamp(card) {
  const schedule = scheduleFromCard(card);
  if (!schedule.start || schedule.precision === "unknown" || schedule.precision === "day-month") return null;
  const civil = schedule.allDay || !schedule.start.includes("T") ? `${schedule.start.slice(0, 10)}T12:00` : schedule.start;
  const parsed = new Date(civil);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function start() {
  const viewRoot = document.getElementById("events-view-root");
  const standardView = document.getElementById("events-standard-view");
  const calendarView = document.getElementById("events-calendar-view");
  const viewButtons = Array.from(document.querySelectorAll("[data-events-view]"));
  const upcomingList = document.getElementById("upcoming-events-list");
  const pastList = document.getElementById("past-events-list");
  const calendarGrid = document.getElementById("eventsCalendarGrid");
  const calendarAgenda = document.getElementById("eventsCalendarAgenda");
  const calendarMonthLabel = document.getElementById("calendarMonthLabel");
  const calendarMonthSummary = document.getElementById("calendarMonthSummary");
  const calendarPrevMonth = document.getElementById("calendarPrevMonth");
  const calendarNextMonth = document.getElementById("calendarNextMonth");
  const calendarViewAllEvents = document.getElementById("calendarViewAllEvents");
  const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" });
  const agendaDayFormatter = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Europe/London" });

  let currentView = "list";
  let newestFirst = true;
  let calendarMonthIndex = 0;
  let calendarMonths = [];
  let eventMetadata = [];

  const eventCards = () => Array.from(document.querySelectorAll("#upcoming-events-list .event-card, #past-events-list .event-card"));

  const placeByClock = (now) => {
    if (!upcomingList || !pastList) return;
    for (const card of eventCards()) {
      const automatic = classifyEvent(scheduleFromCard(card), now);
      const placement = automatic || card.dataset.editorialPlacement || "past";
      const target = placement === "upcoming" ? upcomingList : pastList;
      if (card.parentElement !== target) target.appendChild(card);
      card.dataset.resolvedPlacement = placement;
    }
    const empty = document.getElementById("upcoming-empty");
    if (empty) empty.hidden = upcomingList.querySelector(".event-card") !== null;
  };

  const sortCollection = (container) => {
    if (!container) return;
    const cards = Array.from(container.querySelectorAll(":scope > .event-card"));
    cards.sort((leftCard, rightCard) => {
      const leftDate = machineStamp(leftCard);
      const rightDate = machineStamp(rightCard);
      if (leftDate === null && rightDate === null) {
        return Number(leftCard.dataset.feedOrder || 0) - Number(rightCard.dataset.feedOrder || 0);
      }
      if (leftDate === null) return 1;
      if (rightDate === null) return -1;
      return newestFirst ? rightDate - leftDate : leftDate - rightDate;
    });
    for (const card of cards) container.appendChild(card);
  };

  const applyShowMore = (container) => {
    if (!container) return;
    const existing = container.parentElement.querySelector(":scope > .events-show-more");
    if (existing) existing.remove();
    const cards = Array.from(container.querySelectorAll(":scope > .event-card"));
    cards.forEach((card, index) => {
      card.hidden = index >= SHOW_MORE_LIMIT;
    });
    if (cards.length <= SHOW_MORE_LIMIT) return;
    const wrap = document.createElement("div");
    wrap.className = "events-show-more text-center w-full mt-6 mb-12";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inline-flex items-center justify-center rounded-full border border-compass-purple px-5 py-2 text-sm font-semibold text-compass-purple hover:bg-purple-50";
    button.textContent = `Show ${cards.length - SHOW_MORE_LIMIT} more`;
    button.addEventListener("click", () => {
      for (const card of cards) card.hidden = false;
      wrap.remove();
    });
    wrap.appendChild(button);
    container.insertAdjacentElement("afterend", wrap);
  };

  const buildMetadata = () => eventCards().map((card, index) => {
    if (!card.id) card.id = `event-card-${index + 1}`;
    const stamp = machineStamp(card);
    const date = stamp === null ? null : new Date(card.dataset.eventStart.length === 10 ? `${card.dataset.eventStart}T12:00:00` : card.dataset.eventStart);
    return {
      id: card.id,
      card,
      title: card.querySelector("h2")?.textContent.trim() || "Event",
      dateLabel: card.dataset.dateLabel || "Date not stated",
      locationLabel: card.dataset.locationLabel || "",
      timestamp: stamp,
      dateObject: date,
      isUpcoming: card.dataset.resolvedPlacement === "upcoming"
    };
  });

  const getCalendarMonths = () => {
    const monthMap = new Map();
    for (const event of eventMetadata) {
      if (!event.dateObject) continue;
      const keyDate = new Date(event.dateObject.getFullYear(), event.dateObject.getMonth(), 1);
      monthMap.set(keyDate.getTime(), keyDate);
    }
    return Array.from(monthMap.values()).sort((left, right) => left.getTime() - right.getTime());
  };

  const renderCalendar = () => {
    if (!calendarGrid || !calendarAgenda || !calendarMonthLabel || !calendarMonthSummary) return;
    calendarMonths = getCalendarMonths();
    const undatedCount = eventMetadata.filter((event) => event.timestamp === null).length;
    if (!calendarMonths.length) {
      calendarMonthLabel.textContent = "Event calendar";
      calendarMonthSummary.textContent = undatedCount
        ? `${undatedCount} event${undatedCount === 1 ? "" : "s"} have no calendar date.`
        : "No dated events are available to show right now.";
      calendarGrid.innerHTML = "";
      calendarAgenda.innerHTML = "";
      if (calendarPrevMonth) calendarPrevMonth.disabled = true;
      if (calendarNextMonth) calendarNextMonth.disabled = true;
      return;
    }
    calendarMonthIndex = Math.max(0, Math.min(calendarMonthIndex, calendarMonths.length - 1));
    const activeMonth = calendarMonths[calendarMonthIndex];
    const activeMonthEvents = eventMetadata
      .filter((event) => event.dateObject && event.dateObject.getFullYear() === activeMonth.getFullYear() && event.dateObject.getMonth() === activeMonth.getMonth())
      .sort((left, right) => left.timestamp - right.timestamp);
    const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = (new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1).getDay() + 6) % 7;
    const today = new Date();
    calendarMonthLabel.textContent = monthFormatter.format(activeMonth);
    calendarMonthSummary.textContent = undatedCount
      ? `${activeMonthEvents.length} dated events in view. ${undatedCount} without a calendar date stay in the list.`
      : `${activeMonthEvents.length} dated events in view.`;
    const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .map((label) => `<div class="calendar-weekday">${label}</div>`)
      .join("");
    const dayCells = [];
    for (let blankIndex = 0; blankIndex < firstDayIndex; blankIndex += 1) {
      dayCells.push('<div class="calendar-day is-empty" aria-hidden="true"></div>');
    }
    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      const dayEvents = activeMonthEvents.filter((event) => event.dateObject.getDate() === dayNumber);
      const isToday = today.getFullYear() === activeMonth.getFullYear() && today.getMonth() === activeMonth.getMonth() && today.getDate() === dayNumber;
      dayCells.push(`
        <div class="calendar-day${isToday ? " is-today" : ""}">
          <span class="calendar-day-number">${dayNumber}</span>
          ${dayEvents.map((event) => `
            <button type="button" class="calendar-event-pill ${event.isUpcoming ? "calendar-event-pill--upcoming" : "calendar-event-pill--past"}" data-event-target="${escapeHtml(event.id)}">
              ${escapeHtml(event.title)}
            </button>
          `).join("") || '<span class="text-xs text-gray-400">No events</span>'}
        </div>
      `);
    }
    calendarGrid.innerHTML = weekdayLabels + dayCells.join("");
    calendarAgenda.innerHTML = activeMonthEvents.length
      ? activeMonthEvents.map((event) => `
          <button type="button" class="calendar-agenda-item" data-event-target="${escapeHtml(event.id)}">
            <span class="calendar-agenda-date">
              <strong>${event.dateObject.getDate()}</strong>
              <span>${agendaDayFormatter.format(event.dateObject)}</span>
            </span>
            <span>
              <span class="block text-base font-bold text-gray-900">${escapeHtml(event.title)}</span>
              <span class="mt-1 block text-sm text-gray-500">${escapeHtml(event.dateLabel)}</span>
              <span class="mt-1 block text-sm text-gray-500">${escapeHtml(event.locationLabel)}</span>
            </span>
          </button>
        `).join("")
      : '<div class="calendar-empty-state">No events fall within this month.</div>';
    if (calendarPrevMonth) calendarPrevMonth.disabled = calendarMonthIndex === 0;
    if (calendarNextMonth) calendarNextMonth.disabled = calendarMonthIndex === calendarMonths.length - 1;
  };

  const setActiveViewButton = (view) => {
    viewButtons.forEach((button) => {
      const isActive = button.getAttribute("data-events-view") === view;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  const setView = (view) => {
    currentView = view;
    setActiveViewButton(view);
    if (viewRoot) viewRoot.setAttribute("data-events-view", view);
    const isCalendar = view === "calendar";
    if (standardView) standardView.classList.toggle("hidden", isCalendar);
    if (calendarView) calendarView.classList.toggle("hidden", !isCalendar);
    if (isCalendar) renderCalendar();
  };

  const revealEventCard = (card) => {
    card.hidden = false;
    const pastDetails = document.getElementById("past-events-section");
    if (pastDetails && card.closest("#past-events-list")) pastDetails.open = true;
    const toggleButton = card.querySelector(".event-card-toggle");
    if (toggleButton && !card.classList.contains("is-expanded")) toggleButton.click();
    window.setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const refresh = () => {
    placeByClock(new Date());
    sortCollection(upcomingList);
    sortCollection(pastList);
    applyShowMore(upcomingList);
    applyShowMore(pastList);
    eventMetadata = buildMetadata();
    if (currentView === "calendar") renderCalendar();
  };

  const sortLabel = document.getElementById("eventSortLabel");
  const sortToggle = document.getElementById("eventSortToggle");
  if (sortToggle) {
    sortToggle.addEventListener("click", () => {
      newestFirst = !newestFirst;
      if (sortLabel) sortLabel.textContent = newestFirst ? "Order: Newest to Oldest" : "Order: Oldest to Newest";
      refresh();
    });
  }

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.getAttribute("data-events-view");
      if (!nextView || nextView === currentView) return;
      setView(nextView);
    });
  });

  if (calendarPrevMonth) {
    calendarPrevMonth.addEventListener("click", () => {
      if (calendarMonthIndex === 0) return;
      calendarMonthIndex -= 1;
      renderCalendar();
    });
  }
  if (calendarNextMonth) {
    calendarNextMonth.addEventListener("click", () => {
      if (calendarMonthIndex >= calendarMonths.length - 1) return;
      calendarMonthIndex += 1;
      renderCalendar();
    });
  }
  if (calendarView) {
    calendarView.addEventListener("click", (event) => {
      const targetButton = event.target.closest("[data-event-target]");
      if (!targetButton) return;
      const targetCard = document.getElementById(targetButton.getAttribute("data-event-target"));
      if (!targetCard) return;
      setView("list");
      revealEventCard(targetCard);
    });
  }
  if (calendarViewAllEvents) {
    calendarViewAllEvents.addEventListener("click", () => {
      setView("list");
      if (standardView) standardView.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  document.querySelectorAll(".event-card").forEach((card) => {
    const toggleButton = card.querySelector(".event-card-toggle");
    const hiddenContent = card.querySelector(".event-card-hidden");
    if (!toggleButton || !hiddenContent) {
      if (toggleButton) toggleButton.hidden = true;
      return;
    }
    const icon = toggleButton.querySelector("i");
    toggleButton.addEventListener("click", () => {
      const isExpanded = card.classList.toggle("is-expanded");
      card.classList.toggle("is-collapsed", !isExpanded);
      hiddenContent.style.maxHeight = isExpanded ? `${hiddenContent.scrollHeight}px` : "0";
      toggleButton.firstChild.textContent = isExpanded ? "Show less " : "Read more ";
      if (icon) icon.setAttribute("data-lucide", isExpanded ? "chevron-up" : "chevron-down");
      if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    });
  });

  refresh();
  const initialMonths = getCalendarMonths();
  if (initialMonths.length) {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const nearest = initialMonths.findIndex((month) => month.getTime() >= currentMonthStart);
    calendarMonthIndex = nearest === -1 ? initialMonths.length - 1 : nearest;
  }
  setView("list");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
