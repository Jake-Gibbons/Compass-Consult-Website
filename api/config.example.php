<?php
/**
 * Compass Consult — server configuration (EXAMPLE).
 *
 * Copy this file and fill in the real values. Do NOT commit the real file.
 *
 * Where to put the real file (first match wins):
 *   1. The path in the COMPASS_CONFIG environment variable, if set.
 *   2. compass-config.php in the folder ABOVE the web root (recommended on
 *      Fasthosts, e.g. alongside htdocs/ so it can never be served).
 *   3. api/config.php inside the web root (git-ignored and blocked by .htaccess).
 */
declare(strict_types=1);

return [
    // Public site URL, used to build unsubscribe links. No trailing slash.
    'site_url' => 'https://compassconsultes.co.uk',

    // MySQL database (Fasthosts control panel → Databases → MySQL).
    'db' => [
        'host'    => 'your-db-host.example.com', // Fasthosts shows this on the database page
        'port'    => 3306,
        'name'    => 'your_database_name',
        'user'    => 'your_database_user',
        'pass'    => 'your-database-password',
        'charset' => 'utf8mb4',
    ],

    // Where contact-form enquiries are delivered.
    'mail' => [
        'to'         => 'enquiries@compassconsultes.co.uk',
        'from_email' => 'no-reply@compassconsultes.co.uk', // must be a mailbox/domain the SMTP account may send as
        'from_name'  => 'Compass Consult website',

        // 'smtp' (recommended) or 'mail' (PHP mail(), uses the host's sendmail).
        // IMPORTANT: the domain's mail is on Microsoft 365 and its SPF record is
        // "v=spf1 include:spf.protection.outlook.com -all". Whatever sends these
        // emails must be allowed by SPF, or Microsoft 365 will reject/junk them:
        //   Option A (recommended): a Fasthosts mailbox on this domain via
        //     smtp.livemail.co.uk, AND add include:_spf.livemail.co.uk to SPF.
        //   Option B: a Microsoft 365 mailbox via smtp.office365.com:587 (tls),
        //     with "Authenticated SMTP" enabled for that mailbox. Microsoft turns
        //     this off by default from the end of December 2026 (admins can
        //     re-enable it), so treat it as short-term.
        // See docs/FASTHOSTS-CUTOVER.md → "Email for the contact form".
        'transport'  => 'smtp',
        'smtp' => [
            'host'       => 'smtp.livemail.co.uk', // or smtp.office365.com (Option B)
            'port'       => 587,
            'encryption' => 'tls', // 'tls' (STARTTLS, usually port 587), 'ssl' (port 465) or 'none'
            'username'   => 'no-reply@compassconsultes.co.uk',
            'password'   => 'your-mailbox-password',
            'timeout'    => 15,
        ],
    ],

    // Long random string used to hash IP addresses for rate limiting and
    // consent records. Generate with: php -r "echo bin2hex(random_bytes(32));"
    'ip_hash_salt' => 'replace-with-a-long-random-string',

    // Folder for rate-limit counters. Must be writable by PHP. Leave null to use
    // the system temp folder. Ideally outside the web root.
    'storage_dir' => null,

    // Requests allowed per IP address per window.
    'rate_limits' => [
        'subscribe'   => ['limit' => 10, 'window' => 3600],
        'unsubscribe' => ['limit' => 20, 'window' => 3600],
        'contact'     => ['limit' => 5,  'window' => 900],
    ],

    // Set to true only while debugging locally; never in production.
    'debug' => false,
];
