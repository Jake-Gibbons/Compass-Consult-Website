<?php
declare(strict_types=1);

function newsletter_config(): array
{
    $path = __DIR__ . '/config.php';
    if (!is_file($path)) {
        newsletter_json(500, [
            'code' => 'CONFIG_MISSING',
            'message' => 'Newsletter database is not configured. Copy api/config.example.php to api/config.php on the server.',
        ]);
    }

    $config = require $path;
    if (!is_array($config)) {
        newsletter_json(500, ['code' => 'CONFIG_INVALID', 'message' => 'Newsletter config is invalid.']);
    }

    return $config;
}

function newsletter_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = newsletter_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $config['db_host'],
        $config['db_name'],
        $config['db_charset'] ?? 'utf8mb4'
    );

    try {
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $exception) {
        newsletter_json(500, ['code' => 'DATABASE_UNAVAILABLE', 'message' => 'Newsletter database is unavailable.']);
    }

    newsletter_ensure_schema($pdo);
    return $pdo;
}

function newsletter_ensure_schema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id CHAR(36) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subscribed_at DATETIME NOT NULL,
            source_page VARCHAR(255) NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_newsletter_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS contact_enquiries (
            id CHAR(36) NOT NULL,
            name VARCHAR(160) NOT NULL,
            email VARCHAR(255) NOT NULL,
            interest VARCHAR(160) NULL,
            message TEXT NOT NULL,
            submitted_at DATETIME NOT NULL,
            source_page VARCHAR(255) NULL,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function newsletter_json(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function newsletter_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

function newsletter_email(string $value): string
{
    $email = strtolower(trim($value));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
        newsletter_json(400, ['code' => 'VALIDATION_FAILED', 'message' => 'A valid email address is required.']);
    }
    return $email;
}

function newsletter_request_body(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $decoded = json_decode(file_get_contents('php://input') ?: '', true);
        return is_array($decoded) ? $decoded : [];
    }
    return $_POST;
}

function newsletter_honeypot_tripped(array $body): bool
{
    return trim((string) ($body['bot-field'] ?? '')) !== '';
}

function newsletter_format_row(array $row): array
{
    $subscribedAt = $row['subscribed_at'];
    $timestamp = strtotime($subscribedAt . ' UTC') ?: strtotime($subscribedAt);
    return [
        'id' => $row['id'],
        'email' => $row['email'],
        'subscribedAt' => gmdate('c', $timestamp ?: time()),
    ];
}

function newsletter_admin_authorised(): bool
{
    $config = newsletter_config();
    $expected = (string) ($config['admin_token'] ?? '');
    if ($expected === '' || $expected === 'change-me-to-a-long-random-string') {
        return false;
    }

    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches) && hash_equals($expected, trim($matches[1]))) {
        return true;
    }

    $token = (string) ($_GET['token'] ?? '');
    return $token !== '' && hash_equals($expected, $token);
}
