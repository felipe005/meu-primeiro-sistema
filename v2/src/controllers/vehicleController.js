const { ok } = require('../utils/apiResponse');
const vehicleService = require('../services/vehicleService');

async function create(req, res) {
  const item = await vehicleService.create(req.tenant.empresaId, req.body);
  ok(res, item, 201);
}

async function list(req, res) {
  const items = await vehicleService.list(req.tenant.empresaId, req.query.search || '');
  ok(res, items);
}

async function update(req, res) {
  const item = await vehicleService.update(req.tenant.empresaId, Number(req.params.id), req.body);
  ok(res, item);
}

async function remove(req, res) {
  await vehicleService.remove(req.tenant.empresaId, Number(req.params.id));
  ok(res, { message: 'Veiculo removido.' });
}

module.exports = {
  create,
  list,
  update,
  remove,
};
