<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    newsletter_json(405, ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Method not allowed']);
}

$body = newsletter_request_body();
if (newsletter_honeypot_tripped($body)) {
    newsletter_json(200, ['message' => 'Sent']);
}

$name = trim((string) ($body['name'] ?? ''));
$email = newsletter_email((string) ($body['email'] ?? ''));
$interest = substr(trim((string) ($body['interest'] ?? '')), 0, 160);
$message = trim((string) ($body['message'] ?? ''));

if ($name === '' || strlen($name) > 160 || $message === '' || strlen($message) > 5000) {
    newsletter_json(400, ['code' => 'VALIDATION_FAILED', 'message' => 'Name and message are required.']);
}

$pdo = newsletter_db();
$enquiry = [
    'id' => newsletter_uuid(),
    'name' => $name,
    'email' => $email,
    'interest' => $interest !== '' ? $interest : null,
    'message' => $message,
    'submitted_at' => gmdate('Y-m-d H:i:s'),
    'source_page' => substr(trim((string) ($_SERVER['HTTP_REFERER'] ?? '')), 0, 255) ?: null,
];
$insert = $pdo->prepare(
    'INSERT INTO contact_enquiries (id, name, email, interest, message, submitted_at, source_page)
     VALUES (:id, :name, :email, :interest, :message, :submitted_at, :source_page)'
);
$insert->execute($enquiry);

$config = newsletter_config();
$notify = trim((string) ($config['notify_email'] ?? ''));
if ($notify !== '' && filter_var($notify, FILTER_VALIDATE_EMAIL)) {
    $subject = 'Compass Consult website enquiry';
    $text = "Name: {$name}\nEmail: {$email}\nInterest: {$interest}\n\n{$message}\n";
    @mail($notify, $subject, $text, 'From: noreply@compassconsultes.co.uk');
}

newsletter_json(201, ['message' => 'Sent', 'id' => $enquiry['id']]);
