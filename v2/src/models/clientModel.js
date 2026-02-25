const { pool } = require('../database/pool');

async function create(empresaId, data) {
  const query = `
    INSERT INTO clientes (empresa_id, nome, telefone, email, observacoes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, empresa_id AS "empresaId", nome, telefone, email, observacoes, criado_em AS "criadoEm"
  `;
  const values = [empresaId, data.nome, data.telefone || null, data.email || null, data.observacoes || null];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function list(empresaId, search = '') {
  const query = `
    SELECT id, empresa_id AS "empresaId", nome, telefone, email, observacoes, criado_em AS "criadoEm"
    FROM clientes
    WHERE empresa_id = $1
      AND ($2 = '' OR nome ILIKE $3 OR telefone ILIKE $3 OR email ILIKE $3)
    ORDER BY criado_em DESC
  `;
  const pattern = `%${search}%`;
  const { rows } = await pool.query(query, [empresaId, search, pattern]);
  return rows;
}

async function findById(empresaId, id) {
  const query = `
    SELECT id, empresa_id AS "empresaId", nome, telefone, email, observacoes
    FROM clientes
    WHERE empresa_id = $1 AND id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [empresaId, id]);
  return rows[0] || null;
}

async function update(empresaId, id, data) {
  const query = `
    UPDATE clientes
    SET nome = $3,
        telefone = $4,
        email = $5,
        observacoes = $6,
        atualizado_em = NOW()
    WHERE empresa_id = $1 AND id = $2
    RETURNING id, empresa_id AS "empresaId", nome, telefone, email, observacoes, atualizado_em AS "atualizadoEm"
  `;
  const values = [empresaId, id, data.nome, data.telefone || null, data.email || null, data.observacoes || null];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function remove(empresaId, id) {
  const query = 'DELETE FROM clientes WHERE empresa_id = $1 AND id = $2';
  const result = await pool.query(query, [empresaId, id]);
  return result.rowCount;
}

module.exports = {
  create,
  list,
  findById,
  update,
  remove,
};
