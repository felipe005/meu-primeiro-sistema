const { pool } = require('../config/database');

async function createProductionRecord({ pedidoId, etapa, quantidade, funcionarioId }) {
  const query = `
    INSERT INTO production_records (pedido_id, etapa, quantidade, funcionario_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, pedido_id, etapa, quantidade, funcionario_id, data
  `;

  const { rows } = await pool.query(query, [pedidoId, etapa, quantidade, funcionarioId]);
  return rows[0];
}

async function listProductionRecords(orderId) {
  const values = [];
  let where = '';

  if (orderId) {
    values.push(orderId);
    where = `WHERE pr.pedido_id = $${values.length}`;
  }

  const query = `
    SELECT pr.id, pr.pedido_id, pr.etapa, pr.quantidade, pr.funcionario_id, pr.data,
           u.nome AS funcionario_nome
    FROM production_records pr
    INNER JOIN users u ON u.id = pr.funcionario_id
    ${where}
    ORDER BY pr.data DESC
    LIMIT 300
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

module.exports = { createProductionRecord, listProductionRecords };
