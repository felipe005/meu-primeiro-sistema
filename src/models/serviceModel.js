const db = require('../utils/db');

function create({ companyId, name, price, durationMinutes, active = 1 }) {
  return db.run(
    `INSERT INTO wash_services (company_id, name, price, duration_minutes, active)
     VALUES (?, ?, ?, ?, ?)`,
    [companyId, name, Number(price), Number(durationMinutes), active ? 1 : 0]
  );
}

function listByCompany(companyId) {
  return db.all(
    `SELECT id, name, price, duration_minutes AS durationMinutes, active,
            created_at AS createdAt, updated_at AS updatedAt
     FROM wash_services
     WHERE company_id = ?
     ORDER BY created_at DESC`,
    [companyId]
  );
}

function findById(companyId, serviceId) {
  return db.get(
    `SELECT id, name, price, duration_minutes AS durationMinutes, active
     FROM wash_services
     WHERE company_id = ? AND id = ?`,
    [companyId, serviceId]
  );
}

function updateById(companyId, serviceId, { name, price, durationMinutes, active }) {
  return db.run(
    `UPDATE wash_services
     SET name = ?, price = ?, duration_minutes = ?, active = ?
     WHERE company_id = ? AND id = ?`,
    [name, Number(price), Number(durationMinutes), active ? 1 : 0, companyId, serviceId]
  );
}

function deleteById(companyId, serviceId) {
  return db.run('DELETE FROM wash_services WHERE company_id = ? AND id = ?', [companyId, serviceId]);
}

module.exports = {
  create,
  listByCompany,
  findById,
  updateById,
  deleteById,
};
