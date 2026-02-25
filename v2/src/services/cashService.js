const { z } = require('zod');
const cashModel = require('../models/cashModel');

const schema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  categoria: z.string().trim().min(2, 'Categoria obrigatoria.'),
  descricao: z.string().trim().max(400).optional().or(z.literal('')),
  valor: z.coerce.number().positive('Valor deve ser maior que zero.'),
  formaPagamento: z.enum(['dinheiro', 'pix', 'debito', 'credito', 'boleto', 'transferencia']),
  dataMovimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida (YYYY-MM-DD).'),
});

function monthFromInput(value) {
  const month = value || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    const error = new Error('Mes invalido. Use YYYY-MM.');
    error.status = 400;
    throw error;
  }
  return month;
}

async function create(empresaId, input) {
  const data = schema.parse(input);
  return cashModel.create(empresaId, data);
}

async function list(empresaId, filters) {
  const date = filters.data || null;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error = new Error('Data invalida. Use YYYY-MM-DD.');
    error.status = 400;
    throw error;
  }
  return cashModel.list(empresaId, { data: date });
}

async function monthlyReport(empresaId, monthInput) {
  return cashModel.monthlyReport(empresaId, monthFromInput(monthInput));
}

async function remove(empresaId, id) {
  const count = await cashModel.remove(empresaId, id);
  if (!count) {
    const error = new Error('Movimentacao de caixa nao encontrada.');
    error.status = 404;
    throw error;
  }
}

module.exports = {
  create,
  list,
  monthlyReport,
  remove,
};
