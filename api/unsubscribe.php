<?php
/**
 * Unsubscribe page — public URL: /unsubscribe?token=...
 *
 * GET shows a confirmation button (so email link scanners cannot unsubscribe
 * people by just opening the link). POST performs the unsubscribe. Also
 * supports RFC 8058 one-click unsubscribe (List-Unsubscribe-Post).
 */
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/subscribers.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$token = trim((string) ($_POST['token'] ?? $_GET['token'] ?? $_GET['id'] ?? ''));

if ($method !== 'GET' && $method !== 'HEAD' && $method !== 'POST') {
    header('Allow: GET, POST');
    cc_html_page(405, 'Method not allowed', '<p>Please use the unsubscribe link from your email.</p>');
}

$invalid = static function (): never {
    cc_html_page(404, 'Link not recognised', '<p>This unsubscribe link is invalid or has expired.</p><p>If you would still like to be removed from our mailing list, email <a href="mailto:enquiries@compassconsultes.co.uk">enquiries@compassconsultes.co.uk</a> and we will remove you.</p><p><a class="btn" href="/">Back to the website</a></p>');
};

if ($token === '' || !cc_valid_token($token)) {
    $invalid();
}

try {
    $pdo = cc_db();

    if ($method === 'POST') {
        if (!cc_check_same_origin() || !cc_rate_limit('unsubscribe')) {
            cc_html_page(429, 'Please try again later', '<p>We could not process that request just now. Please try again later.</p>');
        }
        if (!cc_unsubscribe($pdo, $token)) {
            $invalid();
        }
        cc_html_page(200, 'You have been unsubscribed', '<p>You will no longer receive the Compass Consult newsletter.</p><p><a class="btn" href="/">Back to the website</a></p>');
    }

    $subscriber = cc_subscriber_by_token($pdo, $token);
    if ($subscriber === null) {
        $invalid();
    }
    if ($subscriber['status'] === 'unsubscribed') {
        cc_html_page(200, 'Already unsubscribed', '<p>' . cc_h(cc_mask_email((string) $subscriber['email'])) . ' is not on our newsletter list.</p><p><a class="btn" href="/">Back to the website</a></p>');
    }

    $masked = cc_h(cc_mask_email((string) $subscriber['email']));
    $tokenAttr = cc_h($token);
    cc_html_page(200, 'Unsubscribe from the newsletter', <<<HTML
<p>Click the button below to stop receiving the Compass Consult newsletter at <strong>{$masked}</strong>.</p>
<form method="post" action="/unsubscribe">
  <input type="hidden" name="token" value="{$tokenAttr}">
  <button type="submit">Unsubscribe</button>
</form>
<p class="muted" style="margin-top:1.25rem"><a href="/">No thanks, take me back to the website</a></p>
HTML);
} catch (Throwable $e) {
    cc_log_exception('unsubscribe', $e);
    cc_html_page(500, 'Something went wrong', '<p>Please try again in a moment, or email <a href="mailto:enquiries@compassconsultes.co.uk">enquiries@compassconsultes.co.uk</a>.</p>');
}
