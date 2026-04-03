# data/

This folder contains JSON data files that serve as a single source of truth
for the site's structured content. These files define the schemas for team
members, services, and client organisations.

> **Note:** Content in these JSON files is currently mirrored as hardcoded
> HTML in the corresponding pages. When updating content, edit both the JSON
> file **and** the relevant HTML page to keep them consistent.

---

## Files

### `clients.json`

An array of client organisation objects displayed in the client ticker
strip on `index.html`.

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique identifier |
| `name` | string | Organisation name |
| `industry` | string | Industry sector |
| `icon` | string | Lucide icon name |
| `logo` | string | Path to logo image (relative to site root) |
| `description` | string | Short description |

---

### `services.json`

An array of service objects for the services page and homepage summary.

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique identifier |
| `name` | string | Service display name |
| `slug` | string | URL-safe identifier (for future routing) |
| `icon` | string | Lucide icon name |
| `color` | string | Tailwind colour keyword (e.g. `purple`, `teal`) |
| `description` | string | Short description shown in cards |
| `fullDescription` | string | Longer description for the detail view |
| `features` | string[] | Bullet-point feature list |
| `price` | string | Pricing summary (e.g. `"From £99"`) |
| `duration` | string | Typical delivery duration |

---

### `team.json`

An array of team member objects for the team page.

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique identifier |
| `name` | string | Full name |
| `role` | string | Job title |
| `bio` | string | Short biography summary |
| `image` | string | Path to profile photo (relative to site root) |
| `email` | string | Contact email address |
| `linkedin` | string | Full LinkedIn profile URL |
| `expertise` | string[] | List of specialist skill areas |

---

## Adding or Updating Content

1. Open the relevant JSON file.
2. Add or modify the object, following the field schema above.
3. Update the corresponding HTML page to reflect the change.
4. Validate your JSON (e.g. with [jsonlint.com](https://jsonlint.com/))
   before committing.

---

## Related

- The **Netlify subscriber function** (`netlify/functions/subscribers.mts`)
  persists newsletter subscriber data to Netlify Blobs — it does **not**
  use the JSON files in this folder.
- For build scripts that consume these files, see `scripts/` and
  [`docs/DEVELOPMENT.md`](../docs/DEVELOPMENT.md).

---

*Last updated: April 2026*
