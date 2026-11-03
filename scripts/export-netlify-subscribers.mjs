#!/usr/bin/env node
/**
 * Exports newsletter subscribers from Netlify Blobs (store "newsletter-subscribers")
 * so they can be imported into the Fasthosts MySQL database.
 *
 * READ ONLY: this script never writes to or deletes from Netlify Blobs.
 *
 * Usage:
 *   NETLIFY_SITE_ID=95f79584-208a-4385-b6bb-7ed5e6cf793a \
 *   NETLIFY_AUTH_TOKEN=<personal access token> \
 *   node scripts/export-netlify-subscribers.mjs [outDir]
 *
 * Writes (default outDir: ./subscriber-export, git-ignored):
 *   subscribers.json   raw records [{id, email, subscribedAt}]
 *   subscribers.csv    email,subscribed_at
 *   import.sql         INSERT IGNORE statements for phpMyAdmin / mysql
 *
 * The Netlify subscriber id is kept as the unsubscribe token, so visitors who
 * subscribed on Netlify can still unsubscribe from the same browser after the move.
 *
 * Offline mode (no Netlify access): pass --from-json <file> to just regenerate
 * the CSV/SQL from an existing subscribers.json.
 */
import { promises as fs } from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const fromJsonIndex = args.indexOf('--from-json');
const fromJson = fromJsonIndex >= 0 ? args[fromJsonIndex + 1] : null;
const positional = args.filter((a, i) => !a.startsWith('--') && !(fromJsonIndex >= 0 && i === fromJsonIndex + 1));
const outDir = path.resolve(positional[0] || 'subscriber-export');

const EMAIL_RE = /^[^\s@"\\]+@[^\s@"'\\]+\.[^\s@"'\\]+$/;
const TOKEN_RE = /^(?:[a-f0-9]{64}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;

async function loadFromNetlify() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!siteID || !token) {
    throw new Error('Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN (or use --from-json <file>).');
  }
  const { getStore } = await import('@netlify/blobs');
  const store = getStore({ name: 'newsletter-subscribers', siteID, token });
  const records = [];
  const { blobs } = await store.list();
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: 'json' });
    if (data) records.push({ id: data.id || blob.key, email: data.email, subscribedAt: data.subscribedAt });
  }
  return records;
}

function sqlString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function toMysqlDatetime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function normalise(records) {
  const seen = new Map();
  const skipped = [];
  for (const r of records) {
    const email = String(r.email || '').trim().toLowerCase();
    const id = String(r.id || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) { skipped.push({ reason: 'invalid email', record: r }); continue; }
    if (!TOKEN_RE.test(id)) { skipped.push({ reason: 'invalid id', record: r }); continue; }
    const at = toMysqlDatetime(r.subscribedAt) || toMysqlDatetime(new Date().toISOString());
    const existing = seen.get(email);
    // Keep the earliest sign-up if the same email appears twice.
    if (!existing || at < existing.at) seen.set(email, { email, id, at });
  }
  return { rows: [...seen.values()].sort((a, b) => a.at.localeCompare(b.at)), skipped };
}

async function main() {
  const records = fromJson ? JSON.parse(await fs.readFile(fromJson, 'utf8')) : await loadFromNetlify();
  const { rows, skipped } = normalise(Array.isArray(records) ? records : []);

  await fs.mkdir(outDir, { recursive: true });
  if (!fromJson) {
    await fs.writeFile(path.join(outDir, 'subscribers.json'), JSON.stringify(records, null, 2));
  }

  const csv = ['email,subscribed_at_utc', ...rows.map((r) => `${r.email},${r.at}`)].join('\n') + '\n';
  await fs.writeFile(path.join(outDir, 'subscribers.csv'), csv);

  const consent = 'Subscribed to the Compass Consult newsletter via the website sign-up form (imported from Netlify).';
  const sql = [
    '-- Compass Consult: newsletter subscribers imported from Netlify Blobs',
    `-- Generated ${new Date().toISOString()} — ${rows.length} subscriber(s)`,
    '-- Run AFTER database/migrations/001_create_newsletter_subscribers.sql.',
    '-- INSERT IGNORE skips anyone already in the table, so it is safe to re-run.',
    "SET time_zone = '+00:00';",
    ...rows.map((r) =>
      'INSERT IGNORE INTO newsletter_subscribers (email, status, unsubscribe_token, source, consent_given, consent_text, consent_at, created_at) VALUES ' +
      `(${sqlString(r.email)}, 'subscribed', ${sqlString(r.id)}, 'netlify-import', 1, ${sqlString(consent)}, ${sqlString(r.at)}, ${sqlString(r.at)});`
    ),
    '',
  ].join('\n');
  await fs.writeFile(path.join(outDir, 'import.sql'), sql);

  console.log(`Exported ${rows.length} subscriber(s) to ${outDir}`);
  if (skipped.length) {
    console.warn(`Skipped ${skipped.length} record(s):`);
    for (const s of skipped) console.warn(` - ${s.reason}: ${JSON.stringify(s.record)}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
