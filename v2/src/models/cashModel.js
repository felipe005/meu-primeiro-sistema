const { pool } = require('../database/pool');

async function create(empresaId, data) {
  const query = `
    INSERT INTO caixa (empresa_id, tipo, categoria, descricao, valor, forma_pagamento, data_movimento)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, empresa_id AS "empresaId", tipo, categoria, descricao, valor,
              forma_pagamento AS "formaPagamento", data_movimento AS "dataMovimento", criado_em AS "criadoEm"
  `;
  const values = [empresaId, data.tipo, data.categoria, data.descricao || null, data.valor, data.formaPagamento, data.dataMovimento];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function list(empresaId, filters) {
  const query = `
    SELECT id, empresa_id AS "empresaId", tipo, categoria, descricao, valor,
           forma_pagamento AS "formaPagamento", data_movimento AS "dataMovimento", criado_em AS "criadoEm"
    FROM caixa
    WHERE empresa_id = $1
      AND ($2::date IS NULL OR data_movimento = $2::date)
    ORDER BY data_movimento DESC, criado_em DESC
  `;
  const { rows } = await pool.query(query, [empresaId, filters.data || null]);
  return rows;
}

async function remove(empresaId, id) {
  const result = await pool.query('DELETE FROM caixa WHERE empresa_id = $1 AND id = $2', [empresaId, id]);
  return result.rowCount;
}

async function monthlyReport(empresaId, month) {
  const query = `
    WITH base AS (
      SELECT tipo, valor, forma_pagamento AS "formaPagamento"
      FROM caixa
      WHERE empresa_id = $1
        AND to_char(data_movimento, 'YYYY-MM') = $2
    )
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor END), 0) AS entradas,
      COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor END), 0) AS saidas,
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor END), 0) - COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor END), 0) AS saldo
    FROM base
  `;

  const paymentsQuery = `
    SELECT forma_pagamento AS "formaPagamento",
           COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor END), 0) AS entradas,
           COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor END), 0) AS saidas
    FROM caixa
    WHERE empresa_id = $1
      AND to_char(data_movimento, 'YYYY-MM') = $2
    GROUP BY forma_pagamento
    ORDER BY forma_pagamento
  `;

  const [summaryResult, paymentsResult] = await Promise.all([
    pool.query(query, [empresaId, month]),
    pool.query(paymentsQuery, [empresaId, month]),
  ]);

  return {
    mes: month,
    resumo: summaryResult.rows[0],
    porFormaPagamento: paymentsResult.rows,
  };
}

module.exports = {
  create,
  list,
  remove,
  monthlyReport,
};
