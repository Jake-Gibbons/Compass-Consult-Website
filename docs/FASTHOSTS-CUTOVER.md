# Fasthosts cutover guide

How to move **compassconsultes.co.uk** from Netlify to Fasthosts Linux web
hosting (Apache + PHP + MySQL), with newsletter subscribers stored in MySQL.

> **Nothing in this guide has been done yet.** The site still runs on Netlify
> and `netlify.toml` is kept so Netlify keeps working until the switch. Follow
> the steps in order; every step before [7. DNS](#7-dns-switch) can be done
> without affecting the live site.

## Contents

1. [What changes](#1-what-changes)
2. [Before you start (decisions and details needed)](#2-before-you-start)
3. [Fasthosts control panel set-up](#3-fasthosts-control-panel-set-up)
4. [Build and upload the site](#4-build-and-upload-the-site)
5. [Server configuration file](#5-server-configuration-file)
6. [Database: create the table and import subscribers](#6-database)
7. [DNS switch](#7-dns-switch)
8. [Email for the contact form](#8-email-for-the-contact-form)
9. [Verification checklist](#9-verification-checklist)
10. [Rollback](#10-rollback)
11. [After the cutover (clean-up)](#11-after-the-cutover)
12. [Local testing](#12-local-testing)

---

## 1. What changes

| Feature | On Netlify (today) | On Fasthosts |
| --- | --- | --- |
| Pages, CSS, JS, images | Netlify CDN | Apache serves the same files from `htdocs/` |
| Pretty URLs (`/pages/about`), trailing-slash redirect, custom 404 | Netlify | `.htaccess` rewrite rules |
| Security headers, CSP, cache headers | `netlify.toml` | `.htaccess` (same values) |
| HTTPS, `www` → apex | Netlify | `.htaccess` (only for the real domain) + Fasthosts SSL certificate |
| Newsletter subscribe / unsubscribe (`/api/subscribers`) | Netlify Function + Netlify Blobs | `api/subscribers.php` + MySQL table `newsletter_subscribers` |
| Unsubscribe link page (`/unsubscribe?token=…`) | — | `api/unsubscribe.php` (confirm page + one-click, RFC 8058) |
| Contact form | Netlify Forms | `api/contact.php` sends the enquiry by SMTP to `enquiries@compassconsultes.co.uk` |

The public URLs are unchanged, so the HTML and JavaScript work on both hosts.
The contact form tries `/api/contact` first and falls back to Netlify Forms
only when that endpoint does not exist (i.e. while still on Netlify).

Subscribers imported from Netlify keep their existing ID as their
unsubscribe token, so people who subscribed on Netlify can still unsubscribe
from the same browser after the move.

## 2. Before you start

Gather these before starting:

- [ ] **Fasthosts hosting package** with PHP and MySQL (Linux web hosting).
- [ ] **SFTP/FTP login** for the hosting package (control panel → Web hosting → FTP).
- [ ] **Email decision** for the contact form (see [section 8](#8-email-for-the-contact-form)), and the mailbox address and password.
- [ ] **Netlify personal access token** (Netlify → User settings → Applications → Personal access tokens) and the site's **Site ID** (Site configuration → General → Site details), to export subscribers.
- [ ] **Where Netlify Forms sends contact enquiries today** (Netlify → Forms → Form notifications), so the same inbox gets them after the move. The PHP handler sends to `mail.to` in the config file.
- [ ] **Access to DNS.** The domain is registered with IONOS (Fasthosts' parent group), but **its DNS is currently hosted by Netlify DNS** (nameservers `dns1–4.p03.nsone.net`). See [section 7](#7-dns-switch).

## 3. Fasthosts control panel set-up

1. **PHP version:** Web hosting → your package → *PHP settings* → choose
   **PHP 8.2 or 8.3** (8.1 is the minimum). The `pdo_mysql` extension is
   required (enabled by default on Fasthosts). `mbstring` is optional.
2. **MySQL database:** Web hosting → *Databases* → *MySQL* → create a database.
   Note the **host name**, **database name**, **user name** and **password**
   shown on the database page (the host is not `localhost` on Fasthosts).
3. **Domain:** attach `compassconsultes.co.uk` (and `www`) to the hosting
   package (Domains → *Connect to hosting* / *Web hosting → Domains*).
4. **SSL certificate:** enable the free SSL certificate for both
   `compassconsultes.co.uk` and `www.compassconsultes.co.uk`. Fasthosts can
   usually only issue it once DNS points at Fasthosts, so expect a short gap —
   see [section 7](#7-dns-switch) for how to keep that gap small.

## 4. Build and upload the site

On a computer with Node.js 22 and this repository:

```bash
npm ci
npm run build:fasthosts
```

This rebuilds the hashed CSS/JS (`npm run build:prod`) and copies everything
the server needs into **`dist/fasthosts/`** (≈ 240 files, ≈ 32 MB): `.htaccess`,
the HTML pages, `css/`, `js/`, `assets/`, `api/`, `robots.txt`, `sitemap.xml`
and `sw.js`. Source-only files (`netlify/`, `scripts/`, `node_modules/`,
`database/`, docs, `api/config.php`) are not included.

Upload **the contents** of `dist/fasthosts/` (not the folder itself) into the
hosting package's web root, **`htdocs/`**, using SFTP (e.g. FileZilla or WinSCP):

```
/                       ← FTP root (not public)
├── compass-config.php  ← you create this in step 5 (NOT in htdocs)
├── private/            ← optional, for rate-limit files (step 5)
└── htdocs/             ← web root: upload the contents of dist/fasthosts here
    ├── .htaccess       ← make sure hidden files are uploaded
    ├── index.html
    ├── api/
    ├── assets/
    ├── css/
    ├── js/
    └── pages/
```

- Turn on "show hidden files" in the FTP client so **`.htaccess` is uploaded**
  (as well as `api/lib/.htaccess`). Without it, pretty URLs, the API routes and
  the security headers will not work.
- Delete any Fasthosts placeholder page (e.g. `htdocs/index.php` or
  `default.html`) — it may take priority over `index.html`.
- Before DNS moves, the site can be previewed on the Fasthosts **temporary/
  preview URL** (if your package provides one). The HTTPS and `www` redirects
  only apply to `compassconsultes.co.uk`, so the preview URL works over plain
  HTTP.

## 5. Server configuration file

The PHP code reads its settings (database, email, salt) from a config file
that is **never committed to git**. Copy
[`api/config.example.php`](../api/config.example.php) to a new file called
**`compass-config.php`** and fill it in:

| Setting | Value |
| --- | --- |
| `site_url` | `https://compassconsultes.co.uk` (used in unsubscribe links) |
| `db.host`, `db.name`, `db.user`, `db.pass` | From the Fasthosts database page (step 3.2) |
| `mail.to` | Where enquiries go (default `enquiries@compassconsultes.co.uk`) |
| `mail.from_email` | The mailbox the SMTP login is allowed to send as |
| `mail.smtp.*` | See [section 8](#8-email-for-the-contact-form) |
| `ip_hash_salt` | A long random string — generate one with `php -r "echo bin2hex(random_bytes(32));"` or `openssl rand -hex 32`. Keep it secret; don't change it later. |
| `storage_dir` | Optional. A writable folder for rate-limit counters, ideally outside `htdocs`, e.g. `__DIR__ . '/private/ratelimit'` (create `private/` next to `htdocs/`). `null` uses the system temp folder. |
| `debug` | Leave `false` |

Upload it **one level above `htdocs/`** (the FTP root shown above). The code
looks for the config in this order and uses the first one it finds:

1. the path in a `COMPASS_CONFIG` environment variable (if set);
2. `../compass-config.php` — **one level above the web root (recommended)**;
3. `htdocs/api/config.php` — fallback if the host does not allow PHP to read
   files above `htdocs`. This path is git-ignored and `.htaccess` blocks it
   from being downloaded (404).

Permissions: `640` or `600` for the config file if the FTP client allows it
(the default `644` also works on Fasthosts because files above `htdocs` are not
web-accessible).

> PHP's OPcache may keep using the old settings for a few seconds after you
> replace the config file. Wait a moment before re-testing.

## 6. Database

### 6.1 Create the table

In the Fasthosts control panel open **phpMyAdmin** for the new database,
choose the *SQL* tab, paste the contents of
[`database/migrations/001_create_newsletter_subscribers.sql`](../database/migrations/001_create_newsletter_subscribers.sql)
and click *Go*. It is safe to run more than once (`CREATE TABLE IF NOT EXISTS`).

The table stores: email (unique, lower-case), status (`subscribed` /
`unsubscribed`), unsubscribe token, source page, consent wording, a salted
hash of the IP address, and created / subscribed / unsubscribed timestamps
(UTC). Unsubscribing keeps the row with status `unsubscribed` (a suppression
record), so the person is not re-imported or emailed by mistake.

There is deliberately **no public endpoint that lists subscribers**. To view
or export them, use phpMyAdmin (*Export* → CSV), e.g.:

```sql
SELECT email, subscribed_at, source
FROM newsletter_subscribers
WHERE status = 'subscribed'
ORDER BY subscribed_at;
```

### 6.2 Export the subscribers from Netlify

The export script only **reads** from Netlify Blobs; it does not change or
delete anything. Run it on your own computer:

```bash
NETLIFY_SITE_ID=<site id> NETLIFY_AUTH_TOKEN=<personal access token> \
  npm run export:subscribers
```

It writes three files to `subscriber-export/` (git-ignored — **don't commit
them, they contain personal data**):

- `subscribers.json` — raw copy of the Netlify records (keep as a backup);
- `subscribers.csv` — for checking in a spreadsheet;
- `import.sql` — the SQL to load into MySQL.

The script removes duplicate emails (keeping the earliest sign-up), skips
invalid records (and lists them), and prints a count. Check the count looks
right against what you expect.

If you already have a JSON export, you can convert it without a token:
`node scripts/export-netlify-subscribers.mjs --from-json path/to/file.json`.

### 6.3 Import into MySQL

In phpMyAdmin → *Import*, choose `subscriber-export/import.sql` and click
*Go* (or paste it into the *SQL* tab). It uses `INSERT IGNORE`, so:

- running it twice does not create duplicates;
- anyone who already subscribed or unsubscribed directly on Fasthosts is left
  as they are.

**Timing:** do the export and import as close to the DNS switch as possible.
Because the import is idempotent, the simplest approach is: import once now
to test, then **export and import again right after DNS has switched** to pick
up anyone who subscribed on Netlify in the meantime.

Check afterwards:

```sql
SELECT status, COUNT(*) FROM newsletter_subscribers GROUP BY status;
```

Securely delete `subscriber-export/` from your computer once the import is
confirmed.

## 7. DNS switch

### 7.1 Current DNS (checked 3 November 2026)

The domain's nameservers are **Netlify DNS** (`dns1.p03.nsone.net` …
`dns4.p03.nsone.net`), so Netlify currently hosts **all** DNS records for the
domain, including the Microsoft 365 email records:

| Name | Type | Value |
| --- | --- | --- |
| `compassconsultes.co.uk` | A | Netlify (`13.52.188.95`, `52.52.192.191`) |
| `www` | A / CNAME | Netlify |
| `compassconsultes.co.uk` | MX | `0 compassconsultes-co-uk.mail.protection.outlook.com` |
| `compassconsultes.co.uk` | TXT | `v=spf1 include:spf.protection.outlook.com -all` |
| `compassconsultes.co.uk` | TXT | `MS=ms77262904` |
| `compassconsultes.co.uk` | TXT | `google-site-verification=oeL53gNcYQm5aLIq1E5lS0PNH7681NKF1M3lFCJ_6L4` |
| `autodiscover` | CNAME | `autodiscover.outlook.com` |

No DMARC, DKIM, AAAA or CAA records were found. Before changing anything,
open **Netlify → Domains → compassconsultes.co.uk → DNS records** and write
down every record listed there (there may be ones that a public lookup cannot
see, such as other subdomains or DKIM selectors).

> ⚠️ **Do not delete the Netlify site or the Netlify DNS zone** until the new
> DNS is fully working. Deleting the zone while it is still in use would take
> down the website **and Microsoft 365 email**.

### 7.2 Choose how to point the domain at Fasthosts

**Option 1 — move DNS to Fasthosts (recommended, ends the Netlify dependency):**

1. In the Fasthosts/IONOS control panel, open the domain's DNS settings and
   **recreate every record from 7.1 except the Netlify A/CNAME records**:
   MX, SPF TXT (updated as in [section 8](#8-email-for-the-contact-form)),
   `MS=` TXT, `google-site-verification` TXT and the `autodiscover` CNAME.
   Set the apex and `www` A records to the **Fasthosts hosting IP** (shown in
   the control panel; connecting the domain to the hosting package usually
   creates these).
2. A day before, lower the TTL of the records in Netlify DNS (e.g. to 300
   seconds) if Netlify allows it.
3. At the registrar, change the nameservers from the Netlify ones to the
   Fasthosts/IONOS defaults.
4. Nameserver changes can take up to 24–48 hours to be seen everywhere. Both
   sites stay online during this time (Netlify keeps serving visitors who
   still get the old answer).

**Option 2 — keep Netlify DNS for now, change only the website records:**

1. In Netlify → Domains → DNS records, replace the Netlify A/`www` records
   with A records pointing to the Fasthosts IP. Netlify may first require the
   domain to be removed from the Netlify **site's** domain settings (not the
   DNS zone) — leave the DNS zone itself in place.
2. Email records stay as they are, so this is lower-risk for email, but the
   domain still depends on Netlify DNS. Plan to move DNS (Option 1) later.

### 7.3 SSL and the redirect

As soon as DNS points at Fasthosts, issue/activate the SSL certificate in the
control panel. Until it is active, visitors to `https://` may see a
certificate warning for a short time — doing the switch at a quiet time keeps
the impact low. `.htaccess` redirects `http` → `https` and `www` → apex for
the real domain; HSTS is only sent over HTTPS.

## 8. Email for the contact form

The domain's email is on **Microsoft 365**, and its SPF record ends in `-all`
and only allows Microsoft 365 servers. Email sent by the website as
`@compassconsultes.co.uk` from any other server would fail SPF and probably be
rejected or sent to junk — including when it is delivered to
`enquiries@compassconsultes.co.uk` itself. Pick one option:

**Option A — Fasthosts mailbox (recommended long-term):**

- Create a mailbox such as `no-reply@compassconsultes.co.uk` in the Fasthosts
  control panel (*Email*). **Do not change the MX records**: the mailbox is
  only used to send, and replies go to the enquirer (`Reply-To`).
- Config: `host` `smtp.livemail.co.uk`, `port` `587`, `encryption` `tls`,
  `username`/`from_email` the mailbox address, `password` its password.
- Update SPF to allow Fasthosts as well as Microsoft 365:
  `v=spf1 include:spf.protection.outlook.com include:_spf.livemail.co.uk -all`
  (use `~all` instead of `-all` for the first few weeks if you prefer a softer
  rollout).

**Option B — Microsoft 365 mailbox:**

- Use a licensed Microsoft 365 mailbox (or shared mailbox with a licence).
- In Microsoft 365 admin → *Users* → the mailbox → *Mail* → *Manage email
  apps*, tick **Authenticated SMTP**. Tenant-wide SMTP AUTH must not be
  disabled, and MFA/security defaults can block it.
- Config: `host` `smtp.office365.com`, `port` `587`, `encryption` `tls`.
- No SPF change needed.
- ⚠️ Microsoft is disabling basic-auth SMTP by default for existing tenants
  from the end of December 2026 (it can be re-enabled by an admin; final
  removal is expected to be announced for the second half of 2027). This
  option may stop working without notice, so Option A is preferred.

**Recommended for either option:** add a DMARC record so failures are
reported rather than silent:
`_dmarc` TXT `v=DMARC1; p=none; rua=mailto:enquiries@compassconsultes.co.uk`.

Test by sending an enquiry and checking it arrives in the inbox (not junk) and
that the message headers show `spf=pass`.

If SMTP is not configured, `transport` `mail` uses PHP's built-in `mail()`;
this is least reliable and also needs the SPF change.

## 9. Verification checklist

Do these first on the preview URL (where possible), then on the real domain
after DNS switches. Use a private/incognito window.

**Pages and hosting**

- [ ] `https://compassconsultes.co.uk/` loads with a valid padlock.
- [ ] `http://compassconsultes.co.uk/` and `https://www.compassconsultes.co.uk/`
      redirect (301) to `https://compassconsultes.co.uk/`.
- [ ] Every page in the navigation loads (`/pages/about`, `/pages/services`,
      `/pages/contact`, etc.); `/pages/about/` redirects to `/pages/about`.
- [ ] `/this-does-not-exist` shows the styled 404 page.
- [ ] Styles, icons, images and the ticker/carousels work; browser console
      (F12) shows no errors.
- [ ] Response headers include `Content-Security-Policy`,
      `Strict-Transport-Security` and `X-Content-Type-Options`
      (check at <https://securityheaders.com>).
- [ ] These return **404**: `/api/lib/bootstrap.php`, `/api/config.php`,
      `/.htaccess`, `/database/`, `/netlify.toml`, `/package.json`.
- [ ] The cookie banner appears and remembers the choice.

**Newsletter**

- [ ] Subscribe with a test address in any page footer → success message;
      the row appears in phpMyAdmin with status `subscribed`.
- [ ] Subscribe again with the same address → "already subscribed".
- [ ] Click *Unsubscribe* in the same browser → row becomes `unsubscribed`.
- [ ] Visit `/unsubscribe?token=<token from the row>` → confirmation page;
      clicking the button unsubscribes.
- [ ] Imported subscriber count matches the export count.

**Contact form**

- [ ] Send an enquiry from `/pages/contact` → success message, and the email
      arrives at the inbox in `mail.to` (not junk), with *Reply-To* set to the
      enquirer.
- [ ] Submit with empty fields → the form shows validation errors.

**Email and DNS**

- [ ] Send and receive a normal email to/from a `@compassconsultes.co.uk`
      Microsoft 365 mailbox after the DNS change (MX still correct).
- [ ] Outlook autodiscover still works (new device set-up / Outlook sign-in).
- [ ] Google Search Console still shows the property as verified.

## 10. Rollback

The Netlify site stays deployed and untouched, so rolling back is a DNS change:

- **Option 1 (DNS moved to Fasthosts):** set the apex and `www` records back
  to Netlify (the values noted in 7.1, or those Netlify shows under
  Domains → *Awaiting external DNS*; typically `www` CNAME
  `<site-name>.netlify.app`), or
  switch the nameservers back to `dns1–4.p03.nsone.net` (the Netlify zone
  must still exist).
- **Option 2 (Netlify DNS kept):** restore the Netlify A/`www` records in
  Netlify DNS.

Subscribers who joined on Fasthosts are in MySQL, not Netlify Blobs; export
them from phpMyAdmin if you need them back on Netlify. Contact enquiries sent
during the Fasthosts period were emailed, so nothing is lost.

## 11. After the cutover

Once the site has run on Fasthosts for a couple of weeks without problems:

- Remove Netlify-only code: `netlify/`, `netlify.toml`, the `@netlify/*`
  dependencies in `package.json`, the `data-netlify` / `netlify-honeypot`
  attributes and hidden `form-name` field on the contact form, and the
  Netlify Forms fallback in `js/main.js`.
- Remove the site (and, only once DNS is on Fasthosts, the DNS zone) from
  Netlify.
- Review the privacy and cookie pages for any remaining hosting references.
- Keep a private backup of the database (phpMyAdmin → *Export*) regularly.

## 12. Local testing

The PHP code can be tested on any Apache + PHP 8.1+ + MySQL/MariaDB set-up:

1. `npm run build:fasthosts`
2. Serve `dist/fasthosts/` with Apache (`AllowOverride All`, `mod_rewrite`,
   `mod_headers` enabled).
3. Create a local database, run the migration, and put a
   `compass-config.php` in `dist/` (one level above the served folder),
   pointing SMTP at a local test server such as MailHog/Mailpit.

The HTTPS/`www` redirects are skipped for `localhost` and any host other than
`compassconsultes.co.uk`.
