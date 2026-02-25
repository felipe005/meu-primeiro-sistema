const { pool } = require('../database/pool');

async function create(empresaId, data) {
  const query = `
    INSERT INTO agendamentos (
      empresa_id, cliente_id, veiculo_id, servico_id, funcionario_id,
      data, hora, status, valor, observacoes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, empresa_id AS "empresaId", cliente_id AS "clienteId", veiculo_id AS "veiculoId",
              servico_id AS "servicoId", funcionario_id AS "funcionarioId", data, hora, status, valor, observacoes
  `;
  const values = [
    empresaId,
    data.clienteId,
    data.veiculoId,
    data.servicoId,
    data.funcionarioId || null,
    data.data,
    data.hora,
    data.status,
    data.valor,
    data.observacoes || null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function list(empresaId, filters) {
  const query = `
    SELECT a.id, a.empresa_id AS "empresaId", a.cliente_id AS "clienteId", a.veiculo_id AS "veiculoId",
           a.servico_id AS "servicoId", a.funcionario_id AS "funcionarioId", a.data, a.hora, a.status, a.valor, a.observacoes,
           c.nome AS "clienteNome",
           v.placa AS "veiculoPlaca",
           s.nome AS "servicoNome",
           f.nome AS "funcionarioNome"
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id AND c.empresa_id = a.empresa_id
    JOIN veiculos v ON v.id = a.veiculo_id AND v.empresa_id = a.empresa_id
    JOIN servicos s ON s.id = a.servico_id AND s.empresa_id = a.empresa_id
    LEFT JOIN funcionarios f ON f.id = a.funcionario_id AND f.empresa_id = a.empresa_id
    WHERE a.empresa_id = $1
      AND ($2::date IS NULL OR a.data = $2::date)
      AND ($3 = '' OR a.status = $3)
    ORDER BY a.data DESC, a.hora DESC
  `;
  const values = [empresaId, filters.data || null, filters.status || ''];
  const { rows } = await pool.query(query, values);
  return rows;
}

async function findById(empresaId, id) {
  const query = `
    SELECT id, empresa_id AS "empresaId", cliente_id AS "clienteId", veiculo_id AS "veiculoId",
           servico_id AS "servicoId", funcionario_id AS "funcionarioId", data, hora, status, valor, observacoes
    FROM agendamentos
    WHERE empresa_id = $1 AND id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [empresaId, id]);
  return rows[0] || null;
}

async function update(empresaId, id, data) {
  const query = `
    UPDATE agendamentos
    SET cliente_id = $3,
        veiculo_id = $4,
        servico_id = $5,
        funcionario_id = $6,
        data = $7,
        hora = $8,
        status = $9,
        valor = $10,
        observacoes = $11,
        atualizado_em = NOW()
    WHERE empresa_id = $1 AND id = $2
    RETURNING id, empresa_id AS "empresaId", cliente_id AS "clienteId", veiculo_id AS "veiculoId",
              servico_id AS "servicoId", funcionario_id AS "funcionarioId", data, hora, status, valor, observacoes
  `;
  const values = [
    empresaId,
    id,
    data.clienteId,
    data.veiculoId,
    data.servicoId,
    data.funcionarioId || null,
    data.data,
    data.hora,
    data.status,
    data.valor,
    data.observacoes || null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function remove(empresaId, id) {
  const query = 'DELETE FROM agendamentos WHERE empresa_id = $1 AND id = $2';
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
