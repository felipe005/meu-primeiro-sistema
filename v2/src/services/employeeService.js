const { z } = require('zod');
const employeeModel = require('../models/employeeModel');

const schema = z.object({
  nome: z.string().trim().min(2, 'Nome do funcionario deve ter ao menos 2 caracteres.'),
  cargo: z.string().trim().max(80).optional().or(z.literal('')),
  telefone: z.string().trim().max(30).optional().or(z.literal('')),
  salario: z.coerce.number().nonnegative('Salario deve ser maior ou igual a zero.'),
  ativo: z.boolean().optional().default(true),
});

async function create(empresaId, input) {
  const data = schema.parse(input);
  return employeeModel.create(empresaId, data);
}

async function list(empresaId) {
  return employeeModel.list(empresaId);
}

async function update(empresaId, id, input) {
  const data = schema.parse(input);
  const updated = await employeeModel.update(empresaId, id, data);
  if (!updated) {
    const error = new Error('Funcionario nao encontrado.');
    error.status = 404;
    throw error;
  }
  return updated;
}

async function remove(empresaId, id) {
  const count = await employeeModel.remove(empresaId, id);
  if (!count) {
    const error = new Error('Funcionario nao encontrado.');
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
