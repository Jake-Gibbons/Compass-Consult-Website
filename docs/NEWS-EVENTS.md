# News and events

`data/news-events.json` is the reviewed source for `pages/events.html`. `scripts/render-news-events.mjs` writes the cards into the page, so the stories are in the HTML without JavaScript. `js/events.mjs` then re-sorts events and moves them between Upcoming and Past using the Europe/London clock.

## What this batch is

This is a selected review, not a complete one.

Company feed, 11 November 2026: 114 posts were listed. 64 were read in full. Still unreviewed: 37 preview-only posts, 5 third-party reposts without a company claim, and 4 document titles. 4 job adverts were excluded. There is no confirmed end of that history.

Jon Smith posts, same day: 292 positions were previewed. 37 were expanded, giving 36 unique posts (two positions were the same post). The other 255 were not expanded and are not used as copy. Positions 20 to 61 are largely unresolved. The browser tab crashed after the Basecamp date and venue were confirmed, and no further collection is planned. The feed stopped at an apparent boundary after a 12-year-old vacancy. That is not proof every historical post was available.

No post showed an absolute publication time. Undated items follow the order of the reviewed posts. They are not dated by activity IDs or by labels such as "1w".

Do not describe this page as a complete review of either feed.

## Dates

Publication times were not shown as absolute dates, so new stories have no publication date. They are ordered by their place in the company feed. Existing on-site dates stay unless a source disproved them. Event dates come from the existing page, an organiser page, or an explicit date in a post or post image.

The Full Potential celebration is shown as 18 May with no year. It is not on the calendar.

An all-day event stays in Upcoming through the end date in Europe/London, and moves to Past on the next London day. A timed event moves to Past at its end time. A card with no machine date stays in the section it was given.

## Held, not published

Two company posts promised a resource "tomorrow" or "later today": a Local Government Reorganisation briefing (activity `7521653467967422466`) and a Budget synopsis (activity `7521515449965203471`). The library already has an LGR factsheet, an LGR update dated 25 March 2026, and an Autumn 2026 Budget infographic. Those files were not matched to these posts, so the stale promises are not published and the resource files were not changed.

## What is not automated

Nothing here calls LinkedIn, scrapes it, polls it, or publishes on a schedule. `npm run check` only validates the reviewed JSON. It does not deploy the site.

The practical route is the one this pull request uses: a person reviews full post text, edits `data/news-events.json`, and opens a pull request. `npm run render:news` writes the HTML. Validation rejects duplicate stories, a "Recent" label, a year on a day-and-month card, and any flag that says coverage is complete.

A later company-page import would need LinkedIn's Community Management API, approved access, and an admin OAuth grant. That product is for organisation pages an admin already controls. It is not switched on, and this repository has no token and no cron.

Posts on a personal profile are a different permission. Reading Jon Smith's posts through an API would need his own authorisation. No public RSS feed for these profiles was verified. Do not add a scraper or an unattended publisher in place of that access.

If an approved company poll is added later, it should write the same JSON and stop for review. It should not merge or deploy by itself. The site content security policy only allows connections to this origin, so the browser cannot call LinkedIn.
