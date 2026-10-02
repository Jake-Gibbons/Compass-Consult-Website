<?php
/**
 * Copy this file to api/config.php on the Fasthosts server and fill in the
 * MySQL details from the Fasthosts control panel. Do not commit config.php.
 */
return [
    'db_host' => 'localhost',
    'db_name' => 'compass_consult',
    'db_user' => 'compass_user',
    'db_pass' => 'change-me',
    'db_charset' => 'utf8mb4',
    // Required to list or edit subscribers. Generate a long random string.
    'admin_token' => 'change-me-to-a-long-random-string',
    // Optional. Contact form messages are always stored; this also emails them.
    'notify_email' => 'enquiries@compassconsultes.co.uk',
];
