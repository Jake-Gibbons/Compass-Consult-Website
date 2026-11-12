# News and events

`data/news-events.json` is the reviewed source for `pages/events.html`. `scripts/render-news-events.mjs` writes the cards into the page, so the stories are in the HTML without JavaScript. `js/events.mjs` then re-sorts events and moves them between Upcoming and Past using the Europe/London clock.

## What this batch is

News and events on the site come from the Compass Consult company LinkedIn page only:

https://www.linkedin.com/company/compass-consult-employability-and-skills-ltd/posts/?feedView=all

This is a selected review, not a complete one. On 11 November 2026, 114 company posts were listed and 64 were read in full. Still unreviewed: 37 preview-only posts, 5 third-party reposts, and 4 document titles. 4 job adverts were excluded. There is no confirmed end of that feed. Personal profile posts are not a source. Where the same story had also been read on a personal profile, the page cites the company post.

No company post showed an absolute publication time. Undated items follow the order of the reviewed company posts. They are not dated by activity IDs or by labels such as "1w".

## Importing a later company batch

Collection stays outside this repository. A scheduled job can read the signed-in company feed and write a JSON file. This repository only merges that file:

```bash
npm run news:import -- path/to/batch.json
npm run render:news
```

`data/linkedin-sync-state.json` records `newestActivityId` and every processed company activity id. A later batch should be newest-first. Posts whose activity id is already recorded are skipped. The import rejects a hand-written `publishedAt`. A timestamp is stored only when `publishedAtSource` is `linkedin-api`, which `npm run news:sync` sets from the Posts API.

```json
{
  "account": "company",
  "collectedOn": "2026-11-12",
  "feedUrl": "https://www.linkedin.com/company/compass-consult-employability-and-skills-ltd/posts/?feedView=all",
  "posts": [
    {
      "canonicalSourceUrl": "https://www.linkedin.com/feed/update/urn:li:activity:1234567890123456789/",
      "activityId": "1234567890123456789",
      "relativeTimeLabel": "1d",
      "title": "Short title",
      "body": "Full company post text.",
      "kind": "news",
      "links": [{ "label": "Related page", "href": "https://example.com/source" }]
    }
  ]
}
```

For an event, add `event`. Use `start` and `end` only when the post or an organiser page states them (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`). If there is no date, set `event.sectionStatus` to `upcoming` or `past` instead of guessing. `attendance` is optional wording taken from the company post.

## What stays manual, and what the API job does

`npm run news:import` only reads a local JSON file. It does not call LinkedIn.

`npm run news:sync` calls the official LinkedIn Posts API when the secrets in `docs/LINKEDIN-SYNC.md` are present. If they are missing, it prints that it is not configured and exits successfully. The daily workflow opens a review pull request and does not merge it unless the repository variable `LINKEDIN_AUTO_MERGE` is `true`. That variable is unset. There is no scraper and no committed credential.

## Dates

Publication times were not shown as absolute dates, so new stories have no publication date. They are ordered by their place in the company feed. Existing on-site dates stay unless a source disproved them. Event dates come from the existing page, an organiser page, or an explicit date in a post or post image.

The Full Potential celebration is shown as 18 May with no year. It is not on the calendar.

An all-day event stays in Upcoming through the end date in Europe/London, and moves to Past on the next London day. A timed event moves to Past at its end time. A card with no machine date stays in the section it was given.

## Held, not published

Two company posts promised a resource "tomorrow" or "later today": a Local Government Reorganisation briefing (activity `7521653467967422466`) and a Budget synopsis (activity `7521515449965203471`). The library already has an LGR factsheet, an LGR update dated 25 March 2026, and an Autumn 2026 Budget infographic. Those files were not matched to these posts, so the stale promises are not published and the resource files were not changed.
