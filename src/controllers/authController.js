const bcrypt = require('bcrypt');
const { asyncHandler } = require('../utils/asyncHandler');
const { findUserByEmail, findUserById } = require('../models/userModel');
const { issueToken } = require('../middlewares/authMiddleware');

const login = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const validPassword = await bcrypt.compare(senha, user.senha_hash);

  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
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
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  return res.json({ user });
});

module.exports = { login, me };
