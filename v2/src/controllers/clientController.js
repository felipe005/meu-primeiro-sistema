const { ok } = require('../utils/apiResponse');
const clientService = require('../services/clientService');

async function create(req, res) {
  const item = await clientService.create(req.tenant.empresaId, req.body);
  ok(res, item, 201);
}

async function list(req, res) {
  const items = await clientService.list(req.tenant.empresaId, req.query.search || '');
  ok(res, items);
}

async function update(req, res) {
  const item = await clientService.update(req.tenant.empresaId, Number(req.params.id), req.body);
  ok(res, item);
}

async function remove(req, res) {
  await clientService.remove(req.tenant.empresaId, Number(req.params.id));
  ok(res, { message: 'Cliente removido.' });
}

module.exports = {
  create,
  list,
  update,
  remove,
};
