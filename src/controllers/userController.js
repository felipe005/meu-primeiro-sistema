const bcrypt = require('bcrypt');
const { asyncHandler } = require('../utils/asyncHandler');
const { createUser, listUsers, findUserByEmail } = require('../models/userModel');

const ALLOWED_TYPES = new Set(['admin', 'funcionario']);

const registerUser = asyncHandler(async (req, res) => {
  const { nome, email, senha, tipo_usuario: tipoUsuario } = req.body;

  if (!nome || !email || !senha || !tipoUsuario) {
    return res.status(400).json({ message: 'Todos os campos sao obrigatorios.' });
  }

  if (!ALLOWED_TYPES.has(tipoUsuario)) {
    return res.status(400).json({ message: 'tipo_usuario deve ser admin ou funcionario.' });
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    return res.status(409).json({ message: 'Email ja cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const user = await createUser({ nome, email, senhaHash, tipoUsuario });

  return res.status(201).json(user);
});

const getUsers = asyncHandler(async (_req, res) => {
  const users = await listUsers();
  return res.json(users);
});

module.exports = { registerUser, getUsers };
