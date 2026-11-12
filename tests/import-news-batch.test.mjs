import { describe, expect, it } from "vitest";
import { importCompanyBatch, preserveManualEntries, validateBatch } from "../scripts/import-news-batch.mjs";
import { resolvedPlacement } from "../js/news-events-status.mjs";

const catalogue = {
  coverage: { complete: false, reachedEnd: false },
  held: [],
  entries: [
    {
      id: "news-existing",
      baseline: true,
      kind: "news",
      title: "Existing",
      paragraphs: ["Already published."],
      links: [],
      sources: [{ role: "company", activityId: "1111111111111111111", url: "https://www.linkedin.com/feed/update/urn:li:activity:1111111111111111111/" }],
      newsList: "latest",
      feedOrder: 1,
      schedule: { precision: "unknown", allDay: false, start: null, end: null, editorialPlacement: "news", dateLabel: "Source-linked" }
    }
  ]
};

const state = { processedActivityIds: ["1111111111111111111"], newestActivityId: "1111111111111111111" };

function batch(posts) {
  return {
    account: "company",
    collectedOn: "2026-11-12",
    feedUrl: "https://www.linkedin.com/company/compass-consult-employability-and-skills-ltd/posts/?feedView=all",
    posts
  };
}

describe("company batch import", () => {
  it("adds a new company post in feed order and does not invent a publication date", () => {
    const result = importCompanyBatch({
      catalogue,
      state,
      batch: batch([
        {
          activityId: "2222222222222222222",
          canonicalSourceUrl: "https://www.linkedin.com/feed/update/urn:li:activity:2222222222222222222/",
          relativeTimeLabel: "1d",
          title: "A newer company post",
          body: "Full text from the company page.",
          kind: "news"
        }
      ])
    });
    expect(result.ok).toBe(true);
    expect(result.added).toEqual(["news-2222222222222222222"]);
    const added = result.catalogue.entries.find((entry) => entry.id === "news-2222222222222222222");
    expect(added.feedOrder).toBe(1);
    expect(added.schedule.dateLabel).toBe("Source-linked");
    expect(added.publishedAt).toBeUndefined();
    expect(result.catalogue.entries.find((entry) => entry.id === "news-existing").feedOrder).toBe(2);
    expect(result.state.newestActivityId).toBe("2222222222222222222");
  });

  it("skips an activity that was already processed", () => {
    const result = importCompanyBatch({
      catalogue,
      state,
      batch: batch([
        {
          activityId: "1111111111111111111",
          canonicalSourceUrl: "https://www.linkedin.com/feed/update/urn:li:activity:1111111111111111111/",
          title: "Duplicate",
          body: "Already in the catalogue.",
          kind: "news"
        }
      ])
    });
    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual(["1111111111111111111"]);
    expect(result.catalogue.entries).toHaveLength(1);
  });

  it("keeps a local image and rejects a remote one", () => {
    const local = {
      activityId: "3333333333333333333",
      canonicalSourceUrl: "https://www.linkedin.com/feed/update/urn:li:activity:3333333333333333333/",
      title: "Illustrated post",
      body: "Full text.",
      kind: "news",
      image: { src: "/assets/images/news-events/3333333333333333333.webp", alt: "Illustrated post", width: 1200, height: 675 }
    };
    const result = importCompanyBatch({ catalogue, state, batch: batch([local]) });
    expect(result.ok).toBe(true);
    expect(result.catalogue.entries.find((entry) => entry.id === "news-3333333333333333333").image).toEqual(local.image);
    expect(validateBatch(batch([{ ...local, image: { src: "https://media.licdn.com/photo.jpg", alt: "Remote", width: 10, height: 10 } }]))).toEqual(
      expect.arrayContaining([expect.stringMatching(/local file/)])
    );
  });

  it("rejects a publication date and a personal-profile batch", () => {
    expect(validateBatch(batch([{
      activityId: "3333333333333333333",
      canonicalSourceUrl: "https://www.linkedin.com/feed/update/urn:li:activity:3333333333333333333/",
      title: "Dated",
      body: "Text",
      kind: "news",
      publishedAt: "2026-11-01"
    }])).some((error) => error.includes("publishedAt"))).toBe(true);
    expect(validateBatch({ ...batch([]), account: "jon-smith" }).some((error) => error.includes("company"))).toBe(true);
  });

  it("does not remove or overwrite a manual entry", () => {
    const manual = {
      id: "apprenticeships-conference-2027",
      source: "manual",
      baseline: false,
      kind: "event",
      title: "Apprenticeships Conference 2027",
      paragraphs: ["Jon Smith, CEO of Compass Consult, will be attending. Come and say hello."],
      links: [{
        label: "Event details and booking",
        href: "https://www.linkedin.com/pulse/have-you-bought-your-ticket-yet-apprenticeships-skillsgroup-so1xe"
      }],
      sources: [],
      location: "Millennium Point, Birmingham",
      schedule: {
        precision: "date",
        allDay: true,
        start: "2027-02-24",
        end: "2027-02-24",
        editorialPlacement: "upcoming",
        dateLabel: "Wed 24 Feb 2027"
      }
    };
    const withManual = { ...catalogue, entries: [...catalogue.entries, structuredClone(manual)] };
    const result = importCompanyBatch({
      catalogue: withManual,
      state,
      batch: batch([{
        activityId: "8888888888888888888",
        canonicalSourceUrl: "https://www.linkedin.com/feed/update/urn:li:activity:8888888888888888888/",
        title: "A newer company post",
        body: "Full text from the company page.",
        kind: "news"
      }])
    });
    expect(result.ok).toBe(true);
    expect(result.added).toEqual(["news-8888888888888888888"]);
    expect(result.catalogue.entries.filter((entry) => entry.id === manual.id)).toEqual([manual]);

    const overwritten = structuredClone(withManual);
    overwritten.entries = overwritten.entries.filter((entry) => entry.id !== manual.id);
    overwritten.entries.push({ ...manual, title: "Replaced by sync", paragraphs: ["Speaking on the main stage."] });
    const restored = preserveManualEntries(withManual, { ...overwritten, entries: overwritten.entries.filter((entry) => entry.source !== "manual") });
    expect(restored.entries.find((entry) => entry.id === manual.id)).toEqual(manual);
    expect(restored.entries.filter((entry) => entry.id === manual.id)).toHaveLength(1);
  });

  it("keeps an explicit event date classifiable and requires a section for an undated event", () => {
    const result = importCompanyBatch({
      catalogue,
      state,
      batch: batch([{
        activityId: "4444444444444444444",
        canonicalSourceUrl: "https://www.linkedin.com/feed/update/urn:li:activity:4444444444444444444/",
        title: "A dated company event",
        body: "The company post gives the date.",
        kind: "event",
        event: { start: "2026-12-01", end: "2026-12-01", allDay: true, location: "Birmingham", dateLabel: "Tue 1 Dec 2026" }
      }])
    });
    const event = result.catalogue.entries.find((entry) => entry.id === "event-4444444444444444444");
    expect(resolvedPlacement(event, new Date("2026-11-12T12:00:00Z"))).toBe("upcoming");
    expect(validateBatch(batch([{
      activityId: "5555555555555555555",
      canonicalSourceUrl: "https://www.linkedin.com/feed/update/urn:li:activity:5555555555555555555/",
      title: "Undated",
      body: "No date in the post.",
      kind: "event",
      event: { location: null }
    }])).some((error) => error.includes("sectionStatus"))).toBe(true);
  });
});
