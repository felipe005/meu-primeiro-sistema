const { pool } = require('../config/database');
const { PRODUCTION_STEPS, FINAL_STEP } = require('../constants/production');

async function getDashboardStats(userId) {
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
        WHERE o.status = 'ativo'
          AND COALESCE(lt.total_loja, 0) < o.quantidade_total
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
        WHERE o.status = 'ativo'
          AND o.data < CURRENT_DATE
          AND COALESCE(lt.total_loja, 0) < o.quantidade_total
      )::int AS pedidos_em_atraso,
      COUNT(*) FILTER (
        WHERE o.status = 'ativo'
          AND o.data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
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
      WHERE o.status IN ('ativo', 'arquivado')
      GROUP BY o.id, o.created_at, o.quantidade_total
      HAVING COALESCE(SUM(CASE WHEN pr.etapa = $1 THEN pr.quantidade ELSE 0 END), 0) >= o.quantidade_total
    )
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400), 0)::numeric(10,2) AS lead_time_medio_dias
    FROM completed_orders
  `;

  const saldoAtualQuery = `
    WITH stage_totals AS (
      SELECT pr.pedido_id,
             COALESCE(SUM(CASE WHEN pr.etapa = 'Corte' THEN pr.quantidade ELSE 0 END), 0)::int AS corte,
             COALESCE(SUM(CASE WHEN pr.etapa = 'Confeccao' THEN pr.quantidade ELSE 0 END), 0)::int AS confeccao,
             COALESCE(SUM(CASE WHEN pr.etapa = 'Travete' THEN pr.quantidade ELSE 0 END), 0)::int AS travete,
             COALESCE(SUM(CASE WHEN pr.etapa = 'Lavanderia' THEN pr.quantidade ELSE 0 END), 0)::int AS lavanderia,
             COALESCE(SUM(CASE WHEN pr.etapa = 'Acabamento' THEN pr.quantidade ELSE 0 END), 0)::int AS acabamento,
             COALESCE(SUM(CASE WHEN pr.etapa = 'Loja' THEN pr.quantidade ELSE 0 END), 0)::int AS loja
      FROM production_records pr
      GROUP BY pr.pedido_id
    ),
    order_balances AS (
      SELECT o.id,
             GREATEST(COALESCE(st.corte,0) - COALESCE(st.confeccao,0), 0)::int AS saldo_corte,
             GREATEST(COALESCE(st.confeccao,0) - COALESCE(st.travete,0), 0)::int AS saldo_confeccao,
             GREATEST(COALESCE(st.travete,0) - COALESCE(st.lavanderia,0), 0)::int AS saldo_travete,
             GREATEST(COALESCE(st.lavanderia,0) - COALESCE(st.acabamento,0), 0)::int AS saldo_lavanderia,
             GREATEST(COALESCE(st.acabamento,0) - COALESCE(st.loja,0), 0)::int AS saldo_acabamento,
             COALESCE(st.loja,0)::int AS saldo_loja
      FROM orders o
      LEFT JOIN stage_totals st ON st.pedido_id = o.id
      WHERE o.status = 'ativo'
    )
    SELECT
      COALESCE(SUM(saldo_corte), 0)::int AS corte,
      COALESCE(SUM(saldo_confeccao), 0)::int AS confeccao,
      COALESCE(SUM(saldo_travete), 0)::int AS travete,
      COALESCE(SUM(saldo_lavanderia), 0)::int AS lavanderia,
      COALESCE(SUM(saldo_acabamento), 0)::int AS acabamento,
      COALESCE(SUM(saldo_loja), 0)::int AS loja
    FROM order_balances
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
      WHERE o.status = 'ativo'
      GROUP BY o.id
    )
    SELECT pedido_id,
           GREATEST(corte - confeccao, confeccao - travete, travete - lavanderia, lavanderia - acabamento, acabamento - loja, 0) AS max_gap
    FROM order_stage
    WHERE GREATEST(corte - confeccao, confeccao - travete, travete - lavanderia, lavanderia - acabamento, acabamento - loja, 0) >= 10
    ORDER BY max_gap DESC
    LIMIT 10
  `;

  const notificationCountQuery = `
    SELECT COALESCE(COUNT(*), 0)::int AS notificacoes_pendentes
    FROM notifications
    WHERE user_id = $1 AND is_read = FALSE
  `;

  const [basicCards, delayRisk, leadTime, saldoAtual, divergence, notificationCount] = await Promise.all([
    pool.query(basicCardsQuery, [FINAL_STEP]),
    pool.query(delayRiskQuery, [FINAL_STEP]),
    pool.query(leadTimeQuery, [FINAL_STEP]),
    pool.query(saldoAtualQuery),
    pool.query(divergenceQuery),
    pool.query(notificationCountQuery, [userId])
  ]);

  const saldoRow = saldoAtual.rows[0] || {};
  const saldoAtualPorEtapa = PRODUCTION_STEPS.map((etapa) => ({
    etapa,
    total: Number(saldoRow[etapa.toLowerCase()] || 0)
  }));

  const alerts = [
    ...(delayRisk.rows[0].pedidos_em_atraso
      ? [{ tipo: 'atraso', mensagem: `${delayRisk.rows[0].pedidos_em_atraso} pedido(s) em atraso.` }]
      : []),
    ...(delayRisk.rows[0].pedidos_em_risco
      ? [{ tipo: 'risco', mensagem: `${delayRisk.rows[0].pedidos_em_risco} pedido(s) com risco de atraso (2 dias).` }]
      : []),
    ...divergence.rows.map((item) => ({
      tipo: 'divergencia',
      mensagem: `Pedido #${item.pedido_id} com divergência de ${item.max_gap} peça(s) entre etapas.`
    }))
  ];

  return {
    ...basicCards.rows[0],
    pedidos_em_atraso: delayRisk.rows[0].pedidos_em_atraso,
    pedidos_em_risco: delayRisk.rows[0].pedidos_em_risco,
    lead_time_medio_dias: Number(leadTime.rows[0].lead_time_medio_dias),
    saldo_atual_por_etapa: saldoAtualPorEtapa,
    alertas: alerts,
    notificacoes_pendentes: notificationCount.rows[0].notificacoes_pendentes
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
    WHERE o.status = 'ativo'
      AND COALESCE(lt.total_loja, 0) < o.quantidade_total
    ORDER BY o.data ASC
    LIMIT 30
  `;

  const { rows } = await pool.query(query, [FINAL_STEP]);
  return rows;
}

module.exports = { getDashboardStats, getOperationalAlerts };
