const db = require('../utils/db');

function create({ companyId, name, email, passwordHash, role = 'member', active = 1 }) {
  return db.run(
    `INSERT INTO users (company_id, name, email, password_hash, role, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [companyId, name, email, passwordHash, role, active]
  );
}

function findByEmail(email) {
  return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

function findById(userId) {
  return db.get('SELECT * FROM users WHERE id = ?', [userId]);
}

function listByCompany(companyId) {
  return db.all(
    `SELECT id, name, email, role, active, created_at AS createdAt
     FROM users
     WHERE company_id = ?
     ORDER BY created_at DESC`,
    [companyId]
  );
}

function updateById(companyId, userId, { name, email, role, active, passwordHash }) {
  const fields = ['name = ?', 'email = ?', 'role = ?', 'active = ?'];
  const values = [name, email, role, active];

  if (passwordHash) {
    fields.push('password_hash = ?');
    values.push(passwordHash);
  }

  values.push(companyId, userId);

  return db.run(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE company_id = ? AND id = ?`,
    values
  );
}

function deleteById(companyId, userId) {
  return db.run('DELETE FROM users WHERE company_id = ? AND id = ?', [companyId, userId]);
}

module.exports = {
  create,
  findByEmail,
  findById,
  listByCompany,
  updateById,
  deleteById,
};
