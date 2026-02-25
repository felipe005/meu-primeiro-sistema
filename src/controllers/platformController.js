const db = require('../utils/db');
const subscriptionModel = require('../models/subscriptionModel');
const PAYMENT_METHODS = ['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'];

async function overview(req, res, next) {
  try {
    const [companies, activePlans, inactivePlans, monthlyRevenue] = await Promise.all([
      db.get('SELECT COUNT(*) AS total FROM companies'),
      db.get("SELECT COUNT(*) AS total FROM subscriptions WHERE plan_status = 'active'"),
      db.get("SELECT COUNT(*) AS total FROM subscriptions WHERE plan_status = 'inactive'"),
      db.get("SELECT COALESCE(SUM(monthly_fee), 0) AS total FROM subscriptions WHERE plan_status = 'active'"),
    ]);

    res.json({
      totalCompanies: companies.total,
      activePlans: activePlans.total,
      inactivePlans: inactivePlans.total,
      mrr: monthlyRevenue.total,
    });
  } catch (error) {
    next(error);
  }
}

async function listCompanies(req, res, next) {
  try {
    const search = (req.query.search || '').trim();
    const hasSearch = Boolean(search);
    const pattern = `%${search}%`;
    const rows = await db.all(
      `SELECT c.id, c.name, c.business_type AS businessType, c.created_at AS createdAt,
              s.plan_status AS planStatus, s.monthly_fee AS monthlyFee, s.pix_key AS pixKey,
              s.preferred_payment_method AS preferredPaymentMethod,
              s.next_billing_date AS nextBillingDate,
              (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) AS usersCount,
              (SELECT COUNT(*) FROM appointments a WHERE a.company_id = c.id) AS appointmentsCount
       FROM companies c
       LEFT JOIN subscriptions s ON s.company_id = c.id
       WHERE (? = 0 OR c.name LIKE ? OR c.business_type LIKE ?)
       ORDER BY c.created_at DESC`,
      [hasSearch ? 1 : 0, pattern, pattern]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function updateCompanySubscription(req, res, next) {
  try {
    const companyId = Number(req.params.companyId);
    const company = await db.get('SELECT id FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      res.status(404).json({ message: 'Empresa nao encontrada.' });
      return;
    }

    const planStatus = req.body.planStatus === 'inactive' ? 'inactive' : 'active';
    const monthlyFee = Number(req.body.monthlyFee || 0);
    if (Number.isNaN(monthlyFee) || monthlyFee < 0) {
      res.status(400).json({ message: 'monthlyFee invalido.' });
      return;
    }

    const preferredPaymentMethod = req.body.preferredPaymentMethod || 'pix';
    if (!PAYMENT_METHODS.includes(preferredPaymentMethod)) {
      res.status(400).json({ message: 'preferredPaymentMethod invalido.' });
      return;
    }

    await subscriptionModel.updateByCompany(companyId, {
      planStatus,
      monthlyFee,
      pixKey: req.body.pixKey || null,
      preferredPaymentMethod,
      nextBillingDate: req.body.nextBillingDate || null,
    });

    res.json({ message: 'Assinatura da empresa atualizada.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  overview,
  listCompanies,
  updateCompanySubscription,
};
