<?php
declare(strict_types=1);

const COMPASS_ALLOWED_INTERESTS = ['Mobilisation', 'Partnership', 'Governance', 'Other'];

contact_require_post();
contact_reject_cross_site_requests();

$wantsJson = contact_wants_json();
$data = contact_request_data();

if (!empty($data['bot-field'])) {
    contact_success_response($wantsJson);
}

$name = trim((string) ($data['name'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$interest = trim((string) ($data['interest'] ?? 'Other'));
$message = trim((string) ($data['message'] ?? ''));

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $message === '') {
    contact_error_response(422, 'Please complete the required contact form fields.', $wantsJson);
}

if (!in_array($interest, COMPASS_ALLOWED_INTERESTS, true)) {
    $interest = 'Other';
}

$recipient = getenv('COMPASS_CONTACT_RECIPIENT') ?: 'enquiries@compassconsultes.co.uk';
$host = $_SERVER['HTTP_HOST'] ?? 'compassconsultes.co.uk';
$defaultFrom = sprintf('no-reply@%s', preg_replace('/^www\./i', '', $host));
$from = getenv('COMPASS_CONTACT_FROM') ?: $defaultFrom;
$subject = sprintf('Website enquiry from %s', contact_clean_header_value($name));
$body = implode(PHP_EOL, [
    'Compass Consult website contact enquiry',
    '-------------------------------------',
    'Name: ' . $name,
    'Email: ' . $email,
    'Interest: ' . $interest,
    'Submitted: ' . gmdate('c'),
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
    '',
    'Message:',
    $message,
    '',
]);

$headers = [
    'From: Compass Consult Website <' . contact_clean_header_value($from) . '>',
    'Reply-To: ' . contact_clean_header_value($email),
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$mailSent = mail($recipient, $subject, $body, implode("\r\n", $headers));

if (!$mailSent) {
    contact_error_response(500, 'The message could not be sent right now. Please try again later.', $wantsJson);
}

contact_success_response($wantsJson);

function contact_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        contact_error_response(405, 'Method not allowed', contact_wants_json());
    }
}

function contact_request_data(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        return is_array($payload) ? $payload : [];
    }

    return $_POST;
}

function contact_wants_json(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    return stripos($accept, 'application/json') !== false
        || strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest';
}

function contact_reject_cross_site_requests(): void
{
    [$currentHost, $currentPort] = contact_current_origin();
    if ($currentHost === '') {
        return;
    }

    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $header) {
        $value = $_SERVER[$header] ?? '';
        if ($value === '') {
            continue;
        }

        $parsedHost = strtolower((string) parse_url($value, PHP_URL_HOST));
        if ($parsedHost === '') {
            continue;
        }

        $parsedPort = contact_port_for_url($value);
        if ($parsedHost !== $currentHost || $parsedPort !== $currentPort) {
            contact_error_response(403, 'Cross-site form submissions are not allowed.', contact_wants_json());
        }
    }
}

function contact_current_origin(): array
{
    $hostHeader = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($hostHeader === '') {
        return ['', contact_default_port()];
    }

    $host = strtolower((string) parse_url('http://' . $hostHeader, PHP_URL_HOST));
    $port = (int) parse_url('http://' . $hostHeader, PHP_URL_PORT);
    if ($port === 0) {
        $port = contact_default_port();
    }

    return [$host, $port];
}

function contact_default_port(): int
{
    $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
    return ($https !== '' && $https !== 'off') ? 443 : 80;
}

function contact_port_for_url(string $url): int
{
    $port = (int) parse_url($url, PHP_URL_PORT);
    if ($port !== 0) {
        return $port;
    }

    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    return $scheme === 'https' ? 443 : 80;
}

function contact_clean_header_value(string $value): string
{
    return trim(str_replace(["\r", "\n"], '', $value));
}

function contact_success_response(bool $wantsJson): void
{
    if ($wantsJson) {
        contact_json_response(200, ['ok' => true, 'message' => 'Message sent']);
    }

    contact_redirect('contact', 'success');
}

function contact_error_response(int $status, string $message, bool $wantsJson): void
{
    if ($wantsJson) {
        contact_json_response($status, ['error' => $message]);
    }

    contact_redirect('contact', 'error');
}

function contact_json_response(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function contact_redirect(string $key, string $value): void
{
    $fallback = '/pages/contact.html';
    $target = contact_safe_redirect_target($fallback);
    $separator = str_contains($target, '?') ? '&' : '?';
    header('Location: ' . $target . $separator . rawurlencode($key) . '=' . rawurlencode($value), true, 303);
    exit;
}

function contact_safe_redirect_target(string $fallback): string
{
    $referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    if ($referer === '' || strpbrk($referer, "\r\n") !== false) {
        return $fallback;
    }

    $parts = parse_url($referer);
    if ($parts === false) {
        return $fallback;
    }

    [$currentHost, $currentPort] = contact_current_origin();
    $refererHost = strtolower((string) ($parts['host'] ?? ''));
    if ($refererHost === '' || $refererHost !== $currentHost) {
        return $fallback;
    }

    $refererPort = isset($parts['port'])
        ? (int) $parts['port']
        : ((strtolower((string) ($parts['scheme'] ?? '')) === 'https') ? 443 : 80);

    if ($refererPort !== $currentPort) {
        return $fallback;
    }

    $path = (string) ($parts['path'] ?? '');
    if ($path === '' || !str_starts_with($path, '/')) {
        return $fallback;
    }

    $query = isset($parts['query']) ? '?' . $parts['query'] : '';
    return $path . $query;
}
