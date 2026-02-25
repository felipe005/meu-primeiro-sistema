const { ok } = require('../utils/apiResponse');
const employeeService = require('../services/employeeService');

async function create(req, res) {
  const item = await employeeService.create(req.tenant.empresaId, req.body);
  ok(res, item, 201);
}

async function list(req, res) {
  const items = await employeeService.list(req.tenant.empresaId);
  ok(res, items);
}

async function update(req, res) {
  const item = await employeeService.update(req.tenant.empresaId, Number(req.params.id), req.body);
  ok(res, item);
}

async function remove(req, res) {
  await employeeService.remove(req.tenant.empresaId, Number(req.params.id));
  ok(res, { message: 'Funcionario removido.' });
}

module.exports = {
  create,
  list,
  update,
  remove,
};
