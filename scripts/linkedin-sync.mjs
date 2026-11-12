import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatLondonDate, londonDateKey } from "../js/news-events-status.mjs";
import { importCompanyBatch } from "./import-news-batch.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_URL = "https://api.linkedin.com/rest/posts";
const IMAGES_URL = "https://api.linkedin.com/rest/images";
const IMAGE_DIR = "assets/images/news-events";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const DEFAULT_VERSION = "202609";
const COMPANY_FEED = "https://www.linkedin.com/company/compass-consult-employability-and-skills-ltd/posts/?feedView=all";

const MONTHS = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12
};

const EVENT_WORDS = /\b(conference|summit|dinner|awards?|webinar|workshop|seminar|basecamp|attending|attend|save the date|join us)\b/i;

export function configurationMessage(env) {
  if (!env.LINKEDIN_ORG_ID) return "LinkedIn sync is not configured: set LINKEDIN_ORG_ID.";
  const canRefresh = env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET && env.LINKEDIN_REFRESH_TOKEN;
  if (!env.LINKEDIN_ACCESS_TOKEN && !canRefresh) {
    return "LinkedIn sync is not configured: set LINKEDIN_ACCESS_TOKEN, or LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET and LINKEDIN_REFRESH_TOKEN.";
  }
  return null;
}

export function organisationUrn(orgId) {
  const value = String(orgId).trim();
  if (value.startsWith("urn:li:organization:")) return value;
  return `urn:li:organization:${value}`;
}

export async function resolveAccessToken(env, fetchImpl) {
  if (env.LINKEDIN_ACCESS_TOKEN) return { token: env.LINKEDIN_ACCESS_TOKEN, refreshed: false };
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: env.LINKEDIN_REFRESH_TOKEN,
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET
  });
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) throw new Error(`LinkedIn token refresh failed (${response.status}).`);
  const payload = await response.json();
  if (!payload.access_token) throw new Error("LinkedIn token refresh did not return an access token.");
  return { token: payload.access_token, refreshed: true };
}

function headers(token, version) {
  return {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": version,
    "X-Restli-Protocol-Version": "2.0.0"
  };
}

export async function fetchAllPosts({ token, orgId, version, fetchImpl, count = 50 }) {
  const elements = [];
  let start = 0;
  for (let page = 0; page < 20; page += 1) {
    const url = new URL(POSTS_URL);
    url.searchParams.set("q", "author");
    url.searchParams.set("author", organisationUrn(orgId));
    url.searchParams.set("count", String(count));
    url.searchParams.set("start", String(start));
    url.searchParams.set("sortBy", "LAST_MODIFIED");
    const response = await fetchImpl(url, { headers: headers(token, version) });
    if (!response.ok) throw new Error(`LinkedIn posts request failed (${response.status}).`);
    const payload = await response.json();
    const batch = payload.elements || [];
    elements.push(...batch);
    if (!batch.length) break;
    const total = payload.paging?.total;
    start += batch.length;
    if (typeof total === "number" && start >= total) break;
    if (batch.length < count) break;
  }
  return elements;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function parseExplicitDate(text) {
  const source = String(text || "");
  const dayMonth = source.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})\b/i);
  const monthDay = source.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i);
  const iso = source.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  let year;
  let month;
  let day;
  if (dayMonth) {
    day = Number(dayMonth[1]);
    month = MONTHS[dayMonth[2].toLowerCase()];
    year = Number(dayMonth[3]);
  } else if (monthDay) {
    month = MONTHS[monthDay[1].toLowerCase()];
    day = Number(monthDay[2]);
    year = Number(monthDay[3]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    return null;
  }
  if (!month || day < 1 || day > 31) return null;
  const start = `${year}-${pad(month)}-${pad(day)}`;
  return { start, end: start, allDay: true, dateLabel: formatLondonDate(new Date(`${start}T12:00:00Z`)) };
}

function activityIdFromUrn(urn) {
  const match = String(urn || "").match(/(\d{8,})$/);
  return match ? match[1] : null;
}

function canonicalUrl(urn) {
  return `https://www.linkedin.com/feed/update/${urn}/`;
}

export function mediaImageId(post) {
  const id = post?.content?.media?.id || "";
  return String(id).startsWith("urn:li:image:") ? String(id) : null;
}

export async function fetchLinkedInImage({ token, version, mediaId, fetchImpl }) {
  const response = await fetchImpl(`${IMAGES_URL}/${encodeURIComponent(mediaId)}`, { headers: headers(token, version) });
  if (!response.ok) throw new Error(`LinkedIn image request failed (${response.status}).`);
  const payload = await response.json();
  if (!payload.downloadUrl) throw new Error("LinkedIn image response did not include downloadUrl.");
  return { downloadUrl: payload.downloadUrl, altText: payload.altText || "" };
}

export async function optimiseNewsImage(bytes) {
  const { default: sharp } = await import("sharp");
  const buffer = await sharp(bytes, { failOn: "none" }).rotate().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width, height: meta.height };
}

export async function saveOptimisedNewsImage({ bytes, activityId, alt, root = rootDir }) {
  const optimised = await optimiseNewsImage(bytes);
  const relative = `${IMAGE_DIR}/${activityId}.webp`;
  mkdirSync(path.join(root, IMAGE_DIR), { recursive: true });
  writeFileSync(path.join(root, relative), optimised.buffer);
  return { src: `/${relative}`, alt, width: optimised.width, height: optimised.height };
}

export async function enrichPostsWithImages(posts, elements, { token, version, fetchImpl, saveImage }) {
  const byActivity = new Map();
  for (const element of elements) {
    const activityId = activityIdFromUrn(element.id);
    if (activityId) byActivity.set(activityId, element);
  }
  for (const post of posts) {
    const element = byActivity.get(String(post.activityId));
    const mediaId = element ? mediaImageId(element) : null;
    if (!mediaId) continue;
    const meta = await fetchLinkedInImage({ token, version, mediaId, fetchImpl });
    const response = await fetchImpl(meta.downloadUrl);
    if (!response.ok) throw new Error(`LinkedIn image download failed (${response.status}).`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const saved = await saveImage({ bytes, activityId: post.activityId, alt: meta.altText || post.title });
    post.image = { src: saved.src, alt: saved.alt, width: saved.width, height: saved.height };
  }
  return posts;
}

function articleLinks(post) {
  const article = post.content?.article;
  if (!article?.source) return [];
  return [{ label: article.title || "Linked article", href: article.source }];
}

export function classifyCompanyPost(post) {
  if (post.lifecycleState !== "PUBLISHED") return { action: "skip", reason: "lifecycle" };
  if (post.adContext || post.distribution?.feedDistribution === "NONE") return { action: "skip", reason: "sponsored" };
  const commentary = String(post.commentary || "").trim();
  const reshareOf = post.reshareContext?.parent || post.reshareContext?.root || null;
  if (!commentary) return { action: "review", reason: reshareOf ? "reshare without company commentary" : "empty commentary" };
  const eventLike = EVENT_WORDS.test(commentary);
  const parsed = parseExplicitDate(commentary);
  if (eventLike && !parsed) return { action: "review", reason: "event wording without a full date" };
  return { action: eventLike ? "event" : "news", parsed, reshareOf };
}

function publishedIso(post) {
  const millis = post.publishedAt || post.createdAt;
  if (!Number.isFinite(millis)) return null;
  return new Date(millis).toISOString();
}

export function mapCompanyPosts(elements) {
  const posts = [];
  const needsReview = [];
  const skipped = [];
  for (const element of elements) {
    const decision = classifyCompanyPost(element);
    const urn = element.id;
    const activityId = activityIdFromUrn(urn);
    if (decision.action === "skip" || !activityId) {
      skipped.push({ id: urn || null, reason: decision.reason || "unusable" });
      continue;
    }
    if (decision.action === "review") {
      needsReview.push({
        id: urn,
        activityId,
        reason: decision.reason,
        commentary: String(element.commentary || "").trim(),
        reshareOf: element.reshareContext?.parent || element.reshareContext?.root || null
      });
      continue;
    }
    const publishedAt = publishedIso(element);
    posts.push({
      activityId,
      canonicalSourceUrl: canonicalUrl(urn),
      relativeTimeLabel: null,
      title: String(element.commentary).trim().split(/\n/)[0].slice(0, 120),
      body: String(element.commentary).trim(),
      kind: decision.action,
      links: articleLinks(element),
      reshareOf: decision.reshareOf,
      publishedAt,
      publishedAtSource: publishedAt ? "linkedin-api" : undefined,
      event: decision.action === "event" ? {
        start: decision.parsed.start,
        end: decision.parsed.end,
        allDay: true,
        location: null,
        dateLabel: decision.parsed.dateLabel,
        sectionStatus: "upcoming"
      } : null
    });
  }
  return { posts, needsReview, skipped };
}

export async function syncLinkedIn({ env, fetchImpl, catalogue, state, now = new Date(), saveImage = saveOptimisedNewsImage }) {
  const message = configurationMessage(env);
  if (message) return { configured: false, message, needsReview: [], added: [], skipped: [] };
  const { token, refreshed } = await resolveAccessToken(env, fetchImpl);
  const elements = await fetchAllPosts({
    token,
    orgId: env.LINKEDIN_ORG_ID,
    version: env.LINKEDIN_VERSION || DEFAULT_VERSION,
    fetchImpl
  });
  const mapped = mapCompanyPosts(elements);
  await enrichPostsWithImages(mapped.posts, elements, {
    token,
    version: env.LINKEDIN_VERSION || DEFAULT_VERSION,
    fetchImpl,
    saveImage
  });
  const imported = importCompanyBatch({
    catalogue,
    state,
    batch: {
      account: "company",
      collectedOn: londonDateKey(now),
      feedUrl: COMPANY_FEED,
      posts: mapped.posts
    }
  });
  if (!imported.ok) {
    return { configured: true, refreshed, ok: false, errors: imported.errors, needsReview: mapped.needsReview };
  }
  return {
    configured: true,
    refreshed,
    ok: true,
    added: imported.added,
    skipped: imported.skipped,
    needsReview: mapped.needsReview,
    catalogue: imported.catalogue,
    state: imported.state
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const message = configurationMessage(process.env);
  if (message) {
    console.log(message);
    process.exit(0);
  }
  const result = await syncLinkedIn({
    env: process.env,
    fetchImpl: globalThis.fetch,
    catalogue: readJson(path.join(rootDir, "data", "news-events.json")),
    state: readJson(path.join(rootDir, "data", "linkedin-sync-state.json"))
  });
  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exit(1);
  }
  writeFileSync(path.join(rootDir, "data", "news-events.json"), `${JSON.stringify(result.catalogue, null, 2)}\n`);
  writeFileSync(path.join(rootDir, "data", "linkedin-sync-state.json"), `${JSON.stringify(result.state, null, 2)}\n`);
  writeFileSync(path.join(rootDir, "data", "linkedin-needs-review.json"), `${JSON.stringify({
    updatedOn: result.state.lastCollectedOn,
    note: "These company posts were not added to the page. They look like events but do not state a full date, or they have no commentary.",
    items: result.needsReview
  }, null, 2)}\n`);
  console.log(`LinkedIn sync added ${result.added.length}, skipped ${result.skipped.length}, needs review ${result.needsReview.length}.`);
}

export { formatLondonDate };
