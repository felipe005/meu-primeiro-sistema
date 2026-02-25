const { pool } = require('../database/pool');

async function create(empresaId, data) {
  const query = `
    INSERT INTO servicos (empresa_id, nome, descricao, preco, duracao_minutos, ativo)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, empresa_id AS "empresaId", nome, descricao, preco, duracao_minutos AS "duracaoMinutos", ativo
  `;
  const values = [empresaId, data.nome, data.descricao || null, data.preco, data.duracaoMinutos, data.ativo];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function list(empresaId) {
  const query = `
    SELECT id, empresa_id AS "empresaId", nome, descricao, preco, duracao_minutos AS "duracaoMinutos", ativo
    FROM servicos
    WHERE empresa_id = $1
    ORDER BY criado_em DESC
  `;
  const { rows } = await pool.query(query, [empresaId]);
  return rows;
}

async function findById(empresaId, id) {
  const query = `
    SELECT id, empresa_id AS "empresaId", nome, descricao, preco, duracao_minutos AS "duracaoMinutos", ativo
    FROM servicos
    WHERE empresa_id = $1 AND id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [empresaId, id]);
  return rows[0] || null;
}

async function update(empresaId, id, data) {
  const query = `
    UPDATE servicos
    SET nome = $3,
        descricao = $4,
        preco = $5,
        duracao_minutos = $6,
        ativo = $7,
        atualizado_em = NOW()
    WHERE empresa_id = $1 AND id = $2
    RETURNING id, empresa_id AS "empresaId", nome, descricao, preco, duracao_minutos AS "duracaoMinutos", ativo
  `;
  const values = [empresaId, id, data.nome, data.descricao || null, data.preco, data.duracaoMinutos, data.ativo];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function remove(empresaId, id) {
  const query = 'DELETE FROM servicos WHERE empresa_id = $1 AND id = $2';
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
