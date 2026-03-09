const { asyncHandler } = require('../utils/asyncHandler');
const { createOrder, listOrders, findOrderById, setOrderSizes, getOrderSizes } = require('../models/orderModel');

const COMMON_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'];

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

const create = asyncHandler(async (req, res) => {
  const {
    cliente,
    modelo,
    referencia,
    data,
    tecido,
    largura,
    media,
    matriz,
    retalho,
    quantidade_total: quantidadeTotal,
    grades
  } = req.body;

  if (!cliente || !modelo || !referencia || !data || !tecido || quantidadeTotal === undefined) {
    return res.status(400).json({ message: 'Campos obrigatorios do pedido nao informados.' });
  }

  const quantidade = Number(quantidadeTotal);

  if (!Number.isInteger(quantidade) || quantidade < 0) {
    return res.status(400).json({ message: 'quantidade_total deve ser inteiro nao negativo.' });
  }

  const order = await createOrder({
    cliente,
    modelo,
    referencia,
    data,
    tecido,
    largura: parseNumber(largura),
    media: parseNumber(media),
    matriz: parseNumber(matriz),
    retalho: parseNumber(retalho),
    quantidade_total: quantidade
  });

  if (Array.isArray(grades) && grades.length > 0) {
    const validGrades = grades
      .filter((item) => COMMON_SIZES.includes(String(item.tamanho)) && Number(item.quantidade) >= 0)
      .map((item) => ({ tamanho: String(item.tamanho), quantidade: Number(item.quantidade) }));

    if (validGrades.length > 0) {
      await setOrderSizes(order.id, validGrades);
    }
  }

  const sizes = await getOrderSizes(order.id);

  return res.status(201).json({ ...order, grades: sizes });
});

const list = asyncHandler(async (_req, res) => {
  const orders = await listOrders();
  return res.json(orders);
});

const getById = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const order = await findOrderById(orderId);

  if (!order) {
    return res.status(404).json({ message: 'Pedido nao encontrado.' });
  }

  const sizes = await getOrderSizes(orderId);
  return res.json({ ...order, grades: sizes });
});

const saveSizes = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const order = await findOrderById(orderId);

  if (!order) {
    return res.status(404).json({ message: 'Pedido nao encontrado.' });
  }

  const sizes = Array.isArray(req.body) ? req.body : req.body.grades;

  if (!Array.isArray(sizes)) {
    return res.status(400).json({ message: 'Informe um array de grades.' });
  }

  const validGrades = sizes
    .filter((item) => COMMON_SIZES.includes(String(item.tamanho)) && Number(item.quantidade) >= 0)
    .map((item) => ({ tamanho: String(item.tamanho), quantidade: Number(item.quantidade) }));

  await setOrderSizes(orderId, validGrades);
  const saved = await getOrderSizes(orderId);

  return res.json(saved);
});

module.exports = { create, list, getById, saveSizes, COMMON_SIZES };
