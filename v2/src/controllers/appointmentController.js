const { ok } = require('../utils/apiResponse');
const appointmentService = require('../services/appointmentService');

async function create(req, res) {
  const item = await appointmentService.create(req.tenant.empresaId, req.body);
  ok(res, item, 201);
}

async function list(req, res) {
  const items = await appointmentService.list(req.tenant.empresaId, {
    data: req.query.data || '',
    status: req.query.status || '',
  });
  ok(res, items);
}

async function update(req, res) {
  const item = await appointmentService.update(req.tenant.empresaId, Number(req.params.id), req.body);
  ok(res, item);
}

async function remove(req, res) {
  await appointmentService.remove(req.tenant.empresaId, Number(req.params.id));
  ok(res, { message: 'Agendamento removido.' });
}

module.exports = {
  create,
  list,
  update,
  remove,
};
