const { pool } = require('../config/database');

async function createUser({ nome, email, senhaHash, tipoUsuario }) {
  const query = `
    INSERT INTO users (nome, email, senha_hash, tipo_usuario)
    VALUES ($1, $2, $3, $4)
    RETURNING id, nome, email, tipo_usuario, created_at
  `;
  const values = [nome, email.toLowerCase(), senhaHash, tipoUsuario];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, nome, email, tipo_usuario, created_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function listUsers() {
  const { rows } = await pool.query(
    'SELECT id, nome, email, tipo_usuario, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

module.exports = { createUser, findUserByEmail, findUserById, listUsers };
