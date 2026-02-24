const userModel = require('../models/userModel');
const { hashPassword } = require('../utils/password');

async function listUsers(req, res, next) {
  try {
    const users = await userModel.listByCompany(req.auth.companyId);
    res.json(users);
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role = 'member', active = 1 } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Preencha name, email e password.' });
      return;
    }

    if (!['admin', 'member'].includes(role)) {
      res.status(400).json({ message: 'role invalido.' });
      return;
    }

    const existing = await userModel.findByEmail(email.toLowerCase());
    if (existing) {
      res.status(409).json({ message: 'Email ja cadastrado.' });
      return;
    }

    const passwordHash = hashPassword(password);
    const created = await userModel.create({
      companyId: req.auth.companyId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      active: active ? 1 : 0,
    });

    res.status(201).json({ id: created.id, message: 'Usuario criado.' });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { name, email, role = 'member', active = 1, password } = req.body;

    if (!name || !email) {
      res.status(400).json({ message: 'Preencha name e email.' });
      return;
    }

    if (!['admin', 'member'].includes(role)) {
      res.status(400).json({ message: 'role invalido.' });
      return;
    }

    const existing = await userModel.findByEmail(email.toLowerCase());
    if (existing && existing.id !== userId) {
      res.status(409).json({ message: 'Email ja cadastrado.' });
      return;
    }

    const passwordHash = password ? hashPassword(password) : undefined;
    const result = await userModel.updateById(req.auth.companyId, userId, {
      name,
      email: email.toLowerCase(),
      role,
      active: active ? 1 : 0,
      passwordHash,
    });

    if (!result.changes) {
      res.status(404).json({ message: 'Usuario nao encontrado.' });
      return;
    }

    res.json({ message: 'Usuario atualizado.' });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (userId === req.auth.userId) {
      res.status(400).json({ message: 'Nao e permitido excluir o proprio usuario.' });
      return;
    }

    const result = await userModel.deleteById(req.auth.companyId, userId);
    if (!result.changes) {
      res.status(404).json({ message: 'Usuario nao encontrado.' });
      return;
    }

    res.json({ message: 'Usuario removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
