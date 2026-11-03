<?php
/**
 * Shared helpers for the Compass Consult PHP endpoints (Fasthosts hosting).
 *
 * Loaded by the public endpoints in /api. This folder is blocked from direct
 * web access by .htaccess.
 */
declare(strict_types=1);

if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'PHP 8.1 or newer is required.';
    exit;
}

/**
 * Locates and loads the server configuration file.
 *
 * @return array<string, mixed>
 */
function cc_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $webRoot = dirname(__DIR__, 2);
    $candidates = array_filter([
        getenv('COMPASS_CONFIG') ?: null,
        dirname($webRoot) . '/compass-config.php',
        $webRoot . '/api/config.php',
    ]);

    $loaded = [];
    foreach ($candidates as $path) {
        if (is_file($path) && is_readable($path)) {
            $data = require $path;
            if (is_array($data)) {
                $loaded = $data;
                break;
            }
        }
    }

    $defaults = [
        'site_url' => 'https://compassconsultes.co.uk',
        'db' => ['host' => '', 'port' => 3306, 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'],
        'mail' => [
            'to' => 'enquiries@compassconsultes.co.uk',
            'from_email' => 'no-reply@compassconsultes.co.uk',
            'from_name' => 'Compass Consult website',
            'transport' => 'mail',
            'smtp' => ['host' => '', 'port' => 587, 'encryption' => 'tls', 'username' => '', 'password' => '', 'timeout' => 15],
        ],
        'ip_hash_salt' => '',
        'storage_dir' => null,
        'rate_limits' => [
            'subscribe' => ['limit' => 10, 'window' => 3600],
            'unsubscribe' => ['limit' => 20, 'window' => 3600],
            'contact' => ['limit' => 5, 'window' => 900],
        ],
        'debug' => false,
    ];

    $config = array_replace_recursive($defaults, $loaded);
    return $config;
}

/**
 * Returns a shared PDO connection (UTC session time zone, exceptions on error).
 */
function cc_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db = cc_config()['db'];
    if (($db['host'] ?? '') === '' || ($db['name'] ?? '') === '' || ($db['user'] ?? '') === '') {
        throw new RuntimeException('Database configuration is missing.');
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'],
        (int) ($db['port'] ?? 3306),
        $db['name'],
        $db['charset'] ?? 'utf8mb4'
    );

    $pdo = new PDO($dsn, (string) $db['user'], (string) $db['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");

    return $pdo;
}

/**
 * Sends standard headers for API responses.
 */
function cc_api_headers(): void
{
    header('Cache-Control: no-store, max-age=0');
    header('X-Robots-Tag: noindex, nofollow');
    header('X-Content-Type-Options: nosniff');
}

/**
 * Emits a JSON response and stops.
 *
 * @param array<string, mixed> $payload
 * @param array<string, string> $headers
 */
function cc_json(int $status, array $payload, array $headers = []): never
{
    http_response_code($status);
    cc_api_headers();
    header('Content-Type: application/json; charset=utf-8');
    foreach ($headers as $name => $value) {
        header($name . ': ' . $value);
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * True when the caller expects JSON (fetch from our JS) rather than a full page
 * (a plain HTML form post with JavaScript disabled).
 */
function cc_wants_json(): bool
{
    $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    $requestedWith = strtolower((string) ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''));

    if (str_contains($contentType, 'application/json') || $requestedWith === 'xmlhttprequest') {
        return true;
    }
    if (str_contains($accept, 'application/json')) {
        return true;
    }
    return !str_contains($accept, 'text/html');
}

/**
 * Reads the request body as an associative array (JSON, urlencoded or multipart).
 *
 * @return array<string, mixed>
 */
function cc_request_data(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_contains($contentType, 'application/json')) {
        $raw = file_get_contents('php://input', false, null, 0, 65536);
        $decoded = json_decode($raw === false ? '' : $raw, true);
        return is_array($decoded) ? $decoded : [];
    }
    return $_POST;
}

/**
 * Fetches a trimmed string field from request data, capped in length.
 *
 * @param array<string, mixed> $data
 */
function cc_field(array $data, string $name, int $maxLength = 1000): string
{
    $value = $data[$name] ?? '';
    if (!is_scalar($value)) {
        return '';
    }
    $value = trim((string) $value);
    // Strip ASCII control characters except tab/newline/carriage return.
    $value = (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
    if (cc_strlen($value) > $maxLength) {
        $value = cc_substr($value, 0, $maxLength);
    }
    return $value;
}

/**
 * UTF-8 aware length/substring that work even when the mbstring extension is
 * not enabled on the host.
 */
function cc_strlen(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    return (int) preg_match_all('/./us', $value);
}

function cc_substr(string $value, int $start, int $length): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, $start, $length, 'UTF-8');
    }
    preg_match_all('/./us', $value, $chars);
    return implode('', array_slice($chars[0], $start, $length));
}

/**
 * Normalises and validates an email address. Returns '' when invalid.
 */
function cc_normalise_email(string $email): string
{
    $email = strtolower(trim($email));
    if ($email === '' || strlen($email) > 254) {
        return '';
    }
    if (preg_match('/[\r\n]/', $email)) {
        return '';
    }
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false ? $email : '';
}

/**
 * Salted SHA-256 of the client IP. Raw IPs are never stored.
 */
function cc_ip_hash(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $salt = (string) cc_config()['ip_hash_salt'];
    return hash('sha256', $salt . '|' . $ip);
}

/**
 * Simple fixed-window rate limiter backed by small files (works without the DB).
 * Returns true when the request is allowed.
 */
function cc_rate_limit(string $bucket): bool
{
    $rules = cc_config()['rate_limits'][$bucket] ?? null;
    if (!is_array($rules)) {
        return true;
    }
    $limit = max(1, (int) ($rules['limit'] ?? 10));
    $window = max(1, (int) ($rules['window'] ?? 3600));

    $dir = cc_config()['storage_dir'] ?: (rtrim(sys_get_temp_dir(), '/') . '/compass-consult-ratelimit');
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        error_log('compass: rate-limit storage not writable: ' . $dir);
        return true; // fail open rather than block real visitors
    }

    $windowStart = (int) (floor(time() / $window) * $window);
    $file = $dir . '/' . preg_replace('/[^a-z0-9_-]/i', '', $bucket) . '-' . substr(cc_ip_hash(), 0, 40) . '.json';

    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return true;
    }

    try {
        flock($handle, LOCK_EX);
        $contents = stream_get_contents($handle);
        $state = json_decode($contents === false ? '' : $contents, true);
        if (!is_array($state) || ($state['window'] ?? 0) !== $windowStart) {
            $state = ['window' => $windowStart, 'hits' => 0];
        }
        $state['hits']++;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, (string) json_encode($state));
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }

    // Opportunistic clean-up of stale counters (roughly 1 in 50 requests).
    if (random_int(1, 50) === 1) {
        foreach (glob($dir . '/*.json') ?: [] as $old) {
            if (@filemtime($old) < time() - 86400) {
                @unlink($old);
            }
        }
    }

    return $state['hits'] <= $limit;
}

/**
 * Rejects cross-site POSTs from browsers (basic CSRF hardening). Requests with
 * no Origin header (non-browser clients, older browsers) are allowed through.
 */
function cc_check_same_origin(): bool
{
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '' || $origin === 'null') {
        return true;
    }
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $host = strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    $siteHost = strtolower((string) parse_url((string) cc_config()['site_url'], PHP_URL_HOST));

    $allowed = array_filter([$host, $siteHost, $siteHost !== '' ? 'www.' . $siteHost : '']);
    return in_array($originHost, $allowed, true);
}

function cc_h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Renders a small standalone HTML page (used when JavaScript is unavailable
 * and for the unsubscribe flow).
 */
function cc_html_page(int $status, string $title, string $bodyHtml): never
{
    http_response_code($status);
    cc_api_headers();
    header('Content-Type: text/html; charset=utf-8');
    $t = cc_h($title);
    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>{$t} | Compass Consult</title>
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon/favicon-32x32.png">
<style>
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f9fafb;color:#374151;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:1.5rem;box-sizing:border-box}
  main{max-width:34rem;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:1.25rem;padding:2.5rem;box-shadow:0 10px 30px rgba(0,0,0,.06);text-align:center}
  img{max-width:200px;height:auto;margin:0 auto 1.5rem;display:block}
  h1{font-size:1.6rem;color:#111827;margin:0 0 .75rem}
  p{line-height:1.6;margin:0 0 1rem}
  a.btn,button{display:inline-block;background:#5b2a86;color:#fff;border:0;border-radius:.75rem;padding:.8rem 1.4rem;font-weight:700;font-size:1rem;text-decoration:none;cursor:pointer}
  a.btn:hover,button:hover{background:#7a3fb0}
  .muted{color:#6b7280;font-size:.9rem}
</style>
</head>
<body>
<main>
<img src="/assets/logos/optimized/Logo-320.webp" width="320" height="139" alt="Compass Consult">
<h1>{$t}</h1>
{$bodyHtml}
</main>
</body>
</html>
HTML;
    exit;
}

/**
 * Builds a "back to where you came from" link, limited to this site.
 */
function cc_return_path(string $fallback = '/'): string
{
    $referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    if ($referer === '') {
        return $fallback;
    }
    $parts = parse_url($referer);
    $host = strtolower((string) ($parts['host'] ?? ''));
    $current = strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    if ($host !== '' && $host !== $current) {
        return $fallback;
    }
    $path = (string) ($parts['path'] ?? '/');
    return str_starts_with($path, '/') && !str_starts_with($path, '//') ? $path : $fallback;
}

/**
 * Logs an exception without leaking details to the visitor.
 */
function cc_log_exception(string $context, Throwable $e): void
{
    error_log(sprintf('compass %s: %s: %s', $context, get_class($e), $e->getMessage()));
}
