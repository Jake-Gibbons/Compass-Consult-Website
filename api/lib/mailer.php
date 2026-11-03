<?php
/**
 * Minimal plain-text mailer: authenticated SMTP (recommended) or PHP mail().
 * No third-party dependencies so it can be uploaded as-is to shared hosting.
 */
declare(strict_types=1);

/**
 * Sends a plain-text email. Returns true on success.
 */
function cc_send_mail(string $to, string $subject, string $body, string $replyTo = ''): bool
{
    $mail = cc_config()['mail'];
    $fromEmail = cc_header_safe((string) ($mail['from_email'] ?? ''));
    $fromName = cc_header_safe((string) ($mail['from_name'] ?? ''));
    $to = cc_header_safe($to);
    $replyTo = cc_header_safe($replyTo);

    if (!filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
        error_log('compass mailer: invalid to/from address in configuration');
        return false;
    }

    $encodedSubject = '=?UTF-8?B?' . base64_encode(cc_header_safe($subject)) . '?=';
    $fromHeader = $fromName !== ''
        ? '=?UTF-8?B?' . base64_encode($fromName) . '?= <' . $fromEmail . '>'
        : $fromEmail;

    $headers = [
        'From: ' . $fromHeader,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        'X-Mailer: CompassConsultWebsite',
    ];
    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    $encodedBody = rtrim(chunk_split(base64_encode(str_replace(["\r\n", "\r"], "\n", $body)), 76, "\r\n"));

    if (($mail['transport'] ?? 'mail') === 'smtp' && (string) ($mail['smtp']['host'] ?? '') !== '') {
        return cc_smtp_send($mail['smtp'], $fromEmail, $to, $encodedSubject, $headers, $encodedBody);
    }

    $ok = @mail($to, $encodedSubject, $encodedBody, implode("\r\n", $headers), '-f' . $fromEmail);
    if (!$ok) {
        error_log('compass mailer: PHP mail() failed');
    }
    return $ok;
}

function cc_header_safe(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $value));
}

/**
 * @param array<string, mixed> $smtp
 * @param list<string> $headers
 */
function cc_smtp_send(array $smtp, string $from, string $to, string $encodedSubject, array $headers, string $encodedBody): bool
{
    $host = (string) $smtp['host'];
    $port = (int) ($smtp['port'] ?? 587);
    $encryption = strtolower((string) ($smtp['encryption'] ?? 'tls'));
    $timeout = (int) ($smtp['timeout'] ?? 15);

    $remote = ($encryption === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $context = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
    $socket = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if ($socket === false) {
        error_log("compass mailer: SMTP connect failed ({$errno}) {$errstr}");
        return false;
    }
    stream_set_timeout($socket, $timeout);

    $serverName = preg_replace('/[^a-z0-9.-]/i', '', (string) parse_url((string) cc_config()['site_url'], PHP_URL_HOST)) ?: 'localhost';

    try {
        cc_smtp_expect($socket, '', [220]);
        cc_smtp_expect($socket, 'EHLO ' . $serverName, [250]);

        if ($encryption === 'tls') {
            cc_smtp_expect($socket, 'STARTTLS', [220]);
            $cryptoOk = stream_socket_enable_crypto(
                $socket,
                true,
                STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT') ? STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT : 0)
            );
            if ($cryptoOk !== true) {
                throw new RuntimeException('STARTTLS negotiation failed');
            }
            cc_smtp_expect($socket, 'EHLO ' . $serverName, [250]);
        }

        $user = (string) ($smtp['username'] ?? '');
        if ($user !== '') {
            cc_smtp_expect($socket, 'AUTH LOGIN', [334]);
            cc_smtp_expect($socket, base64_encode($user), [334]);
            cc_smtp_expect($socket, base64_encode((string) ($smtp['password'] ?? '')), [235]);
        }

        cc_smtp_expect($socket, 'MAIL FROM:<' . $from . '>', [250]);
        cc_smtp_expect($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
        cc_smtp_expect($socket, 'DATA', [354]);

        $message = implode("\r\n", array_merge([
            'Date: ' . date(DATE_RFC2822),
            'To: ' . $to,
            'Subject: ' . $encodedSubject,
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $serverName . '>',
        ], $headers)) . "\r\n\r\n" . $encodedBody;

        // Dot-stuffing (base64 body cannot start a line with '.', headers might).
        $message = preg_replace('/^\./m', '..', $message);
        cc_smtp_expect($socket, $message . "\r\n.", [250]);
        cc_smtp_expect($socket, 'QUIT', [221]);
        return true;
    } catch (Throwable $e) {
        error_log('compass mailer: SMTP error: ' . $e->getMessage());
        return false;
    } finally {
        fclose($socket);
    }
}

/**
 * Writes a command (if any) and checks the reply code.
 *
 * @param resource $socket
 * @param list<int> $expected
 */
function cc_smtp_expect($socket, string $command, array $expected): string
{
    if ($command !== '') {
        fwrite($socket, $command . "\r\n");
    }
    $response = '';
    while (($line = fgets($socket, 1024)) !== false) {
        $response .= $line;
        // Multi-line replies use "250-"; the final line uses "250 ".
        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }
    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $expected, true)) {
        $safeCommand = str_starts_with($command, 'AUTH') || preg_match('/^[A-Za-z0-9+\/=]+$/', $command) ? '[auth]' : strtok($command, "\r\n");
        throw new RuntimeException(sprintf('Unexpected SMTP reply to %s: %s', $safeCommand === '' ? '[greeting]' : $safeCommand, trim($response)));
    }
    return $response;
}
