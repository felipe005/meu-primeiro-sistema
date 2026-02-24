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
    const { planStatus, monthlyFee, nextBillingDate } = req.body;

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
      nextBillingDate: nextBillingDate || null,
    });

    res.json({ message: 'Assinatura atualizada.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubscription,
  updateSubscription,
};
