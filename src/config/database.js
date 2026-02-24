const sqlite3 = require('sqlite3').verbose();
const { dbPath } = require('./env');

const db = new sqlite3.Database(dbPath);

const schemaStatements = [
  'PRAGMA foreign_keys = ON;',
  `CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL UNIQUE,
    plan_status TEXT NOT NULL DEFAULT 'active' CHECK(plan_status IN ('active', 'inactive')),
    monthly_fee REAL NOT NULL DEFAULT 99.90,
    next_billing_date TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'lead' CHECK(status IN ('lead', 'active', 'inactive')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );`,
  'CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);',
  `CREATE TRIGGER IF NOT EXISTS trg_clients_updated_at
    AFTER UPDATE ON clients
    FOR EACH ROW
    BEGIN
      UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;`,
];

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      schemaStatements.forEach((statement) => db.run(statement));
      db.get('SELECT 1', (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
}

module.exports = {
  db,
  initDatabase,
};
