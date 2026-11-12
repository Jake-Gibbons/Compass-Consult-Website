# LinkedIn company sync

The website reads the Compass Consult company page only. Personal profile posts are not collected. This repository does not store tokens and does not scrape LinkedIn.

The daily job is `.github/workflows/linkedin-news-sync.yml`. It runs at 06:00 UTC (06:00 in the UK during Greenwich Mean Time, 07:00 during British Summer Time) and can also be started with `workflow_dispatch`. The schedule starts after this workflow is on `main`. Until then it can be run from this branch with a manual dispatch.

If the secrets below are missing, `npm run news:sync` prints `not configured` and exits successfully. Nothing is published automatically. A change opens or updates a pull request from `automation/linkedin-news`. Merging that pull request into `main` happens only when the repository variable `LINKEDIN_AUTO_MERGE` is the string `true`. Leave that variable unset.

## Secrets

Set these as GitHub Actions secrets on the repository. Do not put the values in a file.

| Name | Purpose |
|---|---|
| `LINKEDIN_ORG_ID` | Numeric organisation id, or the full `urn:li:organization:` value |
| `LINKEDIN_ACCESS_TOKEN` | Optional short-lived token. If it is absent, the job refreshes one |
| `LINKEDIN_CLIENT_ID` | LinkedIn app client id, used to refresh a token |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn app client secret |
| `LINKEDIN_REFRESH_TOKEN` | Refresh token from the admin consent below |

Optional repository variable:

| Name | Purpose |
|---|---|
| `LINKEDIN_VERSION` | LinkedIn REST version `YYYYMM`. The default in code is `202609` |
| `LINKEDIN_AUTO_MERGE` | Set to `true` only when new posts should merge without review. Leave unset |

Local OAuth also uses `LINKEDIN_REDIRECT_URI`. That does not need to be a GitHub secret.

## What Jake needs to do

1. Open [LinkedIn Developers](https://www.linkedin.com/developers/apps) and create an app, or open the existing Compass app.
2. In Products, request **Community Management API**. Wait until LinkedIn approves it. The Posts API and the `r_organization_social` scope stay unavailable until that product is approved.
3. On the app's Auth tab, add a redirect URL you control, such as `http://localhost:8765/linkedin/callback`. The same URL must be sent as `LINKEDIN_REDIRECT_URI`.
4. Verify the app with the Compass Consult company page. In the app, add the company page under the verification or Community Management settings and approve the request as a page admin.
5. Find the organisation id. A page admin can read it from the company page admin URL, or call `https://api.linkedin.com/rest/organizationAcls?q=roleAssignee` with the admin token after consent. The id is the number in `urn:li:organization:123456`. Store it as `LINKEDIN_ORG_ID`.
6. On your own machine, set `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` and `LINKEDIN_REDIRECT_URI`, then run `npm run news:oauth`. Open the printed URL while signed in as a Compass company page admin. Approve `r_organization_social`.
7. LinkedIn redirects to the redirect URL with `?code=`. Run `npm run news:oauth -- <code>`. The command prints `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_REFRESH_TOKEN`. Copy them into GitHub Actions secrets. Do not commit them.
8. Add `LINKEDIN_ORG_ID`, `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` as secrets as well. Leave `LINKEDIN_AUTO_MERGE` unset.

The job calls `GET https://api.linkedin.com/rest/posts?q=author&author=urn:li:organization:{id}&count=50&start=0&sortBy=LAST_MODIFIED` with `LinkedIn-Version`, `X-Restli-Protocol-Version: 2.0.0` and a Bearer token. It keeps `PUBLISHED` posts, skips drafts and dark or sponsored posts, and follows `start` until the page is finished. A real `publishedAt` or `createdAt` from the API is stored as a London date. A post is an event only when its text states a day, month and year. `18 May` without a year, or `next week`, is written to `data/linkedin-needs-review.json` and is not added to the page. Known activity ids in `data/linkedin-sync-state.json` are skipped.

When a post includes `content.media.id` as an `urn:li:image:` value, the job calls `GET https://api.linkedin.com/rest/images/{encoded urn}`. It downloads `downloadUrl`, converts the file to WebP at most 1280 pixels wide, and saves it under `assets/images/news-events/{activityId}.webp`. The catalogue image uses that local path, with `alt` from the image `altText` or the post title, plus the width and height. The page never links to `media.licdn.com`. A post with no image still publishes, and the card shows a Compass fallback.
