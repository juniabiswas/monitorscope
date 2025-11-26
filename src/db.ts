import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcryptjs';

// Open a database connection (creates db if not exists)
export async function openDb() {
  return open({
    filename: './data/healthcheck.db',
    driver: sqlite3.Database
  });
}

// Initialize DB schema for APIs, health checks, and alerts
export async function initDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS apis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      category TEXT,
      environment TEXT,
      expected_response_time INTEGER,
      alert_threshold INTEGER,
      alert_interval INTEGER DEFAULT 15,
      active INTEGER DEFAULT 1,
      headers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS health_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      response_time INTEGER,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(api_id) REFERENCES apis(id)
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'resolved')) DEFAULT 'active',
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      last_alert_sent DATETIME,
      alert_count INTEGER DEFAULT 1,
      FOREIGN KEY(api_id) REFERENCES apis(id)
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      organization TEXT,
      role TEXT CHECK(role IN ('SuperAdmin', 'Admin', 'Manager', 'Viewer')) NOT NULL,
      phone TEXT,
      status TEXT CHECK(status IN ('Active', 'Inactive')) NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS alert_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(api_id) REFERENCES apis(id)
    );
  `);
  await db.close();
}

// Generate a secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

// Insert sample users for each role
export async function insertSampleUsers() {
  const db = await openDb();

  // Generate secure random passwords
  const passwords = {
    superadmin: generateSecurePassword(20),
    admin: generateSecurePassword(20),
    manager: generateSecurePassword(20),
    viewer: generateSecurePassword(20),
  };

  // Hash all passwords before storing
  const hashedPasswords = {
    superadmin: await bcrypt.hash(passwords.superadmin, 10),
    admin: await bcrypt.hash(passwords.admin, 10),
    manager: await bcrypt.hash(passwords.manager, 10),
    viewer: await bcrypt.hash(passwords.viewer, 10),
  };

  const users = [
    {
      username: 'superadmin',
      password: hashedPasswords.superadmin,
      full_name: 'Super Admin',
      email: 'superadmin@example.com',
      organization: 'MonitorScope',
      role: 'SuperAdmin',
      phone: '1111111111',
      status: 'Active',
    },
    {
      username: 'admin',
      password: hashedPasswords.admin,
      full_name: 'Admin User',
      email: 'admin@example.com',
      organization: 'MonitorScope',
      role: 'Admin',
      phone: '2222222222',
      status: 'Active',
    },
    {
      username: 'manager',
      password: hashedPasswords.manager,
      full_name: 'Manager User',
      email: 'manager@example.com',
      organization: 'MonitorScope',
      role: 'Manager',
      phone: '3333333333',
      status: 'Active',
    },
    {
      username: 'viewer',
      password: hashedPasswords.viewer,
      full_name: 'Viewer User',
      email: 'viewer@example.com',
      organization: 'MonitorScope',
      role: 'Viewer',
      phone: '4444444444',
      status: 'Active',
    },
  ];

  let newUsersCreated = false;
  for (const user of users) {
    try {
      const result = await db.run(
        `INSERT OR IGNORE INTO users (username, password, full_name, email, organization, role, phone, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.username, user.password, user.full_name, user.email, user.organization, user.role, user.phone, user.status]
      );
      if (result.changes && result.changes > 0) {
        newUsersCreated = true;
      }
    } catch (e) {
      // Ignore duplicate errors
    }
  }

  await db.close();

  // Log passwords only if new users were created
  if (newUsersCreated) {
    console.log('\n========================================');
    console.log('NEW USER ACCOUNTS CREATED');
    console.log('========================================');
    console.log('IMPORTANT: Save these passwords securely!');
    console.log('They will NOT be shown again.\n');
    console.log(`SuperAdmin - Username: superadmin, Password: ${passwords.superadmin}`);
    console.log(`Admin      - Username: admin, Password: ${passwords.admin}`);
    console.log(`Manager    - Username: manager, Password: ${passwords.manager}`);
    console.log(`Viewer     - Username: viewer, Password: ${passwords.viewer}`);
    console.log('========================================\n');
  }
}

// Migrate existing database to add new fields
export async function migrateDb() {
  const db = await openDb();

  try {
    // Add alert_interval column to apis table if it doesn't exist
    await db.exec(`ALTER TABLE apis ADD COLUMN alert_interval INTEGER DEFAULT 15;`);
  } catch (e) {
    // Column might already exist, ignore error
  }

  try {
    // Update alerts table structure
    await db.exec(`
      CREATE TABLE IF NOT EXISTS alerts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        status TEXT CHECK(status IN ('active', 'resolved')) DEFAULT 'active',
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        last_alert_sent DATETIME,
        alert_count INTEGER DEFAULT 1,
        FOREIGN KEY(api_id) REFERENCES apis(id)
      );
    `);

    // Migrate existing data
    await db.exec(`
      INSERT INTO alerts_new (id, api_id, message, status, triggered_at, resolved_at, alert_count)
      SELECT id, api_id, message,
             CASE WHEN resolved = 1 THEN 'resolved' ELSE 'active' END,
             triggered_at,
             CASE WHEN resolved = 1 THEN triggered_at ELSE NULL END,
             1
      FROM alerts;
    `);

    // Replace old table with new one
    await db.exec(`DROP TABLE alerts;`);
    await db.exec(`ALTER TABLE alerts_new RENAME TO alerts;`);
  } catch (e) {
    // Migration might have already been done, ignore error
  }

  await db.close();
}
