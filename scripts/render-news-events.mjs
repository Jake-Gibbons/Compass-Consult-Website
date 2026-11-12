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

function summaryText(entry) {
  const first = (entry.paragraphs || []).find((paragraph) => paragraph.trim()) || entry.subtitle || "";
  const clean = first.replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).replace(/\s+\S*$/, "")}…`;
}

function dateBlock(entry) {
  const schedule = entry.schedule || {};
  const label = schedule.dateLabel || "Date not stated";
  if (schedule.precision === "day-month") {
    const match = label.match(/(\d{1,2})\s+([A-Za-z]+)/);
    return {
      day: match?.[1] || "",
      month: match?.[2]?.slice(0, 3) || label,
      year: "Year not stated",
      time: ""
    };
  }
  if (!schedule.start || schedule.precision === "unknown") {
    return { day: "", month: "", year: "", time: "", undated: "Date not stated" };
  }
  const dayKey = schedule.start.slice(0, 10);
  const [year, monthNumber, day] = dayKey.split("-");
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(`${dayKey}T12:00:00Z`));
  let time = "";
  if (String(schedule.start).includes("T") && schedule.allDay !== true) {
    const clock = (value) => {
      const match = String(value).match(/T(\d{2}):(\d{2})/);
      if (!match) return "";
      const hours = Number(match[1]);
      const suffix = hours >= 12 ? "pm" : "am";
      const hour12 = hours % 12 || 12;
      return `${hour12}:${match[2]}${suffix}`;
    };
    const startTime = clock(schedule.start);
    const endTime = schedule.end ? clock(schedule.end) : "";
    time = endTime && endTime !== startTime ? `${startTime}–${endTime}` : startTime;
  }
  return { day: String(Number(day)), month, year, time };
}

function primaryLink(entry) {
  const links = entry.links || [];
  const linkedin = links.find((link) => /linkedin\.com/i.test(link.href || ""));
  if (linkedin) return { href: linkedin.href, label: "Read on LinkedIn" };
  const external = links.find((link) => /^https?:/i.test(link.href || ""));
  if (!external) return null;
  return { href: external.href, label: entry.kind === "event" ? "Event details" : external.label || "Event details" };
}

function renderDateBlock(parts) {
  if (parts.undated) {
    return `<div class="story-date story-date-undated"><span>${escapeHtml(parts.undated)}</span></div>`;
  }
  return `<div class="story-date">
    ${parts.day ? `<span class="story-date-day">${escapeHtml(parts.day)}</span>` : ""}
    <span class="story-date-month">${escapeHtml(parts.month)}</span>
    <span class="story-date-year">${escapeHtml(parts.year)}</span>
  </div>`;
}

function renderStoryCard(entry, placement) {
  const parts = datePartsSafe(entry);
  const kindLabel = entry.kind === "news" ? "News" : "Event";
  const link = primaryLink(entry);
  const chips = [
    parts.time ? `<li>${escapeHtml(parts.time)}</li>` : "",
    entry.location ? `<li>${escapeHtml(entry.location)}</li>` : ""
  ].join("");
  const action = link
    ? `<a class="story-action" href="${escapeHtml(link.href)}"${/^https?:/i.test(link.href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(link.label)}</a>`
    : "";
  return `<article ${dataAttributes(entry, placement)} class="story-card" data-search="${escapeHtml(`${entry.title} ${entry.subtitle || ""} ${entry.location || ""} ${summaryText(entry)}`.toLowerCase())}">
    ${renderDateBlock(parts)}
    <div class="story-body">
      <p class="story-meta"><span class="story-tag">${kindLabel}</span>${entry.kicker ? `<span class="story-kicker">${escapeHtml(entry.kicker)}</span>` : ""}</p>
      <h3 class="story-title">${escapeHtml(entry.title)}</h3>
      ${entry.subtitle ? `<p class="story-subtitle">${escapeHtml(entry.subtitle)}</p>` : ""}
      <p class="story-summary">${escapeHtml(summaryText(entry))}</p>
      ${chips ? `<ul class="story-chips">${chips}</ul>` : ""}
      <div class="story-actions">${action}</div>
      <details class="story-more">
        <summary>Full details</summary>
        <div class="story-full">${renderBody(entry)}</div>
      </details>
    </div>
  </article>`;
}

function datePartsSafe(entry) {
  return dateBlock(entry);
}

export function renderEventCard(entry, placement) {
  return renderStoryCard(entry, placement);
}

export function renderNewsCard(entry) {
  return renderStoryCard(entry, "news");
}

function byStart(left, right, direction) {
  const leftStart = left.schedule?.start || "";
  const rightStart = right.schedule?.start || "";
  if (!leftStart && !rightStart) return (left.feedOrder || 0) - (right.feedOrder || 0);
  if (!leftStart) return 1;
  if (!rightStart) return -1;
  const delta = leftStart < rightStart ? -1 : leftStart > rightStart ? 1 : 0;
  return direction === "soonest" ? delta : -delta;
}

export function renderRegion(catalogue, now) {
  const errors = validateCatalogue(catalogue);
  if (errors.length) throw new Error(errors.join("\n"));
  const events = catalogue.entries.filter((entry) => entry.kind === "event");
  const upcoming = events.filter((entry) => resolvedPlacement(entry, now) === "upcoming").sort((left, right) => byStart(left, right, "soonest"));
  const past = events.filter((entry) => resolvedPlacement(entry, now) !== "upcoming").sort((left, right) => byStart(left, right, "newest"));
  const latest = sortNews(catalogue.entries, "latest");
  const archive = sortNews(catalogue.entries, "archive");
  const coverage = catalogue.coverage?.publicNote || "";
  return `${START}
<div class="story-controls">
  <p class="story-intro">${escapeHtml(coverage)}</p>
  <div class="story-filters">
    <div class="story-tabs" role="tablist" aria-label="Filter news and events">
      <button type="button" class="story-tab is-active" role="tab" id="filter-all" aria-selected="true" aria-controls="story-lists" data-filter="all">All</button>
      <button type="button" class="story-tab" role="tab" id="filter-event" aria-selected="false" aria-controls="story-lists" data-filter="event">Events</button>
      <button type="button" class="story-tab" role="tab" id="filter-news" aria-selected="false" aria-controls="story-lists" data-filter="news">News</button>
    </div>
    <label class="story-search-label" for="story-search">Search</label>
    <input id="story-search" class="story-search" type="search" placeholder="Search titles and places" autocomplete="off">
  </div>
  <p id="story-search-empty" class="story-empty" hidden>Nothing matches that search.</p>
</div>
<div id="story-lists">
<section id="upcoming-section" class="story-section" data-section-kind="event">
  <h2>Upcoming events</h2>
  <p class="story-section-note">Soonest first. Times use the Europe/London clock.</p>
  <p id="upcoming-empty" class="story-empty"${upcoming.length ? " hidden" : ""}>No upcoming events are listed at the moment.</p>
  <div id="upcoming-events-list" class="story-list" data-events-managed="true">
    ${upcoming.map((entry) => renderStoryCard(entry, "upcoming")).join("\n")}
  </div>
</section>
<section id="news-section" class="story-section" data-section-kind="news">
  <h2>Latest news</h2>
  <p class="story-section-note">Newest company updates first. Items without a publication time stay in the order they were reviewed.</p>
  <div id="latest-news-list" class="story-list">
    ${latest.map((entry) => renderStoryCard(entry, "news")).join("\n")}
  </div>
</section>
<details id="past-events-section" class="story-archive" data-section-kind="event">
  <summary>Past events <span class="story-count">${past.length}</span></summary>
  <div id="past-events-list" class="story-list" data-events-managed="true">
    ${past.map((entry) => renderStoryCard(entry, "past")).join("\n")}
  </div>
</details>
<details id="news-archive" class="story-archive" data-section-kind="news">
  <summary>Earlier news <span class="story-count">${archive.length}</span></summary>
  <div id="news-archive-list" class="story-list">
    ${archive.map((entry) => renderStoryCard(entry, "news")).join("\n")}
  </div>
</details>
</div>
${END}`;
}

function splicePage(html, region) {
  if (!html.includes(START) || !html.includes(END)) {
    throw new Error("Could not find the news and events region.");
  }
  return html.replace(new RegExp(`${START}[\\s\\S]*${END}`), region);
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalogue = JSON.parse(readFileSync(dataPath, "utf8"));
  const now = process.env.NEWS_EVENTS_NOW ? new Date(process.env.NEWS_EVENTS_NOW) : new Date();
  const html = readFileSync(pagePath, "utf8");
  writeFileSync(pagePath, splicePage(html, renderRegion(catalogue, now)));
  console.log(`Rendered news and events as of ${now.toISOString()}`);
}
