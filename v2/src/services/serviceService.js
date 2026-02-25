const { z } = require('zod');
const serviceModel = require('../models/serviceModel');

const schema = z.object({
  nome: z.string().trim().min(2, 'Nome do servico deve ter ao menos 2 caracteres.'),
  descricao: z.string().trim().max(500).optional().or(z.literal('')),
  preco: z.coerce.number().nonnegative('Preco deve ser maior ou igual a zero.'),
  duracaoMinutos: z.coerce.number().int().positive('Duracao deve ser maior que zero.'),
  ativo: z.boolean().optional().default(true),
});

async function create(empresaId, input) {
  const data = schema.parse(input);
  return serviceModel.create(empresaId, data);
}

async function list(empresaId) {
  return serviceModel.list(empresaId);
}

async function update(empresaId, id, input) {
  const data = schema.parse(input);
  const updated = await serviceModel.update(empresaId, id, data);
  if (!updated) {
    const error = new Error('Servico nao encontrado.');
    error.status = 404;
    throw error;
  }
  return updated;
}

async function remove(empresaId, id) {
  const count = await serviceModel.remove(empresaId, id);
  if (!count) {
    const error = new Error('Servico nao encontrado.');
    error.status = 404;
    throw error;
  }
}

module.exports = {
  create,
  list,
  update,
  remove,
};
