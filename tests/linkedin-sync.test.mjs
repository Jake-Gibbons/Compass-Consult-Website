import { describe, expect, it } from "vitest";
import {
  classifyCompanyPost,
  configurationMessage,
  fetchAllPosts,
  mapCompanyPosts,
  parseExplicitDate,
  resolveAccessToken,
  syncLinkedIn
} from "../scripts/linkedin-sync.mjs";
import { formatLondonDate } from "../js/news-events-status.mjs";

const catalogue = {
  coverage: { complete: false, reachedEnd: false },
  held: [],
  entries: [{
    id: "news-existing",
    kind: "news",
    title: "Existing",
    paragraphs: ["Already there."],
    links: [],
    sources: [{ role: "company", activityId: "1111111111111111111", url: "https://www.linkedin.com/feed/update/urn:li:share:1111111111111111111/" }],
    newsList: "latest",
    feedOrder: 1,
    schedule: { precision: "unknown", allDay: false, start: null, end: null, editorialPlacement: "news", dateLabel: "Source-linked" }
  }]
};
const state = { processedActivityIds: ["1111111111111111111"], newestActivityId: "1111111111111111111" };

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("LinkedIn company sync", () => {
  it("exits cleanly when secrets are missing", () => {
    expect(configurationMessage({})).toMatch(/not configured/);
  });

  it("refreshes an access token when only the refresh credentials are set", async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url: String(url), body: String(options.body) });
      return jsonResponse({ access_token: "fresh-token" });
    };
    const result = await resolveAccessToken({
      LINKEDIN_CLIENT_ID: "id",
      LINKEDIN_CLIENT_SECRET: "secret",
      LINKEDIN_REFRESH_TOKEN: "refresh"
    }, fetchImpl);
    expect(result).toEqual({ token: "fresh-token", refreshed: true });
    expect(calls[0].url).toBe("https://www.linkedin.com/oauth/v2/accessToken");
    expect(calls[0].body).toContain("grant_type=refresh_token");
    expect(calls[0].body).not.toContain("fresh-token");
  });

  it("paginates, keeps published posts, and skips drafts and dark posts", async () => {
    const fetchImpl = async (url) => {
      const start = Number(new URL(url).searchParams.get("start"));
      if (start === 0) {
        return jsonResponse({
          paging: { start: 0, count: 2, total: 3 },
          elements: [
            { id: "urn:li:share:2222222222222222222", lifecycleState: "PUBLISHED", commentary: "A policy note.", publishedAt: Date.parse("2026-06-15T23:30:00Z") },
            { id: "urn:li:share:3333333333333333333", lifecycleState: "DRAFT", commentary: "Draft" }
          ]
        });
      }
      return jsonResponse({
        paging: { start: 2, count: 2, total: 3 },
        elements: [
          { id: "urn:li:ugcPost:4444444444444444444", lifecycleState: "PUBLISHED", commentary: "Dark", distribution: { feedDistribution: "NONE" } }
        ]
      });
    };
    const elements = await fetchAllPosts({ token: "token", orgId: "123", version: "202609", fetchImpl, count: 2 });
    expect(elements).toHaveLength(3);
    const mapped = mapCompanyPosts(elements);
    expect(mapped.posts.map((post) => post.activityId)).toEqual(["2222222222222222222"]);
    expect(mapped.skipped.map((item) => item.reason)).toEqual(["lifecycle", "sponsored"]);
    expect(mapped.posts[0].publishedAtSource).toBe("linkedin-api");
    expect(formatLondonDate(new Date("2026-06-15T23:30:00Z"))).toBe("16 June 2026");
  });

  it("sends a commentary-free reshare to review and dedupes an existing activity", async () => {
    expect(classifyCompanyPost({
      lifecycleState: "PUBLISHED",
      commentary: "",
      reshareContext: { parent: "urn:li:share:999" }
    }).reason).toBe("reshare without company commentary");
    const mapped = mapCompanyPosts([
      { id: "urn:li:share:1111111111111111111", lifecycleState: "PUBLISHED", commentary: "Already imported." },
      { id: "urn:li:share:5555555555555555555", lifecycleState: "PUBLISHED", commentary: "Join us next week for the dinner." }
    ]);
    expect(mapped.needsReview[0].reason).toBe("event wording without a full date");
    const result = await syncLinkedIn({
      env: { LINKEDIN_ACCESS_TOKEN: "token", LINKEDIN_ORG_ID: "123" },
      fetchImpl: async () => jsonResponse({ elements: [
        { id: "urn:li:share:1111111111111111111", lifecycleState: "PUBLISHED", commentary: "Already imported." },
        { id: "urn:li:share:6666666666666666666", lifecycleState: "PUBLISHED", commentary: "The conference is on 8 October 2026 at Nottingham." }
      ], paging: { total: 2 } }),
      catalogue,
      state
    });
    expect(result.added).toEqual(["event-6666666666666666666"]);
    expect(result.skipped).toContain("1111111111111111111");
    expect(result.catalogue.entries.find((entry) => entry.id === "event-6666666666666666666").schedule.start).toBe("2026-10-08");
  });

  it("does not invent a year for a day and month", () => {
    expect(parseExplicitDate("The celebration is on 18 May at Guildhall.")).toBeNull();
    expect(parseExplicitDate("Thursday 8 October 2026, 9:00am to 5:00pm").start).toBe("2026-10-08");
  });
});
