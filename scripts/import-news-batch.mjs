import { readFileSync, writeFileSync } from "node:fs";
import { formatLondonDate, londonDateKey } from "../js/news-events-status.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cataloguePath = path.join(rootDir, "data", "news-events.json");
const statePath = path.join(rootDir, "data", "linkedin-sync-state.json");
const ID_PATTERN = /(?:activity|ugcPost|share)[:/-](\d{8,})/g;

function idsIn(value) {
  return [...String(value || "").matchAll(ID_PATTERN)].map((match) => match[1]);
}

function knownIds(catalogue, state) {
  const ids = new Set(state?.processedActivityIds || []);
  for (const entry of catalogue.entries || []) {
    for (const source of entry.sources || []) {
      if (source.activityId) ids.add(String(source.activityId));
      for (const id of idsIn(source.url)) ids.add(id);
    }
    for (const link of entry.links || []) {
      for (const id of idsIn(link.href)) ids.add(id);
    }
  }
  for (const held of catalogue.held || []) {
    if (held.activityId) ids.add(String(held.activityId));
  }
  return ids;
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isDateTime(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

export function validateBatch(batch) {
  const errors = [];
  if (!batch || typeof batch !== "object") return ["Batch must be a JSON object."];
  if (batch.account !== "company") errors.push("Batch account must be company. Personal profile posts are not imported.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(batch.collectedOn || "")) errors.push("Batch collectedOn must be YYYY-MM-DD.");
  if (!Array.isArray(batch.posts)) errors.push("Batch posts must be an array in newest-first company feed order.");
  for (const [index, post] of (batch.posts || []).entries()) {
    const label = `posts[${index}]`;
    if (!post || typeof post !== "object") {
      errors.push(`${label} must be an object.`);
      continue;
    }
    if (post.publishedAt && post.publishedAtSource !== "linkedin-api") {
      errors.push(`${label} must not include publishedAt. Do not invent a publication time.`);
    }
    if (post.publishedAtSource === "linkedin-api" && !/^\d{4}-\d{2}-\d{2}T/.test(post.publishedAt || "")) {
      errors.push(`${label} linkedin-api publishedAt must be an ISO timestamp.`);
    }
    if (!/^\d{8,}$/.test(String(post.activityId || ""))) errors.push(`${label} needs a numeric activityId.`);
    if (!String(post.canonicalSourceUrl || "").includes(String(post.activityId || "missing"))) {
      errors.push(`${label} canonicalSourceUrl must contain its activityId.`);
    }
    if (!String(post.canonicalSourceUrl || "").startsWith("https://www.linkedin.com/")) {
      errors.push(`${label} canonicalSourceUrl must be a LinkedIn https URL.`);
    }
    if (!String(post.body || "").trim()) errors.push(`${label} needs the full post body.`);
    if (!String(post.title || "").trim()) errors.push(`${label} needs a title.`);
    if (post.kind !== "news" && post.kind !== "event") errors.push(`${label} kind must be news or event.`);
    if (post.kind === "event") {
      const event = post.event || {};
      const start = event.start || null;
      if (start && !isDate(start) && !isDateTime(start)) errors.push(`${label} event.start must be YYYY-MM-DD or YYYY-MM-DDTHH:mm.`);
      if (event.end && !isDate(event.end) && !isDateTime(event.end)) errors.push(`${label} event.end must be YYYY-MM-DD or YYYY-MM-DDTHH:mm.`);
      if (!start && event.sectionStatus !== "upcoming" && event.sectionStatus !== "past") {
        errors.push(`${label} undated event needs event.sectionStatus of upcoming or past.`);
      }
    }
  }
  return errors;
}

function scheduleFor(post) {
  if (post.kind !== "event") {
    if (post.publishedAtSource === "linkedin-api" && post.publishedAt) {
      const published = new Date(post.publishedAt);
      const day = londonDateKey(published);
      return {
        precision: "date",
        allDay: true,
        start: day,
        end: day,
        editorialPlacement: "news",
        dateLabel: formatLondonDate(published)
      };
    }
    return {
      precision: "unknown",
      allDay: false,
      start: null,
      end: null,
      editorialPlacement: "news",
      dateLabel: "Source-linked"
    };
  }
  const event = post.event || {};
  if (!event.start) {
    return {
      precision: "unknown",
      allDay: false,
      start: null,
      end: null,
      editorialPlacement: event.sectionStatus,
      dateLabel: event.dateLabel || "Date not stated"
    };
  }
  const allDay = event.allDay === true || !String(event.start).includes("T");
  return {
    precision: allDay ? "date" : "datetime",
    allDay,
    start: event.start,
    end: event.end || event.start,
    editorialPlacement: event.sectionStatus || "upcoming",
    dateLabel: event.dateLabel || event.start
  };
}

function entryFromPost(post) {
  const paragraphs = [String(post.body).trim()];
  if (post.attendance) paragraphs.push(String(post.attendance).trim());
  const links = [
    { label: "Company LinkedIn post", href: post.canonicalSourceUrl },
    ...((post.links || []).map((link) => ({ label: link.label, href: link.href || link.url })))
  ];
  return {
    id: `${post.kind}-${post.activityId}`,
    baseline: false,
    kind: post.kind,
    title: String(post.title).trim(),
    subtitle: post.subtitle || null,
    paragraphs,
    links,
    sources: [{ role: "company", activityId: String(post.activityId), url: post.canonicalSourceUrl }],
    image: null,
    icon: post.kind === "news" ? "newspaper" : "calendar-days",
    location: post.kind === "event" ? (post.event?.location || null) : null,
    newsList: post.kind === "news" ? "latest" : null,
    feedOrder: null,
    relativeTimeLabel: post.relativeTimeLabel || null,
    collectedOn: post.collectedOn || null,
    schedule: scheduleFor(post),
    ...(post.publishedAtSource === "linkedin-api" && post.publishedAt
      ? { publishedAt: post.publishedAt, publishedAtSource: "linkedin-api" }
      : {})
  };
}

export function importCompanyBatch({ catalogue, state, batch }) {
  const errors = validateBatch(batch);
  if (errors.length) return { ok: false, errors, catalogue, state, added: [], skipped: [] };
  const next = structuredClone(catalogue);
  const nextState = structuredClone(state || { processedActivityIds: [] });
  const seen = knownIds(next, nextState);
  const added = [];
  const skipped = [];
  for (const post of batch.posts) {
    const activityId = String(post.activityId);
    if (seen.has(activityId)) {
      skipped.push(activityId);
      continue;
    }
    added.push(entryFromPost({ ...post, collectedOn: post.collectedOn || batch.collectedOn }));
    seen.add(activityId);
  }
  if (added.length) {
    const newsAdded = added.filter((entry) => entry.kind === "news");
    for (const entry of next.entries) {
      if (entry.kind === "news" && entry.newsList === "latest" && Number.isInteger(entry.feedOrder)) {
        entry.feedOrder += newsAdded.length;
      }
    }
    newsAdded.forEach((entry, index) => {
      entry.feedOrder = index + 1;
    });
    next.entries.push(...added);
  }
  nextState.account = "company";
  nextState.feedUrl = batch.feedUrl || nextState.feedUrl;
  nextState.processedActivityIds = [...seen].sort();
  if (batch.posts[0]) {
    nextState.newestActivityId = String(batch.posts[0].activityId);
    nextState.newestCanonicalUrl = batch.posts[0].canonicalSourceUrl;
  }
  nextState.lastCollectedOn = batch.collectedOn;
  nextState.lastAdded = added.map((entry) => entry.id);
  nextState.note = "newestActivityId is the first post in the newest-first batch. It is not a publication date.";
  return { ok: true, errors: [], catalogue: next, state: nextState, added: added.map((entry) => entry.id), skipped };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const batchPath = process.argv[2];
  if (!batchPath) {
    console.error("Usage: npm run news:import -- <batch.json>");
    process.exit(1);
  }
  const result = importCompanyBatch({
    catalogue: readJson(cataloguePath),
    state: readJson(statePath),
    batch: readJson(path.resolve(batchPath))
  });
  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exit(1);
  }
  writeFileSync(cataloguePath, `${JSON.stringify(result.catalogue, null, 2)}\n`);
  writeFileSync(statePath, `${JSON.stringify(result.state, null, 2)}\n`);
  console.log(`Added ${result.added.length}, skipped ${result.skipped.length}. Newest activity ${result.state.newestActivityId}.`);
  if (result.added.length) console.log("Run npm run render:news before committing the page.");
}
