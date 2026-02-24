const db = require('../utils/db');

function create({ companyId, name, email, phone, status, notes }) {
  return db.run(
    `INSERT INTO clients (company_id, name, email, phone, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [companyId, name, email || null, phone || null, status || 'lead', notes || null]
  );
}

function listByCompany(companyId, search = '') {
  const hasSearch = Boolean(search && search.trim());
  if (!hasSearch) {
    return db.all(
      `SELECT id, name, email, phone, status, notes, created_at AS createdAt, updated_at AS updatedAt
       FROM clients
       WHERE company_id = ?
       ORDER BY created_at DESC`,
      [companyId]
    );
  }

  const pattern = `%${search.trim()}%`;
  return db.all(
    `SELECT id, name, email, phone, status, notes, created_at AS createdAt, updated_at AS updatedAt
     FROM clients
     WHERE company_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
     ORDER BY created_at DESC`,
    [companyId, pattern, pattern, pattern]
  );
}

function findById(companyId, clientId) {
  return db.get(
    `SELECT id, name, email, phone, status, notes, created_at AS createdAt, updated_at AS updatedAt
     FROM clients
     WHERE company_id = ? AND id = ?`,
    [companyId, clientId]
  );
}

function updateById(companyId, clientId, { name, email, phone, status, notes }) {
  return db.run(
    `UPDATE clients
     SET name = ?, email = ?, phone = ?, status = ?, notes = ?
     WHERE company_id = ? AND id = ?`,
    [name, email || null, phone || null, status || 'lead', notes || null, companyId, clientId]
  );
}

function deleteById(companyId, clientId) {
  return db.run('DELETE FROM clients WHERE company_id = ? AND id = ?', [companyId, clientId]);
}

module.exports = {
  create,
  listByCompany,
  findById,
  updateById,
  deleteById,
};
