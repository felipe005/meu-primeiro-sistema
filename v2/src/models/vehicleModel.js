const { pool } = require('../database/pool');

async function create(empresaId, data) {
  const query = `
    INSERT INTO veiculos (empresa_id, cliente_id, placa, marca, modelo, cor, ano)
    VALUES ($1, $2, UPPER($3), $4, $5, $6, $7)
    RETURNING id, empresa_id AS "empresaId", cliente_id AS "clienteId", placa, marca, modelo, cor, ano
  `;
  const values = [empresaId, data.clienteId, data.placa, data.marca || null, data.modelo, data.cor || null, data.ano || null];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function list(empresaId, search = '') {
  const query = `
    SELECT v.id, v.empresa_id AS "empresaId", v.cliente_id AS "clienteId", v.placa, v.marca, v.modelo, v.cor, v.ano,
           c.nome AS "clienteNome"
    FROM veiculos v
    JOIN clientes c ON c.id = v.cliente_id AND c.empresa_id = v.empresa_id
    WHERE v.empresa_id = $1
      AND ($2 = '' OR v.placa ILIKE $3 OR v.modelo ILIKE $3 OR c.nome ILIKE $3)
    ORDER BY v.criado_em DESC
  `;
  const pattern = `%${search}%`;
  const { rows } = await pool.query(query, [empresaId, search, pattern]);
  return rows;
}

async function findById(empresaId, id) {
  const query = `
    SELECT id, empresa_id AS "empresaId", cliente_id AS "clienteId", placa, marca, modelo, cor, ano
    FROM veiculos
    WHERE empresa_id = $1 AND id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [empresaId, id]);
  return rows[0] || null;
}

async function update(empresaId, id, data) {
  const query = `
    UPDATE veiculos
    SET cliente_id = $3,
        placa = UPPER($4),
        marca = $5,
        modelo = $6,
        cor = $7,
        ano = $8,
        atualizado_em = NOW()
    WHERE empresa_id = $1 AND id = $2
    RETURNING id, empresa_id AS "empresaId", cliente_id AS "clienteId", placa, marca, modelo, cor, ano
  `;
  const values = [empresaId, id, data.clienteId, data.placa, data.marca || null, data.modelo, data.cor || null, data.ano || null];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function remove(empresaId, id) {
  const query = 'DELETE FROM veiculos WHERE empresa_id = $1 AND id = $2';
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
