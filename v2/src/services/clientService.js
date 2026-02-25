const { z } = require('zod');
const clientModel = require('../models/clientModel');

const schema = z.object({
  nome: z.string().trim().min(2, 'Nome do cliente deve ter ao menos 2 caracteres.'),
  telefone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().email('Email invalido.').optional().or(z.literal('')),
  observacoes: z.string().trim().max(500).optional().or(z.literal('')),
});

async function create(empresaId, input) {
  const data = schema.parse(input);
  return clientModel.create(empresaId, data);
}

async function list(empresaId, search) {
  return clientModel.list(empresaId, (search || '').trim());
}

async function update(empresaId, id, input) {
  const data = schema.parse(input);
  const updated = await clientModel.update(empresaId, id, data);
  if (!updated) {
    const error = new Error('Cliente nao encontrado.');
    error.status = 404;
    throw error;
  }
  return updated;
}

async function remove(empresaId, id) {
  const count = await clientModel.remove(empresaId, id);
  if (!count) {
    const error = new Error('Cliente nao encontrado.');
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
