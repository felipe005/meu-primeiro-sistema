const db = require('../utils/db');

function create({ companyId, name, role, salary = 0, shiftLabel, active = 1 }) {
  return db.run(
    `INSERT INTO team_members (company_id, name, role, salary, shift_label, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [companyId, name, role, Number(salary), shiftLabel || null, active ? 1 : 0]
  );
}

function listByCompany(companyId) {
  return db.all(
    `SELECT id, name, role, salary, shift_label AS shiftLabel, active,
            created_at AS createdAt, updated_at AS updatedAt
     FROM team_members
     WHERE company_id = ?
     ORDER BY created_at DESC`,
    [companyId]
  );
}

function updateById(companyId, memberId, { name, role, salary, shiftLabel, active }) {
  return db.run(
    `UPDATE team_members
     SET name = ?, role = ?, salary = ?, shift_label = ?, active = ?
     WHERE company_id = ? AND id = ?`,
    [name, role, Number(salary), shiftLabel || null, active ? 1 : 0, companyId, memberId]
  );
}

function deleteById(companyId, memberId) {
  return db.run('DELETE FROM team_members WHERE company_id = ? AND id = ?', [companyId, memberId]);
}

module.exports = {
  create,
  listByCompany,
  updateById,
  deleteById,
};
