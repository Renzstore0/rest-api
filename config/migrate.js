'use strict';

const pool = require('./db');
const publicApiKeyRepo = require('../repositories/publicApiKeyRepo');

const TABLES = [
  {
    name: 'users',
    sql: `
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
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'otp_sessions',
    sql: `
      CREATE TABLE IF NOT EXISTS otp_sessions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        email       VARCHAR(255) NOT NULL,
        otp         VARCHAR(6)   NOT NULL,
        expires_at  DATETIME     NOT NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'blacklist_ips',
    sql: `
      CREATE TABLE IF NOT EXISTS blacklist_ips (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        ip_address  VARCHAR(45)  NOT NULL UNIQUE,
        reason      VARCHAR(255) NOT NULL DEFAULT '',
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip (ip_address)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'analytics_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS analytics_logs (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        endpoint    VARCHAR(255)                    NOT NULL,
        status      ENUM('success','error')         NOT NULL DEFAULT 'success',
        user_id     INT                             NULL,
        created_at  DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created  (created_at),
        INDEX idx_endpoint (endpoint),
        INDEX idx_status   (status),
        INDEX idx_user     (user_id)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'sessions',
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        session_id  VARCHAR(128) NOT NULL PRIMARY KEY,
        expires     INT(11) UNSIGNED NOT NULL,
        data        MEDIUMTEXT,
        INDEX idx_expires (expires)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'api_keys',
    sql: `
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
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'api_usage_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        api_key_id  INT          NOT NULL,
        ip_address  VARCHAR(45)  NOT NULL,
        endpoint    VARCHAR(255) NOT NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_key     (api_key_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'page_views',
    sql: `
      CREATE TABLE IF NOT EXISTS page_views (
        id    INT    NOT NULL DEFAULT 1,
        count BIGINT NOT NULL DEFAULT 0,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'page_views_daily',
    sql: `
      CREATE TABLE IF NOT EXISTS page_views_daily (
        date  DATE   NOT NULL,
        count BIGINT NOT NULL DEFAULT 0,
        PRIMARY KEY (date)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'payment_orders',
    sql: `
      CREATE TABLE IF NOT EXISTS payment_orders (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        order_code    VARCHAR(32)  NOT NULL UNIQUE,
        user_id       INT          NOT NULL,
        role          ENUM('premium','vip') NOT NULL,
        days          INT          NOT NULL,
        base_amount   INT          NOT NULL,
        unique_code   INT          NOT NULL,
        total_amount  INT          NOT NULL,
        qris_payload  TEXT         NOT NULL,
        qr_image      MEDIUMTEXT   NULL,
        status        ENUM('pending','paid','expired','cancelled','failed') NOT NULL DEFAULT 'pending',
        paid_at       DATETIME     NULL,
        expires_at    DATETIME     NOT NULL,
        created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user   (user_id),
        INDEX idx_status (status),
        INDEX idx_code   (order_code)
      ) ENGINE=InnoDB
    `
  },
  {
    name: 'public_api_keys',
    sql: `
      CREATE TABLE IF NOT EXISTS public_api_keys (
        id          INT          NOT NULL DEFAULT 1,
        api_key     VARCHAR(68)  NOT NULL UNIQUE,
        enabled     TINYINT(1)   NOT NULL DEFAULT 1,
        updated_by  INT          NULL,
        updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `
  }
];

const ALTER_MIGRATIONS = [
  {
    desc: 'api_keys: add key_name column',
    sql:  `ALTER TABLE api_keys ADD COLUMN key_name VARCHAR(60) NOT NULL DEFAULT 'My API Key' AFTER user_id`
  },
  {
    desc: 'users: migrate legacy role value user → free',
    sql:  `UPDATE users SET role = 'free' WHERE role = 'user'`
  },
  {
    desc: 'users: expand role ENUM to free/premium/vip/admin',
    sql:  `ALTER TABLE users MODIFY COLUMN role ENUM('free','premium','vip','admin') NOT NULL DEFAULT 'free'`
  },
  {
    desc: 'users: add role_expires_at column',
    sql:  'ALTER TABLE users ADD COLUMN role_expires_at DATETIME NULL DEFAULT NULL AFTER role'
  },
  {
    desc: 'users: add role_granted_at column',
    sql:  'ALTER TABLE users ADD COLUMN role_granted_at DATETIME NULL DEFAULT NULL AFTER role_expires_at'
  },
  {
    desc: 'page_views: seed initial counter row',
    sql:  'INSERT IGNORE INTO page_views (id, count) VALUES (1, 0)'
  },
  {
    desc: 'page_views_daily: seed today row',
    sql:  'INSERT IGNORE INTO page_views_daily (date, count) VALUES (CURDATE(), 0)'
  },
  {
    desc: 'analytics_logs: add status column',
    sql:  `ALTER TABLE analytics_logs ADD COLUMN status ENUM('success','error') NOT NULL DEFAULT 'success' AFTER endpoint`
  },
  {
    desc: 'analytics_logs: add status index',
    sql:  'ALTER TABLE analytics_logs ADD INDEX idx_status (status)'
  },
  {
    desc: 'otp_sessions: add attempts column',
    sql:  'ALTER TABLE otp_sessions ADD COLUMN attempts INT NOT NULL DEFAULT 0'
  },
  {
    desc: 'payment_orders: add qr_image column',
    sql:  'ALTER TABLE payment_orders ADD COLUMN qr_image MEDIUMTEXT NULL AFTER qris_payload'
  },
  {
    desc: 'payment_orders: expand status ENUM to include cancelled',
    sql:  `ALTER TABLE payment_orders MODIFY COLUMN status ENUM('pending','paid','expired','cancelled','failed') NOT NULL DEFAULT 'pending'`
  }
];

async function migrate() {
  console.log('[Lumpo] Running migrations...');

  for (const table of TABLES) {
    await pool.execute(table.sql);
    console.log(`  ✓  ${table.name}`);
  }

  for (const m of ALTER_MIGRATIONS) {
    try {
      await pool.execute(m.sql);
      console.log(`  ✓  ${m.desc}`);
    } catch (err) {
      if (err.errno === 1060 || err.message?.includes('Duplicate column')) {
        console.log(`  –  ${m.desc} (already applied)`);
      } else {
        console.warn(`  !  ${m.desc}: ${err.message}`);
      }
    }
  }

  const seeded = await publicApiKeyRepo.ensureSeeded();
  console.log(`  ✓  public_api_keys seeded (${seeded.api_key.slice(0, 8)}…)`);

  console.log('[Lumpo] Migrations complete.\n');
}

module.exports = migrate;
