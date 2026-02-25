const { pool } = require('../database/pool');

async function findByEmail(email) {
  const query = `
    SELECT id, nome, email, senha_hash, plano, status_assinatura, data_vencimento
    FROM empresas
    WHERE email = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function createCompany({ nome, email, senhaHash, plano, statusAssinatura, dataVencimento }) {
  const query = `
    INSERT INTO empresas (nome, email, senha_hash, plano, status_assinatura, data_vencimento)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, nome, email, plano, status_assinatura AS "statusAssinatura", data_vencimento AS "dataVencimento", criado_em AS "criadoEm"
  `;
  const values = [nome, email, senhaHash, plano, statusAssinatura, dataVencimento];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function findById(id) {
  const query = `
    SELECT id, nome, email, plano, status_assinatura AS "statusAssinatura", data_vencimento AS "dataVencimento",
           criado_em AS "criadoEm", atualizado_em AS "atualizadoEm"
    FROM empresas
    WHERE id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function updateSubscription(id, data) {
  const query = `
    UPDATE empresas
    SET plano = $2,
        status_assinatura = $3,
        data_vencimento = $4,
        atualizado_em = NOW()
    WHERE id = $1
    RETURNING id, nome, email, plano, status_assinatura AS "statusAssinatura", data_vencimento AS "dataVencimento", atualizado_em AS "atualizadoEm"
  `;
  const values = [id, data.plano, data.statusAssinatura, data.dataVencimento];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

module.exports = {
  findByEmail,
  createCompany,
  findById,
  updateSubscription,
};
