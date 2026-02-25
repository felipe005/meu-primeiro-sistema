const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const companyModel = require('../models/companyModel');
const { env } = require('../config/env');
const { trialExpirationDate } = require('../utils/date');

const registerSchema = z.object({
  nome: z.string().trim().min(2, 'Nome da empresa deve ter ao menos 2 caracteres.'),
  email: z.string().trim().email('Email invalido.'),
  senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Email invalido.'),
  senha: z.string().min(1, 'Senha obrigatoria.'),
});

function createToken(company) {
  const payload = {
    empresaId: company.id,
    email: company.email,
    plano: company.plano,
    statusAssinatura: company.status_assinatura || company.statusAssinatura,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function register(input) {
  const parsed = registerSchema.parse(input);
  const email = parsed.email.toLowerCase();

  const exists = await companyModel.findByEmail(email);
  if (exists) {
    const error = new Error('Email ja cadastrado para outra empresa.');
    error.status = 409;
    throw error;
  }

  const senhaHash = await bcrypt.hash(parsed.senha, 10);
  const company = await companyModel.createCompany({
    nome: parsed.nome,
    email,
    senhaHash,
    plano: 'trial',
    statusAssinatura: 'trial',
    dataVencimento: trialExpirationDate(7),
  });

  const token = createToken(company);
  return { company, token };
}

async function login(input) {
  const parsed = loginSchema.parse(input);
  const email = parsed.email.toLowerCase();
  const company = await companyModel.findByEmail(email);

  if (!company) {
    const error = new Error('Credenciais invalidas.');
    error.status = 401;
    throw error;
  }

  const validPassword = await bcrypt.compare(parsed.senha, company.senha_hash);
  if (!validPassword) {
    const error = new Error('Credenciais invalidas.');
    error.status = 401;
    throw error;
  }

  const token = createToken(company);
  return {
    token,
    company: {
      id: company.id,
      nome: company.nome,
      email: company.email,
      plano: company.plano,
      statusAssinatura: company.status_assinatura,
      dataVencimento: company.data_vencimento,
    },
  };
}

module.exports = {
  register,
  login,
};
