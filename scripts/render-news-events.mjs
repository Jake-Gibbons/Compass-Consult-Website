import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolvedPlacement,
  sortEvents,
  sortNews,
  validateCatalogue
} from "../js/news-events-status.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "data", "news-events.json");
const pagePath = path.join(rootDir, "pages", "events.html");
const START = "<!-- NEWS_EVENTS_RENDER_START -->";
const END = "<!-- NEWS_EVENTS_RENDER_END -->";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLinks(links) {
  if (!links?.length) return "";
  return `<div class="flex flex-wrap items-center gap-4 mt-4">${links.map((link) => {
    const external = /^https?:/i.test(link.href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${escapeHtml(link.href)}"${attrs} class="text-amber-600 text-sm font-bold hover:underline inline-flex items-center gap-1">${escapeHtml(link.label)} <i data-lucide="arrow-right" class="w-3 h-3"></i></a>`;
  }).join("")}</div>`;
}

function renderBody(entry) {
  const paragraphs = (entry.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const lists = (entry.lists || []).map((list) => {
    const heading = list.heading ? `<p><strong>${escapeHtml(list.heading)}</strong></p>` : "";
    const items = (list.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `${heading}<ul class="list-disc list-inside">${items}</ul>`;
  }).join("");
  return `${paragraphs}${lists}${renderLinks(entry.links)}`;
}

function dataAttributes(entry, placement) {
  const schedule = entry.schedule || {};
  const attrs = [
    `id="${escapeHtml(entry.id)}"`,
    `data-kind="${escapeHtml(entry.kind)}"`,
    `data-date-precision="${escapeHtml(schedule.precision || "unknown")}"`,
    `data-all-day="${schedule.allDay ? "true" : "false"}"`,
    `data-editorial-placement="${escapeHtml(schedule.editorialPlacement || placement)}"`,
    `data-date-label="${escapeHtml(schedule.dateLabel || "")}"`,
    `data-location-label="${escapeHtml(entry.location || "")}"`,
    `data-feed-order="${Number(entry.feedOrder || 0)}"`
  ];
  if (schedule.start) attrs.push(`data-event-start="${escapeHtml(schedule.start)}"`);
  if (schedule.end) attrs.push(`data-event-end="${escapeHtml(schedule.end)}"`);
  if (placement === "upcoming" || placement === "past") attrs.push(`data-resolved-placement="${placement}"`);
  return attrs.join(" ");
}

export function renderEventCard(entry, placement) {
  const image = entry.image
    ? `<div class="event-card-image"><img src="${escapeHtml(entry.image.src)}" alt="${escapeHtml(entry.image.alt || entry.title)}"></div>`
    : `<div class="event-card-image" style="background-color:#f3f0ff;display:flex;align-items:center;justify-content:center;"><i data-lucide="${escapeHtml(entry.icon || "calendar-days")}" class="w-12 h-12 text-compass-purple"></i></div>`;
  const location = entry.location
    ? `<div class="event-card-detail-item"><i data-lucide="map-pin" class="w-4 h-4 flex-shrink-0"></i><span>${escapeHtml(entry.location)}</span></div>`
    : "";
  const subdued = placement === "past" ? " opacity-80 hover:opacity-100 transition-opacity" : "";
  return `<article ${dataAttributes(entry, placement)} class="event-card is-collapsed bg-white p-8 rounded-lg shadow-md border border-gray-100${subdued}">
    ${image}
    <div class="event-card-summary">
      <h2>${escapeHtml(entry.title)}</h2>
      ${entry.subtitle ? `<h3>${escapeHtml(entry.subtitle)}</h3>` : ""}
      <div class="event-card-details">
        <div class="event-card-detail-item"><i data-lucide="calendar" class="w-4 h-4 flex-shrink-0"></i><span>${escapeHtml(entry.schedule.dateLabel)}</span></div>
        ${location}
      </div>
    </div>
    <div class="event-card-hidden text-gray-700 space-y-4">${renderBody(entry)}</div>
    <button type="button" class="event-card-toggle inline-flex items-center gap-1 rounded-full border border-compass-purple px-4 py-2 text-sm font-semibold text-compass-purple hover:bg-purple-50 transition-colors">Read more <i data-lucide="chevron-down" class="w-4 h-4"></i></button>
  </article>`;
}

export function renderNewsCard(entry) {
  const icon = entry.icon || "newspaper";
  return `<article ${dataAttributes(entry, "news")} class="bg-white p-8 rounded-lg shadow-md border border-gray-100">
    <div class="flex flex-col md:flex-row md:gap-8 items-start">
      <div class="w-full md:w-1/3 flex-shrink-0 mb-6 md:mb-0 bg-purple-50 min-h-40 flex flex-col items-center justify-center rounded-lg border border-purple-100 px-6 py-8 text-center">
        <i data-lucide="${escapeHtml(icon)}" class="w-12 h-12 text-compass-purple mb-2"></i>
        <span class="text-compass-purple font-bold text-lg">${escapeHtml(entry.schedule.dateLabel)}</span>
        ${entry.kicker ? `<span class="text-sm text-gray-500 mt-1">${escapeHtml(entry.kicker)}</span>` : ""}
      </div>
      <div class="w-full md:w-2/3">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">${escapeHtml(entry.title)}</h2>
        <div class="prose max-w-none text-gray-700 space-y-4">${renderBody(entry)}</div>
      </div>
    </div>
  </article>`;
}

export function renderRegion(catalogue, now) {
  const errors = validateCatalogue(catalogue);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  const events = sortEvents(catalogue.entries.filter((entry) => entry.kind === "event"));
  const upcoming = [];
  const past = [];
  for (const entry of events) {
    const placement = resolvedPlacement(entry, now);
    (placement === "upcoming" ? upcoming : past).push(renderEventCard(entry, placement));
  }
  const latest = sortNews(catalogue.entries, "latest").map(renderNewsCard).join("\n");
  const archive = sortNews(catalogue.entries, "archive").map(renderNewsCard).join("\n");
  const coverage = catalogue.coverage?.publicNote || "";
  return `${START}
<div>
  <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Upcoming events</h2>
  <p id="upcoming-empty" class="text-center text-gray-600 mb-8"${upcoming.length ? " hidden" : ""}>No upcoming events are listed at the moment.</p>
  <div id="upcoming-events-list" class="events-collection space-y-12" data-events-managed="true">
    ${upcoming.join("\n")}
  </div>
</div>
<details id="past-events-section" class="events-disclosure pt-12 border-t border-gray-100" open>
  <summary class="text-3xl font-bold text-gray-900 mb-8 text-center">Past events</summary>
  <div id="past-events-list" class="events-collection space-y-8" data-events-managed="true">
    ${past.join("\n")}
  </div>
</details>
<div id="news-section" class="pt-12 border-t border-gray-100">
  <h2 class="text-3xl font-bold text-gray-900 mb-4 text-center">Latest news</h2>
  <p class="text-center text-gray-600 max-w-3xl mx-auto mb-8">${escapeHtml(coverage)}</p>
  <div id="latest-news-list" class="space-y-12">${latest}</div>
  <details id="news-archive" class="events-disclosure pt-12" open>
    <summary class="text-2xl font-bold text-gray-900 mb-8 text-center">Earlier updates</summary>
    <div id="news-archive-list" class="space-y-12">${archive}</div>
  </details>
</div>
${END}`;
}

const CALENDAR_SHELL = `
                </div>
                <div id="events-calendar-view" class="hidden" aria-live="polite">
                    <div class="calendar-shell" data-aos="fade-up">
                        <div class="calendar-toolbar">
                            <button id="calendarPrevMonth" type="button" class="calendar-nav-button" aria-label="Show previous event month">
                                <span class="calendar-nav-glyph" aria-hidden="true">&larr;</span>
                                <span>Prev</span>
                            </button>
                            <div>
                                <p id="calendarMonthLabel" class="calendar-month-label">Event calendar</p>
                                <p id="calendarMonthSummary" class="calendar-month-summary">Browse events by month.</p>
                            </div>
                            <button id="calendarNextMonth" type="button" class="calendar-nav-button" aria-label="Show next event month">
                                <span>Next</span>
                                <span class="calendar-nav-glyph" aria-hidden="true">&rarr;</span>
                            </button>
                        </div>
                        <div class="calendar-grid-scroll">
                            <div id="eventsCalendarGrid" class="calendar-grid"></div>
                        </div>
                        <div class="calendar-agenda">
                            <div class="calendar-agenda-header">
                                <h3 class="text-xl font-bold text-gray-900">Events this month</h3>
                                <button id="calendarViewAllEvents" type="button" class="calendar-view-all-button">View full list</button>
                            </div>
                            <div id="eventsCalendarAgenda" class="calendar-agenda-list"></div>
                        </div>
                    </div>
                </div>
                </div>
`;

function splicePage(html, region) {
  const newsAt = region.indexOf('<div id="news-section"');
  if (newsAt === -1) throw new Error("News section missing from render.");
  const eventsPart = region.slice(0, newsAt);
  const newsPart = region.slice(newsAt);
  if (html.includes(START) && html.includes(END)) {
    return html.replace(new RegExp(`${START}[\\s\\S]*${END}`), `${eventsPart}${CALENDAR_SHELL}\n${newsPart}`);
  }
  const start = html.indexOf("<!-- Upcoming Events -->");
  const end = html.indexOf("<!-- Footer -->");
  if (start === -1 || end === -1) throw new Error("Could not find the news and events region.");
  return `${html.slice(0, start)}${eventsPart}${CALENDAR_SHELL}\n${newsPart}\n            </div>\n        </section>\n\n        ${html.slice(end)}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalogue = JSON.parse(readFileSync(dataPath, "utf8"));
  const now = process.env.NEWS_EVENTS_NOW ? new Date(process.env.NEWS_EVENTS_NOW) : new Date();
  const html = readFileSync(pagePath, "utf8");
  writeFileSync(pagePath, splicePage(html, renderRegion(catalogue, now)));
  console.log(`Rendered news and events as of ${now.toISOString()}`);
}
