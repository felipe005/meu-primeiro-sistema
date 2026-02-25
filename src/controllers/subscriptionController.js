const subscriptionModel = require('../models/subscriptionModel');

async function getSubscription(req, res, next) {
  try {
    const subscription = await subscriptionModel.findByCompany(req.auth.companyId);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
}

async function updateSubscription(req, res, next) {
  try {
    const { planStatus, monthlyFee, pixKey, nextBillingDate } = req.body;

    if (!['active', 'inactive'].includes(planStatus)) {
      res.status(400).json({ message: 'planStatus deve ser active ou inactive.' });
      return;
    }

    const fee = Number(monthlyFee);
    if (Number.isNaN(fee) || fee < 0) {
      res.status(400).json({ message: 'monthlyFee invalido.' });
      return;
    }

    await subscriptionModel.updateByCompany(req.auth.companyId, {
      planStatus,
      monthlyFee: fee,
      pixKey: pixKey || null,
      nextBillingDate: nextBillingDate || null,
    });

    res.json({ message: 'Assinatura atualizada.' });
  } catch (error) {
    next(error);
  }
}

async function listPayments(req, res, next) {
  try {
    const rows = await subscriptionModel.listPayments(req.auth.companyId);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function createPayment(req, res, next) {
  try {
    const amount = Number(req.body.amount || 0);
    if (Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ message: 'amount invalido.' });
      return;
    }

    const status = req.body.status === 'paid' ? 'paid' : 'pending';
    const paidAt = status === 'paid' ? (req.body.paidAt || new Date().toISOString()) : null;
    const created = await subscriptionModel.createPayment(req.auth.companyId, {
      amount,
      dueDate: req.body.dueDate || null,
      paidAt,
      method: req.body.method || 'pix',
      reference: req.body.reference || null,
      status,
    });

    res.status(201).json({ id: created.id, message: 'Pagamento da assinatura registrado.' });
  } catch (error) {
    next(error);
  }
}

async function markPaymentPaid(req, res, next) {
  try {
    const result = await subscriptionModel.markPaymentPaid(req.auth.companyId, Number(req.params.id));
    if (!result.changes) {
      res.status(404).json({ message: 'Pagamento nao encontrado.' });
      return;
    }

    const subscription = await subscriptionModel.findByCompany(req.auth.companyId);
    const baseDate = subscription?.nextBillingDate || new Date().toISOString().slice(0, 10);
    const next = new Date(baseDate);
    if (!Number.isNaN(next.getTime())) {
      next.setDate(next.getDate() + 30);
      await subscriptionModel.activateAndSetNextBilling(req.auth.companyId, next.toISOString().slice(0, 10));
    } else {
      await subscriptionModel.setPlanStatusByCompany(req.auth.companyId, 'active');
    }

    res.json({ message: 'Pagamento marcado como pago.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubscription,
  updateSubscription,
  listPayments,
  createPayment,
  markPaymentPaid,
};
