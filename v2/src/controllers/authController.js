const { ZodError } = require('zod');
const authService = require('../services/authService');
const { ok } = require('../utils/apiResponse');

async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    ok(res, {
      message: 'Empresa cadastrada com sucesso.',
      empresa: result.company,
      token: result.token,
    }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Dados invalidos.' });
      return;
    }
    throw error;
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    ok(res, result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Dados invalidos.' });
      return;
    }
    throw error;
  }
}

module.exports = {
  register,
  login,
};
