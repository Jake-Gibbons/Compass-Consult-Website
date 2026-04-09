<?php
/**
 * Contact Form Handler
 * Compass Consult (Employability & Skills) Ltd
 *
 * Handles POST submissions from the contact enquiry form on /pages/contact.html.
 * Returns a JSON response so the existing fetch()-based client code in js/main.js
 * works without modification once the form action attribute and fetch() URL are
 * updated to point here.
 *
 * To activate on a PHP host:
 *   1. Upload this file (and the rest of the site) to the server's web root.
 *   2. In pages/contact.html, change the <form> action attribute:
 *          action="/php/contact.php"
 *      and remove the Netlify-specific attributes (data-netlify, data-netlify-honeypot).
 *   3. In js/main.js (initializeContactForm), change the fetch() URL from '/' to
 *          '/php/contact.php'
 *   4. Set RECIPIENT_EMAIL below to the address that should receive submissions
 *      (already set to the site's contact address).
 *   5. Optionally configure SMTP via php.ini / .htaccess if the host's mail()
 *      function requires it.
 *
 * NOTE: This file is not yet in use. It is prepared for future migration
 *       away from Netlify Forms.
 */

declare(strict_types=1);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Address that receives all contact enquiry emails. */
const RECIPIENT_EMAIL = 'enquiries@compassconsultes.co.uk';

/** From address used in the sent email (must be a valid address on your domain). */
const SENDER_FROM = 'no-reply@compassconsultes.co.uk';

/** Human-readable site name used in email subjects. */
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
    // Prevent browsers/proxies from caching API responses.
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ---------------------------------------------------------------------------
// Guard: only accept POST requests
// ---------------------------------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

// ---------------------------------------------------------------------------
// Honeypot anti-spam check — bot-field must be empty
// ---------------------------------------------------------------------------

if (!empty($_POST['bot-field'])) {
    // Silently accept without sending the email so bots cannot detect the trap.
    json_response(200, ['ok' => true]);
}

// ---------------------------------------------------------------------------
// Collect and sanitise POST fields
// ---------------------------------------------------------------------------

$name     = trim(strip_tags((string) ($_POST['name']     ?? '')));
$email    = trim((string) filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL));
$interest = trim(strip_tags((string) ($_POST['interest'] ?? 'Other')));
$message  = trim(strip_tags((string) ($_POST['message']  ?? '')));

// ---------------------------------------------------------------------------
// Server-side validation (mirrors client-side rules in js/main.js)
// ---------------------------------------------------------------------------

$errors = [];

if ($name === '') {
    $errors[] = 'Name is required.';
}

if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    $errors[] = 'A valid email address is required.';
}

if ($message === '') {
    $errors[] = 'Message is required.';
}

// Whitelist allowed interest values to prevent injection.
$allowed_interests = ['Mobilisation', 'Partnership', 'Governance', 'Other'];
if (!in_array($interest, $allowed_interests, true)) {
    $interest = 'Other';
}

if (!empty($errors)) {
    json_response(422, ['error' => implode(' ', $errors)]);
}

// ---------------------------------------------------------------------------
// Build and send the notification email
// ---------------------------------------------------------------------------

$subject  = sprintf('[%s] New enquiry from %s', SITE_NAME, $name);

$body  = "You have received a new enquiry via the " . SITE_NAME . " website.\n\n";
$body .= "Name:     {$name}\n";
$body .= "Email:    {$email}\n";
$body .= "Interest: {$interest}\n\n";
$body .= "Message:\n{$message}\n";
$body .= "\n---\nThis message was submitted via the contact form at compassconsultes.co.uk.\n";

$headers  = "From: " . SENDER_FROM . "\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";

$sent = mail(RECIPIENT_EMAIL, $subject, $body, $headers);

if (!$sent) {
    error_log('[contact.php] mail() failed — submission from: ' . $email);
    json_response(500, [
        'error' => 'Failed to send message. Please try again or email us directly at enquiries@compassconsultes.co.uk.',
    ]);
}

json_response(200, ['ok' => true]);
