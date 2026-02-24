const db = require('../utils/db');

function create({ name, businessType }) {
  return db.run(
    'INSERT INTO companies (name, business_type) VALUES (?, ?)',
    [name, businessType]
  );
}

function findById(companyId) {
  return db.get(
    'SELECT id, name, business_type AS businessType, created_at AS createdAt FROM companies WHERE id = ?',
    [companyId]
  );
}

module.exports = {
  create,
  findById,
};
