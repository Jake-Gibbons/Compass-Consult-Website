CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subscribed_at DATETIME NOT NULL,
  source_page VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_newsletter_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  interest VARCHAR(160) NULL,
  message TEXT NOT NULL,
  submitted_at DATETIME NOT NULL,
  source_page VARCHAR(255) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
