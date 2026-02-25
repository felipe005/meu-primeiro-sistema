const { z } = require('zod');
const appointmentModel = require('../models/appointmentModel');
const clientModel = require('../models/clientModel');
const vehicleModel = require('../models/vehicleModel');
const serviceModel = require('../models/serviceModel');
const employeeModel = require('../models/employeeModel');

const allowedStatus = ['Aguardando', 'Em Lavagem', 'Finalizado'];

const schema = z.object({
  clienteId: z.coerce.number().int().positive('clienteId invalido.'),
  veiculoId: z.coerce.number().int().positive('veiculoId invalido.'),
  servicoId: z.coerce.number().int().positive('servicoId invalido.'),
  funcionarioId: z.coerce.number().int().positive().optional().nullable(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida (YYYY-MM-DD).'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Hora invalida (HH:MM).'),
  status: z.enum(allowedStatus).default('Aguardando'),
  valor: z.coerce.number().nonnegative('Valor invalido.'),
  observacoes: z.string().trim().max(500).optional().or(z.literal('')),
});

async function validateRefs(empresaId, data) {
  const [client, vehicle, service] = await Promise.all([
    clientModel.findById(empresaId, data.clienteId),
    vehicleModel.findById(empresaId, data.veiculoId),
    serviceModel.findById(empresaId, data.servicoId),
  ]);
  if (!client || !vehicle || !service) {
    const error = new Error('Cliente, veiculo ou servico invalido para esta empresa.');
    error.status = 400;
    throw error;
  }
  if (data.funcionarioId) {
    const employee = await employeeModel.findById(empresaId, data.funcionarioId);
    if (!employee) {
      const error = new Error('Funcionario invalido para esta empresa.');
      error.status = 400;
      throw error;
    }
  }
}

async function create(empresaId, input) {
  const data = schema.parse(input);
  await validateRefs(empresaId, data);
  return appointmentModel.create(empresaId, data);
}

async function list(empresaId, filters) {
  const status = filters.status && allowedStatus.includes(filters.status) ? filters.status : '';
  const data = filters.data || '';
  return appointmentModel.list(empresaId, { status, data });
}

async function update(empresaId, id, input) {
  const data = schema.parse(input);
  await validateRefs(empresaId, data);
  const updated = await appointmentModel.update(empresaId, id, data);
  if (!updated) {
    const error = new Error('Agendamento nao encontrado.');
    error.status = 404;
    throw error;
  }
  return updated;
}

async function remove(empresaId, id) {
  const count = await appointmentModel.remove(empresaId, id);
  if (!count) {
    const error = new Error('Agendamento nao encontrado.');
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
