const sessionModel = require('../models/sessionModel');
const subscriptionModel = require('../models/subscriptionModel');
const { parseCookies } = require('../utils/cookies');
const { platformOwnerEmail } = require('../config/env');

async function requireAuth(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies.session_token;

    if (!token) {
      res.status(401).json({ message: 'Nao autenticado.' });
      return;
    }

    await sessionModel.clearExpired();
    const session = await sessionModel.findWithContext(token);

    if (!session || session.active !== 1 || new Date(session.expiresAt) <= new Date()) {
      res.setHeader('Set-Cookie', 'session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
      res.status(401).json({ message: 'Sessao invalida ou expirada.' });
      return;
    }

    const isPlatformOwner = session.platformOwner === 1 || (platformOwnerEmail && session.email === platformOwnerEmail);

    req.auth = {
      token,
      userId: session.userId,
      companyId: session.companyId,
      name: session.name,
      email: session.email,
      role: session.role,
      isPlatformOwner,
      companyName: session.companyName,
      businessType: session.businessType,
      planStatus: session.planStatus || 'inactive',
      monthlyFee: session.monthlyFee,
      nextBillingDate: session.nextBillingDate,
    };

    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.auth.role !== 'admin' && !req.auth.isPlatformOwner) {
    res.status(403).json({ message: 'Acesso permitido apenas para administradores.' });
    return;
  }
  next();
}

async function requireActiveSubscription(req, res, next) {
  if (req.auth.isPlatformOwner) return next();

  if (req.auth.planStatus !== 'active') {
    res.status(402).json({ message: 'Plano inativo. Regularize a assinatura para continuar.' });
    return;
  }

  if (req.auth.nextBillingDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(req.auth.nextBillingDate);
    due.setHours(0, 0, 0, 0);

    if (!Number.isNaN(due.getTime()) && today > due) {
      await subscriptionModel.setPlanStatusByCompany(req.auth.companyId, 'inactive');
      res.status(402).json({ message: 'Assinatura vencida. Plano bloqueado ate regularizacao.' });
      return;
    }
  }

  next();
}

function requirePlatformOwner(req, res, next) {
  if (!req.auth.isPlatformOwner) {
    res.status(403).json({ message: 'Acesso permitido apenas para dono da plataforma.' });
    return;
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireActiveSubscription,
  requirePlatformOwner,
};
