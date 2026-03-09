const { pool } = require('../config/database');
const { PRODUCTION_STEPS, FINAL_STEP } = require('../constants/production');

async function getDashboardStats() {
  const basicCardsQuery = `
    WITH loja_totals AS (
      SELECT pedido_id, COALESCE(SUM(quantidade), 0)::int AS total_loja
      FROM production_records
      WHERE etapa = $1
      GROUP BY pedido_id
    )
    SELECT
      (
        SELECT COUNT(*)::int
        FROM orders o
        LEFT JOIN loja_totals lt ON lt.pedido_id = o.id
        WHERE COALESCE(lt.total_loja, 0) < o.quantidade_total
      ) AS pedidos_em_producao,
      (
        SELECT COALESCE(SUM(quantidade), 0)::int
        FROM production_records
        WHERE data::date = CURRENT_DATE
      ) AS producao_dia,
      (
        SELECT COALESCE(SUM(quantidade), 0)::int
        FROM production_records
      ) AS total_produzido
  `;

  const delayRiskQuery = `
    WITH loja_totals AS (
      SELECT pedido_id, COALESCE(SUM(quantidade), 0)::int AS total_loja
      FROM production_records
      WHERE etapa = $1
      GROUP BY pedido_id
    )
    SELECT
      COUNT(*) FILTER (
        WHERE o.data < CURRENT_DATE
          AND COALESCE(lt.total_loja, 0) < o.quantidade_total
      )::int AS pedidos_em_atraso,
      COUNT(*) FILTER (
        WHERE o.data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
          AND COALESCE(lt.total_loja, 0) < o.quantidade_total
      )::int AS pedidos_em_risco
    FROM orders o
    LEFT JOIN loja_totals lt ON lt.pedido_id = o.id
  `;

  const leadTimeQuery = `
    WITH completed_orders AS (
      SELECT o.id,
             o.created_at,
             MAX(pr.data) AS completed_at,
             COALESCE(SUM(CASE WHEN pr.etapa = $1 THEN pr.quantidade ELSE 0 END), 0) AS total_loja,
             o.quantidade_total
      FROM orders o
      LEFT JOIN production_records pr ON pr.pedido_id = o.id
      GROUP BY o.id, o.created_at, o.quantidade_total
      HAVING COALESCE(SUM(CASE WHEN pr.etapa = $1 THEN pr.quantidade ELSE 0 END), 0) >= o.quantidade_total
    )
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400), 0)::numeric(10,2) AS lead_time_medio_dias
    FROM completed_orders
  `;

  const throughputQuery = `
    SELECT etapa, COALESCE(SUM(quantidade), 0)::int AS total
    FROM production_records
    WHERE data::date = CURRENT_DATE
    GROUP BY etapa
  `;

  const divergenceQuery = `
    WITH stage_totals AS (
      SELECT pedido_id, etapa, COALESCE(SUM(quantidade), 0)::int AS total
      FROM production_records
      GROUP BY pedido_id, etapa
    ),
    order_stage AS (
      SELECT
        o.id AS pedido_id,
        COALESCE(MAX(CASE WHEN st.etapa = 'Corte' THEN st.total END), 0) AS corte,
        COALESCE(MAX(CASE WHEN st.etapa = 'Confeccao' THEN st.total END), 0) AS confeccao,
        COALESCE(MAX(CASE WHEN st.etapa = 'Travete' THEN st.total END), 0) AS travete,
        COALESCE(MAX(CASE WHEN st.etapa = 'Lavanderia' THEN st.total END), 0) AS lavanderia,
        COALESCE(MAX(CASE WHEN st.etapa = 'Acabamento' THEN st.total END), 0) AS acabamento,
        COALESCE(MAX(CASE WHEN st.etapa = 'Loja' THEN st.total END), 0) AS loja
      FROM orders o
      LEFT JOIN stage_totals st ON st.pedido_id = o.id
      GROUP BY o.id
    )
    SELECT pedido_id,
           corte, confeccao, travete, lavanderia, acabamento, loja,
           GREATEST(corte - confeccao, confeccao - travete, travete - lavanderia, lavanderia - acabamento, acabamento - loja, 0) AS max_gap
    FROM order_stage
    WHERE GREATEST(corte - confeccao, confeccao - travete, travete - lavanderia, lavanderia - acabamento, acabamento - loja, 0) >= 10
    ORDER BY max_gap DESC
    LIMIT 10
  `;

  const [basicCards, delayRisk, leadTime, throughput, divergence] = await Promise.all([
    pool.query(basicCardsQuery, [FINAL_STEP]),
    pool.query(delayRiskQuery, [FINAL_STEP]),
    pool.query(leadTimeQuery, [FINAL_STEP]),
    pool.query(throughputQuery),
    pool.query(divergenceQuery)
  ]);

  const throughputMap = new Map(throughput.rows.map((row) => [row.etapa, row.total]));
  const throughputByStage = PRODUCTION_STEPS.map((etapa) => ({ etapa, total: throughputMap.get(etapa) || 0 }));

  const alerts = [
    ...(delayRisk.rows[0].pedidos_em_atraso
      ? [{ tipo: 'atraso', mensagem: `${delayRisk.rows[0].pedidos_em_atraso} pedido(s) em atraso.` }]
      : []),
    ...(delayRisk.rows[0].pedidos_em_risco
      ? [{ tipo: 'risco', mensagem: `${delayRisk.rows[0].pedidos_em_risco} pedido(s) com risco de atraso (2 dias).` }]
      : []),
    ...divergence.rows.map((item) => ({
      tipo: 'divergencia',
      mensagem: `Pedido #${item.pedido_id} com divergencia de ${item.max_gap} peca(s) entre etapas.`
    }))
  ];

  return {
    ...basicCards.rows[0],
    pedidos_em_atraso: delayRisk.rows[0].pedidos_em_atraso,
    pedidos_em_risco: delayRisk.rows[0].pedidos_em_risco,
    lead_time_medio_dias: Number(leadTime.rows[0].lead_time_medio_dias),
    throughput_por_etapa: throughputByStage,
    alertas: alerts
  };
}

async function getOperationalAlerts() {
  const query = `
    WITH loja_totals AS (
      SELECT pedido_id, COALESCE(SUM(quantidade), 0)::int AS total_loja
      FROM production_records
      WHERE etapa = $1
      GROUP BY pedido_id
    )
    SELECT
      o.id AS pedido_id,
      o.cliente,
      o.modelo,
      o.data,
      o.quantidade_total,
      COALESCE(lt.total_loja, 0)::int AS total_loja,
      CASE
        WHEN o.data < CURRENT_DATE AND COALESCE(lt.total_loja, 0) < o.quantidade_total THEN 'atraso'
        WHEN o.data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days' AND COALESCE(lt.total_loja, 0) < o.quantidade_total THEN 'risco'
        ELSE 'ok'
      END AS status
    FROM orders o
    LEFT JOIN loja_totals lt ON lt.pedido_id = o.id
    WHERE COALESCE(lt.total_loja, 0) < o.quantidade_total
    ORDER BY o.data ASC
    LIMIT 30
  `;

  const { rows } = await pool.query(query, [FINAL_STEP]);
  return rows;
}

module.exports = { getDashboardStats, getOperationalAlerts };
