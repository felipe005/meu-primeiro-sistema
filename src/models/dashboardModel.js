const { pool } = require('../config/database');

async function getDashboardStats() {
  const inProductionQuery = `
    SELECT COUNT(*)::int AS pedidos_em_producao
    FROM orders o
    LEFT JOIN (
      SELECT pedido_id, SUM(quantidade)::int AS estoque_total
      FROM production_records
      WHERE etapa = 'Estoque'
      GROUP BY pedido_id
    ) p ON p.pedido_id = o.id
    WHERE COALESCE(p.estoque_total, 0) < o.quantidade_total
  `;

  const productionTodayQuery = `
    SELECT COALESCE(SUM(quantidade), 0)::int AS producao_dia
    FROM production_records
    WHERE data::date = CURRENT_DATE
  `;

  const totalProducedQuery = `
    SELECT COALESCE(SUM(quantidade), 0)::int AS total_produzido
    FROM production_records
  `;

  const [inProd, today, total] = await Promise.all([
    pool.query(inProductionQuery),
    pool.query(productionTodayQuery),
    pool.query(totalProducedQuery)
  ]);

  return {
    pedidos_em_producao: inProd.rows[0].pedidos_em_producao,
    producao_dia: today.rows[0].producao_dia,
    total_produzido: total.rows[0].total_produzido
  };
}

module.exports = { getDashboardStats };
