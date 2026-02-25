const { z } = require('zod');
const vehicleModel = require('../models/vehicleModel');
const clientModel = require('../models/clientModel');

const schema = z.object({
  clienteId: z.coerce.number().int().positive('clienteId invalido.'),
  placa: z.string().trim().min(7, 'Placa invalida.').max(12),
  marca: z.string().trim().max(80).optional().or(z.literal('')),
  modelo: z.string().trim().min(1, 'Modelo obrigatorio.').max(80),
  cor: z.string().trim().max(40).optional().or(z.literal('')),
  ano: z.coerce.number().int().min(1950).max(2100).optional(),
});

async function assertClientBelongs(empresaId, clienteId) {
  const client = await clientModel.findById(empresaId, clienteId);
  if (!client) {
    const error = new Error('Cliente nao encontrado para esta empresa.');
    error.status = 400;
    throw error;
  }
}

async function create(empresaId, input) {
  const data = schema.parse(input);
  await assertClientBelongs(empresaId, data.clienteId);
  return vehicleModel.create(empresaId, data);
}

async function list(empresaId, search) {
  return vehicleModel.list(empresaId, (search || '').trim());
}

async function update(empresaId, id, input) {
  const data = schema.parse(input);
  await assertClientBelongs(empresaId, data.clienteId);
  const updated = await vehicleModel.update(empresaId, id, data);
  if (!updated) {
    const error = new Error('Veiculo nao encontrado.');
    error.status = 404;
    throw error;
  }
  return updated;
}

async function remove(empresaId, id) {
  const count = await vehicleModel.remove(empresaId, id);
  if (!count) {
    const error = new Error('Veiculo nao encontrado.');
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
