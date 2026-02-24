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
  `CREATE TABLE IF NOT EXISTS wash_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    duration_minutes INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    salary REAL NOT NULL DEFAULT 0,
    shift_label TEXT,
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    client_name TEXT NOT NULL,
    vehicle_plate TEXT,
    vehicle_model TEXT,
    phone TEXT,
    service_id INTEGER,
    team_member_id INTEGER,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando', 'em_lavagem', 'pronto', 'entregue')),
    price REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY(service_id) REFERENCES wash_services(id) ON DELETE SET NULL,
    FOREIGN KEY(team_member_id) REFERENCES team_members(id) ON DELETE SET NULL
  );`,
  'CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_wash_services_company_id ON wash_services(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_team_members_company_id ON team_members(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON appointments(company_id);',
  `CREATE TRIGGER IF NOT EXISTS trg_clients_updated_at
    AFTER UPDATE ON clients
    FOR EACH ROW
    BEGIN
      UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_services_updated_at
    AFTER UPDATE ON wash_services
    FOR EACH ROW
    BEGIN
      UPDATE wash_services SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_team_updated_at
    AFTER UPDATE ON team_members
    FOR EACH ROW
    BEGIN
      UPDATE team_members SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_appointments_updated_at
    AFTER UPDATE ON appointments
    FOR EACH ROW
    BEGIN
      UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;`,
];

const seedStatements = [
  `INSERT INTO wash_services (company_id, name, price, duration_minutes)
   SELECT c.id, 'Lavagem Simples', 40, 30
   FROM companies c
   WHERE NOT EXISTS (
     SELECT 1 FROM wash_services s WHERE s.company_id = c.id
   );`,
  `INSERT INTO wash_services (company_id, name, price, duration_minutes)
   SELECT c.id, 'Lavagem Completa', 80, 60
   FROM companies c
   WHERE NOT EXISTS (
     SELECT 1 FROM wash_services s WHERE s.company_id = c.id AND s.name = 'Lavagem Completa'
   );`,
  `INSERT INTO wash_services (company_id, name, price, duration_minutes)
   SELECT c.id, 'Polimento', 150, 120
   FROM companies c
   WHERE NOT EXISTS (
     SELECT 1 FROM wash_services s WHERE s.company_id = c.id AND s.name = 'Polimento'
   );`,
];

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      schemaStatements.forEach((statement) => db.run(statement));
      seedStatements.forEach((statement) => db.run(statement));
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
