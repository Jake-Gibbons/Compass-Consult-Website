import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  classifyEvent,
  londonCivilToUtc,
  newsListFor,
  resolvedPlacement,
  sortNews,
  validateCatalogue
} from "../js/news-events-status.mjs";
import { renderRegion } from "../scripts/render-news-events.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = JSON.parse(readFileSync(path.join(rootDir, "data", "news-events.json"), "utf8"));
const asOf = new Date("2026-11-11T12:00:00Z");

function entry(id) {
  return catalogue.entries.find((item) => item.id === id);
}

describe("Europe/London event placement", () => {
  it("keeps an all-day event current through the end date and past the next London day", () => {
    const schedule = { precision: "date", allDay: true, start: "2026-11-05", end: "2026-11-05" };
    expect(classifyEvent(schedule, new Date("2026-11-05T23:30:00Z"))).toBe("upcoming");
    expect(classifyEvent(schedule, new Date("2026-11-06T00:30:00Z"))).toBe("past");
  });

  it("treats a timed event as past only once the London end instant has passed", () => {
    const schedule = { precision: "datetime", allDay: false, start: "2026-11-25T09:30", end: "2026-11-25T22:30" };
    expect(londonCivilToUtc("2026-11-25T22:30").toISOString()).toBe("2026-11-25T22:30:00.000Z");
    expect(classifyEvent(schedule, new Date("2026-11-25T22:29:00Z"))).toBe("upcoming");
    expect(classifyEvent(schedule, new Date("2026-11-25T22:30:00Z"))).toBe("past");
  });

  it("uses the London end of a summer-time day, not UTC midnight", () => {
    const schedule = { precision: "date", allDay: true, start: "2026-10-08", end: "2026-10-08" };
    expect(classifyEvent(schedule, new Date("2026-10-08T22:30:00Z"))).toBe("upcoming");
    expect(classifyEvent(schedule, new Date("2026-10-08T23:30:00Z"))).toBe("past");
  });

  it("does not invent a year for 18 May", () => {
    const celebrating = entry("event-full-potential-celebrating-success");
    expect(celebrating.schedule.precision).toBe("day-month");
    expect(celebrating.schedule.start).toBeNull();
    expect(celebrating.schedule.dateLabel).toBe("18 May");
    expect(classifyEvent(celebrating.schedule, asOf)).toBeNull();
    expect(resolvedPlacement(celebrating, asOf)).toBe("past");
  });

  it("moves Basecamp to past on 11 November 2026 and leaves ERSA upcoming", () => {
    expect(resolvedPlacement(entry("iep-basecamp-2026"), asOf)).toBe("past");
    expect(resolvedPlacement(entry("ersa-annual-conference"), asOf)).toBe("upcoming");
    expect(resolvedPlacement(entry("event-supported-housing-week-2026"), asOf)).toBe("past");
    expect(resolvedPlacement(entry("esec-liverpool-2026"), asOf)).toBe("upcoming");
  });

  it("preserves undated editorial placement", () => {
    expect(classifyEvent(entry("clf-youth-guarantee-webinar").schedule, asOf)).toBeNull();
    expect(resolvedPlacement(entry("clf-youth-guarantee-webinar"), asOf)).toBe("past");
  });
});

describe("news curation", () => {
  it("keeps two-month-old stories in the archive and one-month stories where listed", () => {
    expect(newsListFor(entry("news-volunteering-blog"))).toBe("archive");
    expect(newsListFor(entry("news-adult-skills-fund-devolution"))).toBe("latest");
    expect(newsListFor(entry("news-connect-to-work"))).toBe("latest");
  });

  it("orders latest news by explicit feed order, with Connect to Work once", () => {
    const latest = sortNews(catalogue.entries, "latest").map((item) => item.id);
    expect(latest.slice(0, 3)).toEqual([
      "news-staying-close-leaving-care",
      "news-connect-to-work",
      "news-jobs-and-careers-service"
    ]);
    expect(latest.filter((id) => id === "news-connect-to-work")).toHaveLength(1);
    expect(latest).toContain("news-youth-jobs-grant");
    expect(latest).not.toContain("news-iep-fellow-finalist");
  });

  it("rejects a recent label and a duplicated activity", () => {
    const broken = structuredClone(catalogue);
    broken.entries.find((item) => item.id === "news-jobs-and-careers-service").schedule.dateLabel = "Recent update";
    expect(validateCatalogue(broken).some((error) => error.includes("Recent"))).toBe(true);
    const duplicated = structuredClone(catalogue);
    duplicated.entries.find((item) => item.id === "news-staying-close-leaving-care").sources.push({
      role: "company",
      activityId: "7522935155746037760",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7522935155746037760/"
    });
    expect(validateCatalogue(duplicated).some((error) => error.includes("7522935155746037760"))).toBe(true);
  });
});

describe("rendered page", () => {
  it("puts Basecamp in past, ERSA in upcoming, and 18 May off the calendar date attributes", () => {
    const html = renderRegion(catalogue, asOf);
    const basecampAt = html.indexOf('id="iep-basecamp-2026"');
    const basecamp = html.slice(basecampAt, html.indexOf("<article", basecampAt + 10));
    expect(html.indexOf('id="iep-basecamp-2026"')).toBeGreaterThan(html.indexOf('id="past-events-list"'));
    expect(html.indexOf('id="ersa-annual-conference"')).toBeLessThan(html.indexOf('id="past-events-list"'));
    expect(basecamp).toContain("looking forward to attending");
    expect(basecamp).not.toContain("will be at");
    expect(html).not.toContain('data-event-start="2026-05-18"');
    expect(html).toContain(">18<");
    expect(html).toContain("Year not stated");
    expect(html).toContain("Date not stated");
    expect(html).toContain("Follow us on LinkedIn");
    expect(html).toContain("Upcoming events Compass Consult is attending or supporting");
    expect(html).toContain(">Soonest first.<");
    expect(html).toContain(">Newest first.<");
    expect(html).not.toContain("not a complete record");
    expect(html).not.toContain("114-post");
    expect(html).not.toContain("order they were reviewed");
    expect(html).not.toContain("Europe/London clock");
    const stayingAt = html.indexOf('id="news-staying-close-leaving-care"');
    const staying = html.slice(stayingAt, html.indexOf("<article", stayingAt + 10));
    expect(staying).toContain('class="story-mark"');
    expect(staying).not.toContain("Date not stated");
    expect(html).toContain('<details id="past-events-section"');
    expect(html).not.toContain('<details id="past-events-section" class="story-archive" data-section-kind="event" open');
    expect(html.indexOf('id="ersa-annual-conference"')).toBeLessThan(html.indexOf('id="esec-liverpool-2026"'));
    expect(html).not.toContain("Recent update");
    expect(html).toContain("Fedcap");
    expect(html).not.toContain("headline sponsor Serco");
    expect(html).not.toContain("Scott Parkin");
    expect(html).not.toContain("7522789693789425664");
    expect(html).not.toContain("compassconsultcces");
    expect(html.match(/Connect to Work: devolution/g)).toHaveLength(1);
    expect(html).not.toContain("23 February 2027");
    expect(html).not.toContain("Capability Framework");
    const lectureAt = html.indexOf('id="event-iep-fellows-lecture-london-2026"');
    const lecture = html.slice(lectureAt, html.indexOf("<article", lectureAt + 10));
    expect(lecture).toContain("7:00pm to 11:00pm");
    expect(lecture).not.toContain("RSA House");
    expect(html).not.toContain('id="event-sector-supplier-awards-2027"');
  });
});
