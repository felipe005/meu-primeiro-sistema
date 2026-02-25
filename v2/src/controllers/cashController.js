const { ok } = require('../utils/apiResponse');
const cashService = require('../services/cashService');

async function create(req, res) {
  const item = await cashService.create(req.tenant.empresaId, req.body);
  ok(res, item, 201);
}

async function list(req, res) {
  const items = await cashService.list(req.tenant.empresaId, { data: req.query.data || '' });
  ok(res, items);
}

async function monthlyReport(req, res) {
  const data = await cashService.monthlyReport(req.tenant.empresaId, req.query.mes || '');
  ok(res, data);
}

async function remove(req, res) {
  await cashService.remove(req.tenant.empresaId, Number(req.params.id));
  ok(res, { message: 'Movimentacao removida.' });
}

module.exports = {
  create,
  list,
  monthlyReport,
  remove,
};
