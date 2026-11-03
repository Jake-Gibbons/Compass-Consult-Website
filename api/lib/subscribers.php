<?php
/**
 * Newsletter subscriber data access (PDO, prepared statements only).
 */
declare(strict_types=1);

/**
 * Accepted token format: 64 hex chars (new) or a UUID (imported from Netlify Blobs).
 */
function cc_valid_token(string $token): bool
{
    return (bool) preg_match('/^(?:[a-f0-9]{64}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/', $token);
}

function cc_new_token(): string
{
    return bin2hex(random_bytes(32));
}

function cc_unsubscribe_url(string $token): string
{
    return rtrim((string) cc_config()['site_url'], '/') . '/unsubscribe?token=' . rawurlencode($token);
}

/**
 * Subscribes an email. Handles duplicates and re-subscribing after an unsubscribe.
 *
 * @return array{status: 'created'|'resubscribed'|'existing', token: string, subscribedAt: string}
 */
function cc_subscribe(PDO $pdo, string $email, string $source, string $consentText, string $ipHash): array
{
    $select = $pdo->prepare('SELECT id, status, unsubscribe_token, consent_at, created_at FROM newsletter_subscribers WHERE email = ? LIMIT 1');
    $select->execute([$email]);
    $row = $select->fetch();

    if ($row && $row['status'] === 'subscribed') {
        return [
            'status' => 'existing',
            'token' => (string) $row['unsubscribe_token'],
            'subscribedAt' => cc_iso((string) ($row['consent_at'] ?: $row['created_at'])),
        ];
    }

    $token = cc_new_token();

    if ($row) {
        $update = $pdo->prepare(
            "UPDATE newsletter_subscribers
                SET status = 'subscribed', unsubscribe_token = ?, source = ?, consent_given = 1,
                    consent_text = ?, consent_at = UTC_TIMESTAMP(), ip_hash = ?, unsubscribed_at = NULL
              WHERE id = ?"
        );
        $update->execute([$token, $source, $consentText, $ipHash, (int) $row['id']]);
        return ['status' => 'resubscribed', 'token' => $token, 'subscribedAt' => gmdate('c')];
    }

    try {
        $insert = $pdo->prepare(
            "INSERT INTO newsletter_subscribers
                (email, status, unsubscribe_token, source, consent_given, consent_text, consent_at, ip_hash)
             VALUES (?, 'subscribed', ?, ?, 1, ?, UTC_TIMESTAMP(), ?)"
        );
        $insert->execute([$email, $token, $source, $consentText, $ipHash]);
    } catch (PDOException $e) {
        // 23000 = integrity constraint (a parallel request inserted the same email).
        if ($e->getCode() === '23000') {
            return cc_subscribe($pdo, $email, $source, $consentText, $ipHash);
        }
        throw $e;
    }

    return ['status' => 'created', 'token' => $token, 'subscribedAt' => gmdate('c')];
}

/**
 * Marks the subscriber with this token as unsubscribed. The row is kept (as a
 * suppression record) but the email will no longer receive the newsletter.
 */
function cc_unsubscribe(PDO $pdo, string $token): bool
{
    $token = strtolower(trim($token));
    if (!cc_valid_token($token)) {
        return false;
    }
    $stmt = $pdo->prepare(
        "UPDATE newsletter_subscribers
            SET status = 'unsubscribed', unsubscribed_at = COALESCE(unsubscribed_at, UTC_TIMESTAMP())
          WHERE unsubscribe_token = ?"
    );
    $stmt->execute([$token]);
    if ($stmt->rowCount() > 0) {
        return true;
    }
    // Already unsubscribed counts as success; unknown tokens do not.
    $check = $pdo->prepare('SELECT 1 FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1');
    $check->execute([$token]);
    return (bool) $check->fetchColumn();
}

/**
 * Looks up the email for a token (used to show it on the unsubscribe page).
 */
function cc_subscriber_by_token(PDO $pdo, string $token): ?array
{
    $token = strtolower(trim($token));
    if (!cc_valid_token($token)) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT email, status FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function cc_iso(string $mysqlUtc): string
{
    $ts = strtotime($mysqlUtc . ' UTC');
    return $ts === false ? gmdate('c') : gmdate('c', $ts);
}

/**
 * Masks an email for display, e.g. j***@example.com.
 */
function cc_mask_email(string $email): string
{
    [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');
    $visible = cc_substr($local, 0, 1);
    return $visible . str_repeat('*', max(1, min(6, cc_strlen($local) - 1))) . '@' . $domain;
}
