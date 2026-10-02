<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Allow: GET, POST, DELETE, OPTIONS');
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$body = newsletter_request_body();
if ($method === 'POST' && strtoupper((string) ($body['_method'] ?? '')) === 'DELETE') {
    $method = 'DELETE';
}

if (newsletter_honeypot_tripped($body)) {
    newsletter_json(200, ['message' => 'Subscribed']);
}

$pdo = newsletter_db();

if ($method === 'GET') {
    if (!newsletter_admin_authorised()) {
        newsletter_json(401, ['code' => 'UNAUTHORISED', 'message' => 'Admin token is required to list subscribers.']);
    }

    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id !== '') {
        $statement = $pdo->prepare('SELECT id, email, subscribed_at FROM newsletter_subscribers WHERE id = :id');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        if (!$row) {
            newsletter_json(404, ['code' => 'NOT_FOUND', 'message' => 'Subscriber not found']);
        }
        newsletter_json(200, newsletter_format_row($row));
    }

    $rows = $pdo->query('SELECT id, email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC')->fetchAll();
    newsletter_json(200, array_map('newsletter_format_row', $rows));
}

if ($method === 'POST') {
    $email = newsletter_email((string) ($body['email'] ?? ''));
    $sourcePage = substr(trim((string) ($body['source_page'] ?? ($_SERVER['HTTP_REFERER'] ?? ''))), 0, 255);

    $existing = $pdo->prepare('SELECT id, email, subscribed_at FROM newsletter_subscribers WHERE email = :email');
    $existing->execute(['email' => $email]);
    $row = $existing->fetch();
    if ($row) {
        newsletter_json(200, ['message' => 'Already subscribed', 'subscriber' => newsletter_format_row($row)]);
    }

    $subscriber = [
        'id' => newsletter_uuid(),
        'email' => $email,
        'subscribed_at' => gmdate('Y-m-d H:i:s'),
        'source_page' => $sourcePage !== '' ? $sourcePage : null,
    ];
    $insert = $pdo->prepare(
        'INSERT INTO newsletter_subscribers (id, email, subscribed_at, source_page)
         VALUES (:id, :email, :subscribed_at, :source_page)'
    );
    $insert->execute($subscriber);
    newsletter_json(201, [
        'message' => 'Subscribed',
        'subscriber' => newsletter_format_row($subscriber),
    ]);
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? $body['id'] ?? ''));
    $email = trim((string) ($_GET['email'] ?? $body['email'] ?? ''));
    if ($id === '' && $email === '') {
        newsletter_json(400, ['code' => 'VALIDATION_FAILED', 'message' => 'ID or email is required']);
    }

    if ($id !== '') {
        $statement = $pdo->prepare('DELETE FROM newsletter_subscribers WHERE id = :id');
        $statement->execute(['id' => $id]);
    } else {
        $statement = $pdo->prepare('DELETE FROM newsletter_subscribers WHERE email = :email');
        $statement->execute(['email' => newsletter_email($email)]);
    }

    if ($statement->rowCount() === 0) {
        newsletter_json(404, ['code' => 'NOT_FOUND', 'message' => 'Subscriber not found']);
    }
    newsletter_json(200, ['message' => 'Unsubscribed']);
}

newsletter_json(405, ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Method not allowed']);
