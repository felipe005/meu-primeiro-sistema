const clientModel = require('../models/clientModel');

const validStatus = ['lead', 'active', 'inactive'];
const validPaymentStatus = ['em_dia', 'pendente', 'atrasado'];
const validPlateType = ['mercosul', 'antiga', 'nao_informado'];
const validPaymentMethod = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'];

function buildClientPayload(body = {}) {
  return {
    name: body.name,
    email: body.email || null,
    phone: body.phone || null,
    vehiclePlate: body.vehiclePlate || null,
    vehicleModel: body.vehicleModel || null,
    plateType: body.plateType || 'nao_informado',
    monthlyFee: Number(body.monthlyFee || 0),
    nextDueDate: body.nextDueDate || null,
    lastPaymentDate: body.lastPaymentDate || null,
    paymentStatus: body.paymentStatus || 'pendente',
    status: body.status || 'lead',
    notes: body.notes || null,
  };
}

function validateClientPayload(payload, res) {
  if (!payload.name) {
    res.status(400).json({ message: 'name e obrigatorio.' });
    return false;
  }

  if (!validStatus.includes(payload.status)) {
    res.status(400).json({ message: 'status invalido.' });
    return false;
  }

  if (!validPaymentStatus.includes(payload.paymentStatus)) {
    res.status(400).json({ message: 'paymentStatus invalido.' });
    return false;
  }

  if (!validPlateType.includes(payload.plateType)) {
    res.status(400).json({ message: 'plateType invalido.' });
    return false;
  }

  if (Number.isNaN(payload.monthlyFee) || payload.monthlyFee < 0) {
    res.status(400).json({ message: 'monthlyFee invalido.' });
    return false;
  }

  return true;
}

async function listClients(req, res, next) {
  try {
    const clients = await clientModel.listByCompany(req.auth.companyId, req.query.search || '');
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

async function getClient(req, res, next) {
  try {
    const client = await clientModel.findById(req.auth.companyId, Number(req.params.id));
    if (!client) {
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const payload = buildClientPayload(req.body);
    if (!validateClientPayload(payload, res)) {
      return;
    }

    const created = await clientModel.create({
      companyId: req.auth.companyId,
      ...payload,
    });

    res.status(201).json({ id: created.id, message: 'Cliente criado.' });
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const payload = buildClientPayload(req.body);
    if (!validateClientPayload(payload, res)) {
      return;
    }

    const result = await clientModel.updateById(req.auth.companyId, Number(req.params.id), payload);

    if (!result.changes) {
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
    }

    res.json({ message: 'Cliente atualizado.' });
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    const result = await clientModel.deleteById(req.auth.companyId, Number(req.params.id));
    if (!result.changes) {
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
    }

    res.json({ message: 'Cliente removido.' });
  } catch (error) {
    next(error);
  }
}

async function listClientPayments(req, res, next) {
  try {
    const rows = await clientModel.listPayments(req.auth.companyId, req.query.search || '');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function createClientPayment(req, res, next) {
  try {
    const clientId = Number(req.params.id);
    const client = await clientModel.findById(req.auth.companyId, clientId);
    if (!client) {
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
    }

    const amount = Number(req.body.amount || 0);
    if (Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ message: 'amount invalido.' });
      return;
    }

    const paymentDate = req.body.paidAt || new Date().toISOString();
    const method = req.body.method || 'pix';
    if (!validPaymentMethod.includes(method)) {
      res.status(400).json({ message: 'method invalido.' });
      return;
    }

    await clientModel.createPayment(req.auth.companyId, clientId, {
      amount,
      method,
      reference: req.body.reference || null,
      paidAt: paymentDate,
    });

    const baseDate = req.body.nextDueDate || paymentDate.slice(0, 10);
    const due = new Date(baseDate);
    if (Number.isNaN(due.getTime())) {
      res.status(400).json({ message: 'nextDueDate invalida.' });
      return;
    }
    due.setDate(due.getDate() + 30);
    const nextDueDate = due.toISOString().slice(0, 10);

    await clientModel.updateById(req.auth.companyId, clientId, {
      ...client,
      monthlyFee: amount,
      lastPaymentDate: paymentDate.slice(0, 10),
      nextDueDate,
      paymentStatus: 'em_dia',
    });

    res.status(201).json({ message: 'Pagamento registrado.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  listClientPayments,
  createClientPayment,
};
