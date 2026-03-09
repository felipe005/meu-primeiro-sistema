const { asyncHandler } = require('../utils/asyncHandler');
const { createProductionRecord, listProductionRecords } = require('../models/productionModel');
const { findOrderById } = require('../models/orderModel');

const STEPS = new Set(['Costura', 'Travete', 'Lavanderia', 'Acabamento', 'Estoque']);

const create = asyncHandler(async (req, res) => {
  const { pedido_id: pedidoId, etapa, quantidade } = req.body;

  const order = await findOrderById(Number(pedidoId));
  if (!order) {
    return res.status(404).json({ message: 'Pedido nao encontrado.' });
  }

  if (!STEPS.has(etapa)) {
    return res.status(400).json({ message: 'Etapa invalida.' });
  }

  const qtd = Number(quantidade);

  if (!Number.isInteger(qtd) || qtd <= 0) {
    return res.status(400).json({ message: 'Quantidade deve ser inteiro positivo.' });
  }

  const record = await createProductionRecord({
    pedidoId: Number(pedidoId),
    etapa,
    quantidade: qtd,
    funcionarioId: req.user.id
  });

  return res.status(201).json(record);
});

const list = asyncHandler(async (req, res) => {
  const orderId = req.query.orderId ? Number(req.query.orderId) : null;
  const data = await listProductionRecords(orderId);
  return res.json(data);
});

module.exports = { create, list, STEPS };
