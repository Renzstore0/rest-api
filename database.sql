-- Run this SQL inside your database (or let `npm run build` apply it via config/migrate.js).
-- Paste directly into your hosting panel's SQL console if running manually.

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('free','premium','vip','admin') NOT NULL DEFAULT 'free',
  google_id   VARCHAR(255)  NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS otp_sessions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  otp         VARCHAR(6)   NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blacklist_ips (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ip_address  VARCHAR(45)  NOT NULL UNIQUE,
  reason      VARCHAR(255) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS analytics_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  endpoint    VARCHAR(255) NOT NULL,
  user_id     INT          NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created  (created_at),
  INDEX idx_endpoint (endpoint),
  INDEX idx_user     (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  session_id  VARCHAR(128) NOT NULL PRIMARY KEY,
  expires     INT(11) UNSIGNED NOT NULL,
  data        MEDIUMTEXT,
  INDEX idx_expires (expires)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_keys (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL UNIQUE,
  key_name    VARCHAR(60)  NOT NULL DEFAULT 'My API Key',
  api_key     VARCHAR(68)  NOT NULL UNIQUE,
  total_limit INT          NOT NULL DEFAULT 100,
  used_count  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user   (user_id),
  INDEX idx_apikey (api_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  api_key_id  INT          NOT NULL,
  ip_address  VARCHAR(45)  NOT NULL,
  endpoint    VARCHAR(255) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_key     (api_key_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ── Promote a user to admin ──────────────────────────────────────────────
-- Run this in your SQL console. Already done? Skip it.
UPDATE users SET role = 'admin' WHERE email = 'rasyidhamdi0@gmail.com';

-- ── Expand role ENUM (safe to re-run) ────────────────────────────────────
ALTER TABLE users
  MODIFY COLUMN role ENUM('free','premium','vip','admin') NOT NULL DEFAULT 'free';

-- Migrate any remaining legacy 'user' rows → 'free'
UPDATE users SET role = 'free' WHERE role NOT IN ('free','premium','vip','admin');

-- ── Add key_name column to api_keys (safe to run multiple times) ─────────
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS key_name VARCHAR(60) NOT NULL DEFAULT 'My API Key'
  AFTER user_id;


-- ── Add role_expires_at column (safe to re-run) ──────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role_expires_at DATETIME NULL DEFAULT NULL AFTER role;

-- ── Add role_granted_at column (safe to re-run) ───────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role_granted_at DATETIME NULL DEFAULT NULL AFTER role_expires_at;

-- ── Page view counter (safe to re-run) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id    INT    NOT NULL DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

INSERT IGNORE INTO page_views (id, count) VALUES (1, 0);

-- ── Add status column to analytics_logs (safe to re-run) ─────────────────
ALTER TABLE analytics_logs
  ADD COLUMN IF NOT EXISTS status ENUM('success','error') NOT NULL DEFAULT 'success'
  AFTER endpoint;

-- Backfill: existing rows were only logged on success, so all = 'success' (default)
-- No UPDATE needed - DEFAULT 'success' handles it.

