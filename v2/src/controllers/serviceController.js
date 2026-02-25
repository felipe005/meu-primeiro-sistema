const { ok } = require('../utils/apiResponse');
const serviceService = require('../services/serviceService');

async function create(req, res) {
  const item = await serviceService.create(req.tenant.empresaId, req.body);
  ok(res, item, 201);
}

async function list(req, res) {
  const items = await serviceService.list(req.tenant.empresaId);
  ok(res, items);
}

async function update(req, res) {
  const item = await serviceService.update(req.tenant.empresaId, Number(req.params.id), req.body);
  ok(res, item);
}

async function remove(req, res) {
  await serviceService.remove(req.tenant.empresaId, Number(req.params.id));
  ok(res, { message: 'Servico removido.' });
}

module.exports = {
  create,
  list,
  update,
  remove,
};
