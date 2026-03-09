const { pool } = require('../config/database');

async function createProductionRecord({
  pedidoId,
  etapa,
  quantidade,
  funcionarioId,
  ipAddress,
  userAgent,
  isAdjustment,
  adjustmentReason,
  evidenceUrl,
  evidenceMimeType
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const recordResult = await client.query(
      `
      INSERT INTO production_records
      (pedido_id, etapa, quantidade, funcionario_id, ip_address, user_agent, is_adjustment, adjustment_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, pedido_id, etapa, quantidade, funcionario_id, data, ip_address, user_agent, is_adjustment, adjustment_reason
      `,
      [pedidoId, etapa, quantidade, funcionarioId, ipAddress, userAgent, isAdjustment, adjustmentReason]
    );

    const record = recordResult.rows[0];

    const evidenceResult = await client.query(
      `
      INSERT INTO production_evidences (production_record_id, file_url, mime_type)
      VALUES ($1, $2, $3)
      RETURNING id, file_url, mime_type, created_at
      `,
      [record.id, evidenceUrl, evidenceMimeType]
    );

    await client.query('COMMIT');

    return {
      ...record,
      evidence: evidenceResult.rows[0],
      has_evidence: true
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listProductionRecords(filters) {
  const values = [];
  const where = [];

  if (filters.orderId) {
    values.push(filters.orderId);
    where.push(`pr.pedido_id = $${values.length}`);
  }

  if (filters.etapa) {
    values.push(filters.etapa);
    where.push(`pr.etapa = $${values.length}`);
  }

  if (filters.from) {
    values.push(filters.from);
    where.push(`pr.data >= $${values.length}`);
  }

  if (filters.to) {
    values.push(filters.to);
    where.push(`pr.data <= $${values.length}`);
  }

  if (filters.onlyEmployeeId) {
    values.push(filters.onlyEmployeeId);
    where.push(`pr.funcionario_id = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const query = `
    SELECT
      pr.id,
      pr.pedido_id,
      pr.etapa,
      pr.quantidade,
      pr.funcionario_id,
      pr.data AS created_at,
      pr.is_adjustment,
      pr.adjustment_reason,
      u.nome AS funcionario_nome,
      pe.id AS evidence_id,
      pe.file_url AS evidence_url,
      pe.mime_type AS evidence_mime_type,
      (pe.id IS NOT NULL) AS has_evidence
    FROM production_records pr
    INNER JOIN users u ON u.id = pr.funcionario_id
    LEFT JOIN production_evidences pe ON pe.production_record_id = pr.id
    ${whereSql}
    ORDER BY pr.data DESC
    LIMIT 500
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

module.exports = { createProductionRecord, listProductionRecords };
