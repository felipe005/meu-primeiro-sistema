const sessionModel = require('../models/sessionModel');
const { parseCookies } = require('../utils/cookies');

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

    req.auth = {
      token,
      userId: session.userId,
      companyId: session.companyId,
      name: session.name,
      email: session.email,
      role: session.role,
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
  if (req.auth.role !== 'admin') {
    res.status(403).json({ message: 'Acesso permitido apenas para administradores.' });
    return;
  }
  next();
}

function requireActiveSubscription(req, res, next) {
  if (req.auth.planStatus !== 'active') {
    res.status(402).json({ message: 'Plano inativo. Regularize a assinatura para continuar.' });
    return;
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireActiveSubscription,
};
