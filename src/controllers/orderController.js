const { asyncHandler } = require('../utils/asyncHandler');
const {
  createOrder,
  listOrders,
  findOrderById,
  setOrderSizes,
  getOrderSizes,
  archiveOrder,
  unarchiveOrder,
  softDeleteOrder,
  hardDeleteOrder
} = require('../models/orderModel');

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
    return res.status(400).json({ message: 'Campos obrigatórios do pedido não informados.' });
  }

  const quantidade = Number(quantidadeTotal);

  if (!Number.isInteger(quantidade) || quantidade < 0) {
    return res.status(400).json({ message: 'quantidade_total deve ser um inteiro não negativo.' });
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

const list = asyncHandler(async (req, res) => {
  const status = req.query.status || 'ativo';
  const orders = await listOrders(status);
  return res.json(orders);
});

const getById = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const order = await findOrderById(orderId);

  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  const sizes = await getOrderSizes(orderId);
  return res.json({ ...order, grades: sizes });
});

const saveSizes = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const order = await findOrderById(orderId);

  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
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

const archive = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const updated = await archiveOrder(orderId, req.user.id);

  if (!updated) {
    return res.status(404).json({ message: 'Pedido não encontrado para arquivar.' });
  }

  return res.json({ message: 'Pedido arquivado com sucesso.', pedido: updated });
});

const unarchive = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const updated = await unarchiveOrder(orderId);

  if (!updated) {
    return res.status(404).json({ message: 'Pedido não encontrado para reativar.' });
  }

  return res.json({ message: 'Pedido reativado com sucesso.', pedido: updated });
});

const remove = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const hard = String(req.query.hard || 'false') === 'true';

  if (hard) {
    const deleted = await hardDeleteOrder(orderId);

    if (!deleted) {
      return res.status(404).json({ message: 'Pedido não encontrado para exclusão definitiva.' });
    }

    return res.json({ message: 'Pedido excluído definitivamente.' });
  }

  const softDeleted = await softDeleteOrder(orderId, req.user.id);

  if (!softDeleted) {
    return res.status(404).json({ message: 'Pedido não encontrado para exclusão lógica.' });
  }

  return res.json({ message: 'Pedido movido para exclusão lógica.', pedido: softDeleted });
});

module.exports = { create, list, getById, saveSizes, archive, unarchive, remove, COMMON_SIZES };
