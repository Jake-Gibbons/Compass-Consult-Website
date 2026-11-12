/**
 * Europe/London placement for news and events.
 * Unknown dates and day/month labels are preserved. They are never turned into a year.
 */

const LONDON = "Europe/London";

const BASELINE_IDS = [
  "iep-basecamp-2026",
  "esec-liverpool-2026",
  "ersa-annual-conference",
  "cfp26",
  "employment-skills-convention-2026",
  "bcc-global-conference-2026",
  "iep-summit-2026",
  "iep-talks-cardiff-2026",
  "iep-talks-birmingham-2026",
  "iep-fellows-chester-2026",
  "iep-manchester-2026",
  "iep-stockholm-2026",
  "venturefest-wm-2026",
  "connecting-wales-2026",
  "apprenticeships-conference-2026",
  "neet-work-foundation-2026",
  "clf-youth-guarantee-webinar",
  "news-youth-jobs-grant",
  "news-1000-youth-workers"
];

export function formatLondonDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function londonDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function londonWallClockAsUtc(instant) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(instant);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = map.hour === "24" ? "00" : map.hour;
  return Date.parse(`${map.year}-${map.month}-${map.day}T${hour}:${map.minute}:${map.second}Z`);
}

/** Convert a Europe/London civil timestamp (no offset) to a UTC Date. */
export function londonCivilToUtc(civil) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(civil);
  if (!match) {
    throw new Error(`Invalid civil timestamp: ${civil}`);
  }
  const desired = Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4] || "00"}:${match[5] || "00"}:00Z`);
  let guess = desired;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const shown = londonWallClockAsUtc(guess);
    const delta = desired - shown;
    if (delta === 0) break;
    guess += delta;
  }
  return new Date(guess);
}

function dateOnly(value) {
  return String(value).slice(0, 10);
}

/**
 * @returns {"upcoming"|"past"|null} null means keep the editorial placement
 */
export function classifyEvent(schedule, now) {
  if (!schedule || schedule.precision === "unknown" || schedule.precision === "day-month") {
    return null;
  }
  if (!schedule.start) return null;

  const allDay = schedule.allDay === true || !String(schedule.start).includes("T");
  if (allDay) {
    const start = dateOnly(schedule.start);
    const end = dateOnly(schedule.end || schedule.start);
    const today = londonDateKey(now);
    if (today < start) return "upcoming";
    if (today > end) return "past";
    return "upcoming";
  }

  const endCivil = schedule.end || schedule.start;
  const endInstant = londonCivilToUtc(endCivil);
  return now.getTime() >= endInstant.getTime() ? "past" : "upcoming";
}

export function resolvedPlacement(entry, now) {
  if (entry.kind === "news") return "news";
  const automatic = classifyEvent(entry.schedule, now);
  if (automatic) return automatic;
  return entry.schedule?.editorialPlacement || "past";
}

export function newsListFor(entry) {
  if (entry.kind !== "news") return null;
  const relative = String(entry.relativeTimeLabel || "");
  const months = /^(\d+)\s*mo/i.exec(relative);
  // Two months or more is archive. A one-month label can stay in the explicit latest list.
  if (months && Number(months[1]) >= 2) return "archive";
  if (entry.newsList === "latest" || entry.newsList === "archive") return entry.newsList;
  return "archive";
}

function activityIdsInText(value) {
  if (!value) return [];
  const ids = [];
  const pattern = /(?:activity|ugcPost|share)[:/-](\d{8,})/g;
  let match = pattern.exec(String(value));
  while (match) {
    ids.push(match[1]);
    match = pattern.exec(String(value));
  }
  return ids;
}

export function activityIdsForEntry(entry) {
  const found = [];
  for (const source of entry.sources || []) {
    found.push(...activityIdsInText(source.url), ...activityIdsInText(source.activityId));
  }
  for (const link of entry.links || []) {
    found.push(...activityIdsInText(link.href));
  }
  return [...new Set(found)];
}

export function imageFieldErrors(image, label) {
  if (image == null) return [];
  const errors = [];
  const src = String(image.src || "");
  if (!src.startsWith("/assets/images/") || src.includes("..") || /^https?:/i.test(src) || /licdn|media\.licdn/i.test(src)) {
    errors.push(`${label} image must be a local file under /assets/images/`);
  }
  if (!String(image.alt || "").trim()) errors.push(`${label} image needs alt text`);
  if (!Number.isInteger(image.width) || image.width < 1 || !Number.isInteger(image.height) || image.height < 1) {
    errors.push(`${label} image width and height must be positive integers`);
  }
  return errors;
}

export function validateCatalogue(catalogue) {
  const errors = [];
  const entries = catalogue.entries || [];
  const ids = new Set();
  const activities = new Map();

  for (const required of BASELINE_IDS) {
    if (!entries.some((entry) => entry.id === required && entry.baseline === true)) {
      errors.push(`Missing preserved baseline card ${required}`);
    }
  }

  for (const entry of entries) {
    if (ids.has(entry.id)) errors.push(`Duplicate id ${entry.id}`);
    ids.add(entry.id);

    if (entry.kind !== "news" && entry.kind !== "event") {
      errors.push(`${entry.id} has no kind`);
    }

    const label = `${entry.schedule?.dateLabel || ""} ${entry.title || ""}`;
    if (/^\s*recent\b/i.test(entry.schedule?.dateLabel || "") || /\brecent update\b/i.test(label)) {
      errors.push(`${entry.id} uses a Recent label`);
    }
    if ((entry.relativeAgeBucket === "months" || entry.relativeAgeBucket === "years") && entry.newsList === "latest") {
      errors.push(`${entry.id} is months old and must not sit in latest news`);
    }
    if (entry.kind === "news" && entry.newsList !== newsListFor(entry)) {
      errors.push(`${entry.id} news list ${entry.newsList} does not match its age bucket`);
    }
    if (entry.publishedAt && entry.publishedAtSource !== "linkedin-api") {
      errors.push(`${entry.id} sets publishedAt without a LinkedIn API timestamp`);
    }
    if (entry.publishedAtSource === "linkedin-api" && !/^\d{4}-\d{2}-\d{2}T/.test(entry.publishedAt || "")) {
      errors.push(`${entry.id} LinkedIn API publishedAt must be an ISO timestamp`);
    }
    if (entry.schedule?.precision === "day-month") {
      if (entry.schedule.start || entry.schedule.end) {
        errors.push(`${entry.id} day/month card must not have a machine start or end`);
      }
      if (/\d{4}/.test(entry.schedule.dateLabel || "")) {
        errors.push(`${entry.id} day/month label must not include a year`);
      }
    }
    if (entry.schedule?.precision === "unknown" && (entry.schedule.start || entry.schedule.end)) {
      errors.push(`${entry.id} unknown date must not have a machine start or end`);
    }
    errors.push(...imageFieldErrors(entry.image, entry.id));

    for (const activityId of activityIdsForEntry(entry)) {
      const previous = activities.get(activityId);
      const sameGroup = previous && entry.sourceGroup && previous.group === entry.sourceGroup;
      if (previous && previous.id !== entry.id && !sameGroup) {
        errors.push(`Activity ${activityId} is on both ${previous.id} and ${entry.id}`);
      }
      activities.set(activityId, { id: entry.id, group: entry.sourceGroup || null });
    }
  }

  for (const held of catalogue.held || []) {
    if (entries.some((entry) => entry.id === held.id)) {
      errors.push(`Held record ${held.id} must not also be published`);
    }
  }

  const news = entries.filter((entry) => entry.kind === "news" && Number.isInteger(entry.feedOrder));
  const orders = news.map((entry) => entry.feedOrder);
  if (new Set(orders).size !== orders.length) {
    errors.push("News feedOrder values must be unique");
  }

  return errors;
}

export function sortEvents(entries, direction = "newest") {
  const dated = [];
  const undated = [];
  for (const entry of entries) {
    if (entry.kind !== "event") continue;
    if (entry.schedule?.start && entry.schedule.precision !== "day-month" && entry.schedule.precision !== "unknown") {
      dated.push(entry);
    } else {
      undated.push(entry);
    }
  }
  dated.sort((left, right) => {
    const delta = left.schedule.start < right.schedule.start ? -1 : left.schedule.start > right.schedule.start ? 1 : 0;
    return direction === "newest" ? -delta : delta;
  });
  undated.sort((left, right) => (left.feedOrder || 0) - (right.feedOrder || 0));
  return [...dated, ...undated];
}

export function sortNews(entries, listName) {
  return entries
    .filter((entry) => entry.kind === "news" && entry.newsList === listName)
    .sort((left, right) => left.feedOrder - right.feedOrder);
}

export { BASELINE_IDS, LONDON };
