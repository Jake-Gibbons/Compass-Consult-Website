# Fasthosts transfer

The public site is static HTML, CSS, and JavaScript. Fasthosts only needs PHP for the newsletter and contact form. Both write to MySQL.

## Upload

Upload the site into the Fasthosts web root (`public_html` or the domain folder). Do not upload `node_modules/`, `.git/`, `.netlify/`, or `api/config.php` from a developer machine.

Required runtime files:

- HTML pages, `css/`, `js/`, `assets/`, `sw.js`
- `.htaccess`
- `api/bootstrap.php`, `api/subscribers.php`, `api/contact.php`
- `api/config.php` created on the server from `api/config.example.php`

The old Netlify function in `netlify/functions/subscribers.mts` is not used on Fasthosts.

## Database

1. In the Fasthosts control panel, create a MySQL database and user.
2. Import `database/newsletter.sql`, or let the first request create the tables.
3. Copy `api/config.example.php` to `api/config.php` and set the host, database name, user, password, and a long `admin_token`.
4. Confirm `https://compassconsultes.co.uk/api/subscribers.php` returns `401` until the admin token is sent. A public `GET` must not list addresses.

Newsletter sign-up posts to `/api/subscribers`. `.htaccess` rewrites that to `api/subscribers.php`, so the existing page script does not need a rebuild. Unsubscribe uses `DELETE` and also accepts `POST` with `_method=DELETE`.

List subscribers:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://compassconsultes.co.uk/api/subscribers
```

## DNS

Point the domain at the Fasthosts web server only after the upload and a test subscription succeed. Remove the Netlify DNS records at the same time so the site does not stay split across hosts.

## Contact form

`pages/contact.html` posts to `/api/contact.php`. Messages are stored in `contact_enquiries`. If `notify_email` is set, PHP also calls `mail()`. Fasthosts must allow mail from the domain, otherwise the database row is still the record of the enquiry.
