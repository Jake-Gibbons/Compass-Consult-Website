# Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Primary Deployment — IONOS](#primary-deployment--ionos)
4. [CI/CD — GitHub Actions](#cicd--github-actions)
5. [Environment Variables](#environment-variables)
6. [DNS Configuration](#dns-configuration)
7. [SSL / HTTPS](#ssl--https)
8. [Post-Deployment Tasks](#post-deployment-tasks)
9. [Rollback Procedure](#rollback-procedure)
10. [Troubleshooting Deployment](#troubleshooting-deployment)

---

## Overview

The site is now prepared for **IONOS web hosting**. Static files are built
locally, Apache behaviour is defined in the root `.htaccess`, and the
contact/newsletter forms are handled by PHP endpoints in `api/`.

**Live site:** https://compassconsultes.co.uk

---

## Pre-Deployment Checklist

- [ ] All pages tested locally (`npm run serve`)
- [ ] ESLint passing (`npm run lint`)
- [ ] No broken links (`npm run link-check`)
- [ ] CSS and JS built (`npm run build`)
- [ ] Contact form tested against the PHP endpoint
- [ ] Newsletter subscribe/unsubscribe tested against the PHP endpoint
- [ ] `storage/` exists on the host and is writable by PHP
- [ ] PHP mail is configured correctly in the IONOS account
- [ ] Mobile responsiveness verified

---

## Primary Deployment — IONOS

### How it works

1. Run `npm run build` locally.
2. Upload the repository contents to the IONOS web root (for example `public_html/`).
3. Apache reads `.htaccess` for HTTPS redirects, clean URLs, cache rules, and security headers.
4. Form submissions are routed to `api/contact.php` and `api/subscribers.php`.
5. Newsletter subscriptions are written to `storage/newsletter-subscribers.json`, which is blocked from public access by `storage/.htaccess`.

### Required files on the host

- All HTML, CSS, JS, image, and asset files
- `.htaccess`
- `api/contact.php`
- `api/subscribers.php`
- `storage/.htaccess`

### Recommended upload exclusions

Do not upload:

- `.git/`
- `node_modules/`
- local editor settings
- temporary files

---

## CI/CD — GitHub Actions

GitHub Actions still provide repository-side automation before deployment:

| Workflow | File | Purpose |
|---|---|---|
| Lint & Link Check | `.github/workflows/check.yml` | Runs `npm run check` on Node 18 and 20 |
| Generate Sitemap & Robots | `.github/workflows/main.yml` | Regenerates `sitemap.xml` and `robots.txt` |
| Sync Resources | `.github/workflows/sync-resources.yml` | Synchronises resource downloads and previews |

These workflows do **not** deploy directly to IONOS; deployment is now a
host upload/release step outside GitHub Actions.

---

## Environment Variables

The PHP handlers support these optional environment variables on the host:

| Variable | Description |
|---|---|
| `COMPASS_CONTACT_RECIPIENT` | Override the destination inbox for contact enquiries |
| `COMPASS_CONTACT_FROM` | Override the `From` address used by the contact handler |
| `COMPASS_SUBSCRIBERS_FILE` | Absolute path to the newsletter JSON storage file |

If not set, the contact handler defaults to `enquiries@compassconsultes.co.uk`
and the subscriber handler defaults to `storage/newsletter-subscribers.json`.

---

## DNS Configuration

Point the domain at the IONOS hosting space assigned to the site. The exact
values depend on the account and package, so confirm the final records in the
IONOS control panel before switching production traffic.

Typical setup:

```
Type     Name    Value
A        @       <IONOS server IP>
CNAME    www     <IONOS host target if provided>
```

---

## SSL / HTTPS

IONOS provides SSL support for hosted domains. Once the certificate is active,
`.htaccess` forces HTTP traffic onto HTTPS.

After go-live, verify:

- `http://compassconsultes.co.uk` redirects to HTTPS
- `http://www.compassconsultes.co.uk` redirects correctly
- there are no mixed-content warnings in the browser

---

## Post-Deployment Tasks

1. Visit the homepage and each key page on the live domain.
2. Submit the contact form and confirm the enquiry email is received.
3. Subscribe and unsubscribe through the newsletter form.
4. Confirm `storage/newsletter-subscribers.json` is not publicly accessible.
5. Re-submit `https://compassconsultes.co.uk/sitemap.xml` in search consoles if needed.
6. Check security headers and caching behaviour in the browser network panel.

---

## Rollback Procedure

### Option 1 — Re-upload previous release

Restore the last known-good deployment package to the IONOS web root.

### Option 2 — Git revert

```bash
git revert <commit-hash>
```

Build and upload the reverted state to IONOS.

---

## Troubleshooting Deployment

### Site not loading

- [ ] Confirm DNS now points at IONOS
- [ ] Confirm the files were uploaded to the correct web root
- [ ] Confirm `.htaccess` is present and Apache overrides are enabled

### Forms not working

- [ ] Confirm `api/contact.php` and `api/subscribers.php` were uploaded
- [ ] Confirm PHP is enabled for the site on IONOS
- [ ] Confirm `storage/` is writable by PHP and blocked from public access
- [ ] Confirm PHP mail is available for the contact form

### HTTPS not redirecting

- [ ] Confirm the SSL certificate is active in IONOS
- [ ] Confirm `.htaccess` is being read by Apache

---

**Last Updated:** June 2026  
**Created By:** Zenith IT
