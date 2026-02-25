const { pool } = require('../database/pool');

async function getMetrics(empresaId) {
  const query = `
    SELECT
      COALESCE((
        SELECT SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END)
        FROM caixa
        WHERE empresa_id = $1 AND data_movimento = CURRENT_DATE
      ), 0) AS "totalDia",
      (
        SELECT COUNT(*)
        FROM agendamentos
        WHERE empresa_id = $1 AND data = CURRENT_DATE
      ) AS "servicosDia",
      COALESCE((
        SELECT SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END)
        FROM caixa
        WHERE empresa_id = $1 AND date_trunc('month', data_movimento) = date_trunc('month', CURRENT_DATE)
      ), 0) AS "totalMes"
  `;
  const { rows } = await pool.query(query, [empresaId]);
  return rows[0];
}

async function getDailyChart(empresaId) {
  const query = `
    WITH days AS (
      SELECT generate_series(CURRENT_DATE - INTERVAL '13 day', CURRENT_DATE, INTERVAL '1 day')::date AS dia
    )
    SELECT
      to_char(d.dia, 'DD/MM') AS dia,
      COALESCE(SUM(CASE WHEN c.tipo = 'entrada' THEN c.valor END), 0) AS entradas,
      COALESCE(SUM(CASE WHEN c.tipo = 'saida' THEN c.valor END), 0) AS saidas
    FROM days d
    LEFT JOIN caixa c ON c.empresa_id = $1 AND c.data_movimento = d.dia
    GROUP BY d.dia
    ORDER BY d.dia
  `;
  const { rows } = await pool.query(query, [empresaId]);
  return rows;
}

module.exports = {
  getMetrics,
  getDailyChart,
};
