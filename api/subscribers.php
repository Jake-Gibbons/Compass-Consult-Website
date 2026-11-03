<?php
/**
 * Public newsletter endpoint — replaces netlify/functions/subscribers.mts.
 * Public URL: /api/subscribers (rewritten here by .htaccess).
 *
 *   POST   subscribe. Body: JSON {email, source?} or a normal form post.
 *   DELETE unsubscribe. Query: ?id=<unsubscribe token>.
 *
 * There is deliberately no way to list or read subscribers over HTTP.
 */
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/subscribers.php';

const CC_CONSENT_TEXT = 'Subscribed to the Compass Consult newsletter via the website sign-up form.';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$allow = ['Allow' => 'POST, DELETE'];

if ($method === 'OPTIONS') {
    http_response_code(204);
    cc_api_headers();
    header('Allow: POST, DELETE, OPTIONS');
    exit;
}

if ($method !== 'POST' && $method !== 'DELETE') {
    cc_json(405, ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Method not allowed'], $allow);
}

$wantsJson = cc_wants_json();

$fail = static function (int $status, string $code, string $message) use ($wantsJson): never {
    if ($wantsJson) {
        cc_json($status, ['code' => $code, 'message' => $message]);
    }
    $back = cc_h(cc_return_path());
    cc_html_page($status, 'Subscription problem', '<p>' . cc_h($message) . '</p><p><a class="btn" href="' . $back . '">Go back</a></p>');
};

if (!cc_check_same_origin()) {
    $fail(403, 'FORBIDDEN', 'Cross-site requests are not allowed.');
}

try {
    if ($method === 'POST') {
        if (!cc_rate_limit('subscribe')) {
            header('Retry-After: 3600');
            $fail(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
        }

        $data = cc_request_data();

        // Honeypot: real visitors never fill this hidden field. Pretend success.
        if (cc_field($data, 'bot-field', 200) !== '' || cc_field($data, 'website', 200) !== '') {
            if ($wantsJson) {
                cc_json(201, ['message' => 'Subscribed', 'subscriber' => ['email' => '', 'subscribedAt' => gmdate('c')]]);
            }
            cc_html_page(200, 'Thanks for subscribing', '<p>You have been added to the Compass Consult newsletter list.</p><p><a class="btn" href="/">Back to the website</a></p>');
        }

        $rawEmail = cc_field($data, 'email', 320);
        if ($rawEmail === '') {
            $fail(400, 'VALIDATION_FAILED', 'Email is required');
        }
        $email = cc_normalise_email($rawEmail);
        if ($email === '') {
            $fail(400, 'VALIDATION_FAILED', 'Please enter a valid email address');
        }

        $source = cc_field($data, 'source', 255);
        if ($source === '') {
            $source = cc_return_path('website');
        }

        $result = cc_subscribe(cc_db(), $email, $source, CC_CONSENT_TEXT, cc_ip_hash());

        if ($wantsJson) {
            if ($result['status'] === 'existing') {
                // Do not hand out the unsubscribe token for an address this
                // browser did not just sign up.
                cc_json(200, [
                    'message' => 'Already subscribed',
                    'subscriber' => ['email' => $email, 'subscribedAt' => $result['subscribedAt']],
                ]);
            }
            cc_json(201, [
                'message' => 'Subscribed',
                'subscriber' => ['id' => $result['token'], 'email' => $email, 'subscribedAt' => $result['subscribedAt']],
            ]);
        }

        $back = cc_h(cc_return_path());
        if ($result['status'] === 'existing') {
            cc_html_page(200, 'Already subscribed', '<p>That email address is already on the Compass Consult newsletter list.</p><p><a class="btn" href="' . $back . '">Back to the website</a></p>');
        }
        $unsubscribeUrl = cc_h(cc_unsubscribe_url($result['token']));
        cc_html_page(201, 'Thanks for subscribing', '<p>You have been added to the Compass Consult newsletter list.</p><p><a class="btn" href="' . $back . '">Back to the website</a></p><p class="muted">Changed your mind? <a href="' . $unsubscribeUrl . '">Unsubscribe</a> at any time.</p>');
    }

    // DELETE
    if (!cc_rate_limit('unsubscribe')) {
        header('Retry-After: 3600');
        cc_json(429, ['code' => 'RATE_LIMITED', 'message' => 'Too many attempts. Please try again later.']);
    }

    $token = trim((string) ($_GET['id'] ?? $_GET['token'] ?? ''));
    if ($token === '') {
        cc_json(400, [
            'code' => 'VALIDATION_FAILED',
            'message' => 'An unsubscribe token is required. Use the unsubscribe link in any newsletter email, or contact us.',
        ]);
    }

    if (!cc_unsubscribe(cc_db(), $token)) {
        cc_json(404, ['code' => 'NOT_FOUND', 'message' => 'Subscriber not found']);
    }
    cc_json(200, ['message' => 'Unsubscribed']);
} catch (Throwable $e) {
    cc_log_exception('subscribers', $e);
    $fail(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again in a moment.');
}
