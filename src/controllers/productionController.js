const { asyncHandler } = require('../utils/asyncHandler');
const { createProductionRecord, listProductionRecords } = require('../models/productionModel');
const { findOrderById } = require('../models/orderModel');
const { PRODUCTION_STEPS } = require('../constants/production');

const STEPS = new Set(PRODUCTION_STEPS);

function parseDateInput(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function getClientIp(req) {
  const raw = req.headers['x-forwarded-for'];
  if (raw && typeof raw === 'string') {
    return raw.split(',')[0].trim();
  }
  return req.ip || null;
}

const create = asyncHandler(async (req, res) => {
  const { pedido_id: pedidoId, etapa, quantidade, is_adjustment: isAdjustmentRaw, adjustment_reason: adjustmentReasonRaw } = req.body;

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

  if (!req.file) {
    return res.status(400).json({ message: 'Foto obrigatoria para registrar producao.' });
  }

  const isAdjustment = isAdjustmentRaw === true || isAdjustmentRaw === 'true';
  const adjustmentReason = String(adjustmentReasonRaw || '').trim();

  if (isAdjustment && req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({ message: 'Somente admin pode registrar ajuste.' });
  }

  if (isAdjustment && !adjustmentReason) {
    return res.status(400).json({ message: 'Ajuste exige motivo.' });
  }

  const evidenceUrl = `/uploads/evidences/${req.file.filename}`;

  const record = await createProductionRecord({
    pedidoId: Number(pedidoId),
    etapa,
    quantidade: qtd,
    funcionarioId: req.user.id,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    isAdjustment,
    adjustmentReason: adjustmentReason || null,
    evidenceUrl,
    evidenceMimeType: req.file.mimetype || 'image/jpeg'
  });

  return res.status(201).json(record);
});

const list = asyncHandler(async (req, res) => {
  const orderId = req.query.orderId ? Number(req.query.orderId) : null;
  const etapa = req.query.etapa ? String(req.query.etapa) : null;
  const from = parseDateInput(req.query.from);
  const to = parseDateInput(req.query.to);

  const filters = {
    orderId: Number.isInteger(orderId) ? orderId : null,
    etapa: etapa && STEPS.has(etapa) ? etapa : null,
    from,
    to,
    onlyEmployeeId: req.user.tipo_usuario === 'funcionario' ? req.user.id : null
  };

  const data = await listProductionRecords(filters);
  return res.json(data);
});

module.exports = { create, list, STEPS, PRODUCTION_STEPS };
