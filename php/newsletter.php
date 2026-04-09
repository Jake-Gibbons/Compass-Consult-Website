<?php
/**
 * Newsletter Subscription Handler
 * Compass Consult (Employability & Skills) Ltd
 *
 * Handles POST submissions from the footer newsletter sign-up form.
 * Stores subscribers in a local CSV file and returns a JSON response whose
 * shape is intentionally compatible with the Netlify subscriber API so that
 * the existing fetch()-based client code in js/main.js requires only a URL
 * change to work on a PHP host.
 *
 * Response shapes (matching the Netlify function in netlify/functions/subscribers.mts):
 *   New subscription   -> HTTP 201  { "id": "...", "email": "...", "subscribedAt": "..." }
 *   Already subscribed -> HTTP 200  { "message": "Already subscribed", "subscriber": {...} }
 *   Validation error   -> HTTP 400  { "error": "..." }
 *   Server error       -> HTTP 500  { "error": "..." }
 *
 * To activate on a PHP host:
 *   1. Upload this file (and the rest of the site) to the server's web root.
 *   2. In js/main.js (initializeNewsletterForm), change the two fetch() references
 *      from '/api/subscribers' to '/php/newsletter.php'.
 *   3. Create the private/ directory one level above the web root (recommended)
 *      or adjust DATA_FILE below. Ensure the web server process can write to it.
 *   4. Add a rule to .htaccess (Apache) or nginx config to block public access to
 *      the private/ directory if it sits inside the web root.
 *
 * NOTE: This file is not yet in use. It is prepared for future migration
 *       away from Netlify Functions.
 */

declare(strict_types=1);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Path to the CSV file used to persist subscribers.
 *
 * Store this OUTSIDE the web root to prevent direct downloads, e.g.:
 *   __DIR__ . '/../../private/subscribers.csv'   (two levels up from php/)
 *
 * If you must keep it inside the web root, deny public access via .htaccess:
 *   <FilesMatch "\.csv$">
 *       Require all denied
 *   </FilesMatch>
 */
const DATA_FILE = __DIR__ . '/../private/subscribers.csv';

/** Address that receives a brief notification on each new sign-up. Set to '' to disable. */
const NOTIFY_EMAIL = 'enquiries@compassconsultes.co.uk';

/** From address used in admin notification emails. */
const SENDER_FROM = 'no-reply@compassconsultes.co.uk';

/** Human-readable site name used in notification email subjects. */
const SITE_NAME = 'Compass Consult';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Send a JSON response and terminate execution.
 *
 * @param int   $status  HTTP status code.
 * @param array $payload Associative array to encode as JSON.
 */
function json_response(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Ensure the private directory and CSV file exist.
 * Creates both if necessary. Returns false if creation fails.
 */
function ensure_data_file(): bool
{
    $dir = dirname(DATA_FILE);

    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        return false;
    }

    if (!file_exists(DATA_FILE)) {
        $handle = fopen(DATA_FILE, 'w');
        if ($handle === false) {
            return false;
        }
        // Write the CSV header row.
        fputcsv($handle, ['id', 'email', 'subscribedAt']);
        fclose($handle);
    }

    return true;
}

/**
 * Load all subscribers from the CSV file, keyed by normalised email address.
 *
 * @return array<string, array{id: string, email: string, subscribedAt: string}>
 */
function load_subscribers(): array
{
    $subscribers = [];
    $handle = fopen(DATA_FILE, 'r');
    if ($handle === false) {
        return $subscribers;
    }

    $isHeader = true;
    while (($row = fgetcsv($handle)) !== false) {
        if ($isHeader) {
            $isHeader = false;
            continue;
        }
        if (count($row) < 3) {
            continue;
        }
        [$id, $email, $subscribedAt] = $row;
        $subscribers[$email] = compact('id', 'email', 'subscribedAt');
    }

    fclose($handle);
    return $subscribers;
}

/**
 * Append a single subscriber row to the CSV file.
 *
 * @param array{id: string, email: string, subscribedAt: string} $subscriber
 */
function append_subscriber(array $subscriber): bool
{
    $handle = fopen(DATA_FILE, 'a');
    if ($handle === false) {
        return false;
    }
    fputcsv($handle, [$subscriber['id'], $subscriber['email'], $subscriber['subscribedAt']]);
    fclose($handle);
    return true;
}

// ---------------------------------------------------------------------------
// Guard: only accept POST requests
// ---------------------------------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

// ---------------------------------------------------------------------------
// Parse request body — supports both JSON and form-encoded submissions
// ---------------------------------------------------------------------------

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$email = '';

if (str_contains($contentType, 'application/json')) {
    $rawBody = file_get_contents('php://input');
    $data    = json_decode($rawBody !== false ? $rawBody : '{}', true) ?? [];
    $email   = trim((string) ($data['email'] ?? ''));
} else {
    $email = trim((string) ($_POST['email'] ?? ''));
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    json_response(400, ['error' => 'A valid email address is required.']);
}

$email = strtolower($email);

// ---------------------------------------------------------------------------
// Ensure storage is available before proceeding
// ---------------------------------------------------------------------------

if (!ensure_data_file()) {
    error_log('[newsletter.php] Cannot create or access data file: ' . DATA_FILE);
    json_response(500, ['error' => 'Internal server error. Please try again later.']);
}

// Use a file lock to serialise concurrent requests and prevent CSV corruption.
$lockFile = DATA_FILE . '.lock';
$lock = fopen($lockFile, 'c');

if ($lock === false || !flock($lock, LOCK_EX)) {
    if ($lock !== false) {
        fclose($lock);
    }
    json_response(500, ['error' => 'Internal server error. Please try again later.']);
}

try {
    $subscribers = load_subscribers();

    // Duplicate check — return a 200 so the JS client shows the friendly message.
    if (isset($subscribers[$email])) {
        json_response(200, ['message' => 'Already subscribed', 'subscriber' => $subscribers[$email]]);
    }

    // Build the new subscriber record.
    $subscriber = [
        'id'           => bin2hex(random_bytes(16)),
        'email'        => $email,
        'subscribedAt' => gmdate('Y-m-d\TH:i:s\Z'),
    ];

    if (!append_subscriber($subscriber)) {
        error_log('[newsletter.php] Failed to write subscriber: ' . $email);
        json_response(500, ['error' => 'Internal server error. Please try again later.']);
    }

    // Send an optional admin notification.
    if (NOTIFY_EMAIL !== '') {
        $subject = sprintf('[%s] New newsletter subscriber: %s', SITE_NAME, $email);
        $body    = "A new visitor has subscribed to the " . SITE_NAME . " newsletter.\n\n"
                 . "Email: {$email}\n"
                 . "Date:  " . gmdate('d M Y H:i') . " UTC\n";
        $headers = "From: " . SENDER_FROM . "\r\nContent-Type: text/plain; charset=UTF-8\r\n";
        mail(NOTIFY_EMAIL, $subject, $body, $headers);
    }

    json_response(201, $subscriber);

} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
