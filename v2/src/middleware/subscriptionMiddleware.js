const { pool } = require('../database/pool');
const { isExpired } = require('../utils/date');

async function requireActiveSubscription(req, res, next) {
  const empresaId = req.tenant?.empresaId;
  if (!empresaId) {
    res.status(401).json({ message: 'Empresa nao identificada.' });
    return;
  }

  const query = `
    SELECT status_assinatura AS "statusAssinatura", data_vencimento AS "dataVencimento"
    FROM empresas
    WHERE id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [empresaId]);
  const company = rows[0];

  if (!company) {
    res.status(404).json({ message: 'Empresa nao encontrada.' });
    return;
  }

  const blocked = company.statusAssinatura === 'suspenso' || isExpired(company.dataVencimento);
  if (blocked) {
    res.status(402).json({ message: 'Assinatura vencida ou suspensa. Regularize para continuar.' });
    return;
  }

  next();
}

module.exports = {
  requireActiveSubscription,
};
