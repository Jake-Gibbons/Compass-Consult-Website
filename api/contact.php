<?php
/**
 * Contact enquiry endpoint — replaces the Netlify Forms "contact" form.
 * Public URL: /api/contact (also receives no-JavaScript posts to /pages/contact.html).
 *
 * Spam protection: hidden honeypot field, per-IP rate limiting, same-origin
 * check, length limits and header-injection-safe email headers.
 */
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/mailer.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method !== 'POST') {
    cc_json(405, ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Method not allowed'], ['Allow' => 'POST']);
}

$wantsJson = cc_wants_json();
$contactPage = '/pages/contact.html';

$respond = static function (int $status, bool $ok, string $code, string $message) use ($wantsJson, $contactPage): never {
    if ($wantsJson) {
        cc_json($status, $ok ? ['message' => $message] : ['code' => $code, 'message' => $message]);
    }
    if ($ok) {
        cc_html_page($status, 'Message sent', '<p>Thank you for your enquiry. We will get back to you as soon as possible.</p><p><a class="btn" href="/">Back to the website</a></p>');
    }
    cc_html_page($status, 'Message not sent', '<p>' . cc_h($message) . '</p><p>You can also email us directly at <a href="mailto:enquiries@compassconsultes.co.uk">enquiries@compassconsultes.co.uk</a>.</p><p><a class="btn" href="' . cc_h($contactPage) . '">Back to the contact form</a></p>');
};

if (!cc_check_same_origin()) {
    $respond(403, false, 'FORBIDDEN', 'Cross-site requests are not allowed.');
}

if (!cc_rate_limit('contact')) {
    header('Retry-After: 900');
    $respond(429, false, 'RATE_LIMITED', 'You have sent several messages in a short time. Please wait a few minutes and try again.');
}

$data = cc_request_data();

// Honeypot filled in: almost certainly a bot. Report success, send nothing.
if (cc_field($data, 'bot-field', 200) !== '') {
    $respond(200, true, 'OK', 'Message sent');
}

$name = cc_field($data, 'name', 120);
$name = trim((string) preg_replace('/\s+/u', ' ', $name)); // single line: it is used in the subject
$email = cc_normalise_email(cc_field($data, 'email', 254));
$interest = cc_field($data, 'interest', 60);
$message = cc_field($data, 'message', 5000);

$allowedInterests = ['Mobilisation', 'Partnership', 'Governance', 'Other'];
if (!in_array($interest, $allowedInterests, true)) {
    $interest = 'Other';
}

$errors = [];
if ($name === '') {
    $errors['name'] = 'Please enter your name.';
}
if ($email === '') {
    $errors['email'] = 'Please enter a valid email address.';
}
if (cc_strlen($message) < 2) {
    $errors['message'] = 'Please enter your message.';
}

if ($errors) {
    if ($wantsJson) {
        cc_json(400, ['code' => 'VALIDATION_FAILED', 'message' => 'Please check the highlighted fields.', 'errors' => $errors]);
    }
    $respond(400, false, 'VALIDATION_FAILED', implode(' ', $errors));
}

// Very rough link-spam filter: lots of URLs in a short message.
if (preg_match_all('~https?://~i', $message) > 5) {
    $respond(200, true, 'OK', 'Message sent');
}

$submittedAt = (new DateTimeImmutable('now', new DateTimeZone('Europe/London')))->format('j F Y, H:i T');
$body = implode("\n", [
    'New enquiry from the Compass Consult website contact form.',
    '',
    'Name:     ' . $name,
    'Email:    ' . $email,
    'Interest: ' . $interest,
    'Sent:     ' . $submittedAt,
    '',
    'Message:',
    $message,
    '',
    '--',
    'Reply to this email to respond directly to the sender.',
]);

$to = (string) cc_config()['mail']['to'];
$subject = 'New enquiry from ' . $name . ' (' . $interest . ')';

try {
    $sent = cc_send_mail($to, $subject, $body, $email);
} catch (Throwable $e) {
    cc_log_exception('contact', $e);
    $sent = false;
}

if (!$sent) {
    $respond(500, false, 'SEND_FAILED', 'Sorry, we could not send your message just now.');
}

$respond(200, true, 'OK', 'Message sent');
