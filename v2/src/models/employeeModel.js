const { pool } = require('../database/pool');

async function create(empresaId, data) {
  const query = `
    INSERT INTO funcionarios (empresa_id, nome, cargo, telefone, salario, ativo)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, empresa_id AS "empresaId", nome, cargo, telefone, salario, ativo
  `;
  const values = [empresaId, data.nome, data.cargo || null, data.telefone || null, data.salario, data.ativo];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function list(empresaId) {
  const query = `
    SELECT id, empresa_id AS "empresaId", nome, cargo, telefone, salario, ativo
    FROM funcionarios
    WHERE empresa_id = $1
    ORDER BY criado_em DESC
  `;
  const { rows } = await pool.query(query, [empresaId]);
  return rows;
}

async function findById(empresaId, id) {
  const query = `
    SELECT id, empresa_id AS "empresaId", nome, cargo, telefone, salario, ativo
    FROM funcionarios
    WHERE empresa_id = $1 AND id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [empresaId, id]);
  return rows[0] || null;
}

async function update(empresaId, id, data) {
  const query = `
    UPDATE funcionarios
    SET nome = $3,
        cargo = $4,
        telefone = $5,
        salario = $6,
        ativo = $7,
        atualizado_em = NOW()
    WHERE empresa_id = $1 AND id = $2
    RETURNING id, empresa_id AS "empresaId", nome, cargo, telefone, salario, ativo
  `;
  const values = [empresaId, id, data.nome, data.cargo || null, data.telefone || null, data.salario, data.ativo];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function remove(empresaId, id) {
  const query = 'DELETE FROM funcionarios WHERE empresa_id = $1 AND id = $2';
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
