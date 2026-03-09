const bcrypt = require('bcrypt');
const { asyncHandler } = require('../utils/asyncHandler');
const { findUserByEmail, findUserById } = require('../models/userModel');
const { issueToken } = require('../middlewares/authMiddleware');

const login = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha sao obrigatorios.' });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  const validPassword = await bcrypt.compare(senha, user.senha_hash);

  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  const token = issueToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo_usuario: user.tipo_usuario
    }
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado.' });
  }

  return res.json({ user });
});

module.exports = { login, me };
