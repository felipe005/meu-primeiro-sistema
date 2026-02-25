const companyModel = require('../models/companyModel');
const userModel = require('../models/userModel');
const subscriptionModel = require('../models/subscriptionModel');
const sessionModel = require('../models/sessionModel');
const db = require('../utils/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateSessionToken, expiresAtISOString } = require('../utils/session');

const cookieOptions = 'HttpOnly; Path=/; SameSite=Lax';
const DEFAULT_PIX_KEY = '71275808123';

async function register(req, res, next) {
  try {
    const {
      companyName,
      businessType = 'Lava-Jato',
      adminName,
      email,
      password,
      monthlyFee = 99.9,
      planStatus = 'active',
      pixKey = DEFAULT_PIX_KEY,
      nextBillingDate,
    } = req.body;

    if (!companyName || !adminName || !email || !password) {
      res.status(400).json({ message: 'Preencha companyName, adminName, email e password.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'A senha precisa ter no minimo 6 caracteres.' });
      return;
    }

    const existing = await userModel.findByEmail(email.toLowerCase());
    if (existing) {
      res.status(409).json({ message: 'Email ja cadastrado.' });
      return;
    }

    await db.transaction(async () => {
      const company = await companyModel.create({ name: companyName, businessType });
      const passwordHash = hashPassword(password);
      await userModel.create({
        companyId: company.id,
        name: adminName,
        email: email.toLowerCase(),
        passwordHash,
        role: 'admin',
        active: 1,
      });
      await subscriptionModel.create({
        companyId: company.id,
        monthlyFee: Number(monthlyFee),
        planStatus: planStatus === 'inactive' ? 'inactive' : 'active',
        pixKey: pixKey || DEFAULT_PIX_KEY,
        nextBillingDate: nextBillingDate || null,
      });
    });

    res.status(201).json({ message: 'Empresa cadastrada com sucesso.' });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Informe email e password.' });
      return;
    }

    const user = await userModel.findByEmail(email.toLowerCase());
    if (!user || !verifyPassword(password, user.password_hash) || user.active !== 1) {
      res.status(401).json({ message: 'Credenciais invalidas.' });
      return;
    }

    const token = generateSessionToken();
    const expiresAt = expiresAtISOString();
    await sessionModel.create({ token, userId: user.id, expiresAt });

    const maxAgeSeconds = 60 * 60 * 24 * 7;
    res.setHeader('Set-Cookie', `session_token=${token}; ${cookieOptions}; Max-Age=${maxAgeSeconds}`);
    res.json({ message: 'Login realizado com sucesso.' });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.auth?.token;
    if (token) {
      await sessionModel.deleteByToken(token);
    }
    res.setHeader('Set-Cookie', 'session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    res.json({ message: 'Logout realizado.' });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({
    user: {
      id: req.auth.userId,
      name: req.auth.name,
      email: req.auth.email,
      role: req.auth.role,
    },
    company: {
      id: req.auth.companyId,
      name: req.auth.companyName,
      businessType: req.auth.businessType,
    },
    subscription: {
      planStatus: req.auth.planStatus,
      monthlyFee: req.auth.monthlyFee,
      nextBillingDate: req.auth.nextBillingDate,
    },
  });
}

module.exports = {
  register,
  login,
  logout,
  me,
};
