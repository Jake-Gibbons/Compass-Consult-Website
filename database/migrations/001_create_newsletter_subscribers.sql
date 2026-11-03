-- Compass Consult — newsletter subscribers
-- Safe to run more than once (uses IF NOT EXISTS).
-- Run in phpMyAdmin (Fasthosts control panel) against the site database,
-- or with: mysql -h HOST -u USER -p DBNAME < database/migrations/001_create_newsletter_subscribers.sql
--
-- All timestamps are stored in UTC.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email              VARCHAR(254) NOT NULL,
  status             ENUM('subscribed', 'unsubscribed') NOT NULL DEFAULT 'subscribed',
  unsubscribe_token  VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  source             VARCHAR(255) NULL COMMENT 'Page or channel the sign-up came from',
  consent_given      TINYINT(1) NOT NULL DEFAULT 1,
  consent_text       VARCHAR(500) NULL COMMENT 'Wording the subscriber agreed to',
  consent_at         DATETIME NULL,
  ip_hash            CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL COMMENT 'Salted SHA-256 of the sign-up IP (not the raw IP)',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  unsubscribed_at    DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_subscribers_email (email),
  UNIQUE KEY uq_newsletter_subscribers_token (unsubscribe_token),
  KEY idx_newsletter_subscribers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
