<?php
declare(strict_types=1);

subscribers_reject_cross_site_requests();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$wantsJson = subscribers_wants_json();

if (!in_array($method, ['POST', 'DELETE'], true)) {
    subscribers_error_response(405, 'Method not allowed', $wantsJson);
}

$storagePath = getenv('COMPASS_SUBSCRIBERS_FILE') ?: dirname(__DIR__) . '/storage/newsletter-subscribers.json';

if ($method === 'POST') {
    $data = subscribers_request_data();

    if (!empty($data['bot-field'])) {
        subscribers_success_response(['message' => 'Subscribed'], 201, $wantsJson);
    }

    $email = strtolower(trim((string) ($data['email'] ?? '')));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        subscribers_error_response(422, 'Email is required.', $wantsJson);
    }

    $records = subscribers_load_records($storagePath);
    foreach ($records as $record) {
        if (($record['email'] ?? '') === $email) {
            subscribers_success_response([
                'message' => 'Already subscribed',
                'subscriber' => $record,
            ], 200, $wantsJson);
        }
    }

    $subscriber = [
        'id' => bin2hex(random_bytes(16)),
        'email' => $email,
        'subscribedAt' => gmdate('c'),
    ];
    $records[] = $subscriber;
    subscribers_save_records($storagePath, $records);

    subscribers_success_response([
        'message' => 'Subscribed',
        'subscriber' => $subscriber,
    ], 201, $wantsJson);
}

$id = trim((string) ($_GET['id'] ?? ''));
$email = strtolower(trim((string) ($_GET['email'] ?? '')));

if ($id === '' && $email === '') {
    subscribers_error_response(422, 'ID or email query parameter is required.', $wantsJson);
}

$records = subscribers_load_records($storagePath);
$filtered = array_values(array_filter($records, static function (array $record) use ($id, $email): bool {
    if ($id !== '') {
        return ($record['id'] ?? '') !== $id;
    }

    return strtolower((string) ($record['email'] ?? '')) !== $email;
}));

if (count($filtered) === count($records)) {
    subscribers_error_response(404, 'Subscriber not found', $wantsJson);
}

subscribers_save_records($storagePath, $filtered);
subscribers_success_response(['message' => 'Unsubscribed'], 200, $wantsJson);

function subscribers_request_data(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        return is_array($payload) ? $payload : [];
    }

    return $_POST;
}

function subscribers_wants_json(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    return stripos($accept, 'application/json') !== false
        || strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest';
}

function subscribers_reject_cross_site_requests(): void
{
    $currentHost = strtolower($_SERVER['HTTP_HOST'] ?? '');
    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $header) {
        $value = $_SERVER[$header] ?? '';
        if ($value === '') {
            continue;
        }

        $parsedHost = strtolower((string) parse_url($value, PHP_URL_HOST));
        if ($parsedHost !== '' && $parsedHost !== $currentHost) {
            subscribers_error_response(403, 'Cross-site requests are not allowed.', subscribers_wants_json());
        }
    }
}

function subscribers_load_records(string $storagePath): array
{
    $dir = dirname($storagePath);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        subscribers_error_response(500, 'Subscriber storage is not available.', subscribers_wants_json());
    }

    if (!file_exists($storagePath)) {
        if (file_put_contents($storagePath, "[]\n", LOCK_EX) === false) {
            subscribers_error_response(500, 'Subscriber storage could not be initialised.', subscribers_wants_json());
        }
    }

    $raw = file_get_contents($storagePath);
    if ($raw === false) {
        subscribers_error_response(500, 'Subscriber storage could not be read.', subscribers_wants_json());
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? array_values(array_filter($decoded, 'is_array')) : [];
}

function subscribers_save_records(string $storagePath, array $records): void
{
    $json = json_encode(array_values($records), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($storagePath, $json . PHP_EOL, LOCK_EX) === false) {
        subscribers_error_response(500, 'Subscriber storage could not be updated.', subscribers_wants_json());
    }
}

function subscribers_success_response(array $payload, int $status, bool $wantsJson): void
{
    if ($wantsJson) {
        subscribers_json_response($status, $payload);
    }

    subscribers_redirect('newsletter', $status >= 400 ? 'error' : 'success');
}

function subscribers_error_response(int $status, string $message, bool $wantsJson): void
{
    if ($wantsJson) {
        subscribers_json_response($status, ['error' => $message]);
    }

    subscribers_redirect('newsletter', 'error');
}

function subscribers_json_response(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function subscribers_redirect(string $key, string $value): void
{
    $fallback = '/index.html';
    $target = $_SERVER['HTTP_REFERER'] ?? $fallback;
    $separator = str_contains($target, '?') ? '&' : '?';
    header('Location: ' . $target . $separator . rawurlencode($key) . '=' . rawurlencode($value), true, 303);
    exit;
}
