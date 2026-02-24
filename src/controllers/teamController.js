const teamModel = require('../models/teamModel');

async function listTeam(req, res, next) {
  try {
    const items = await teamModel.listByCompany(req.auth.companyId);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function createMember(req, res, next) {
  try {
    const { name, role, salary = 0, shiftLabel, active = 1 } = req.body;
    if (!name || !role) {
      res.status(400).json({ message: 'Preencha name e role.' });
      return;
    }

    const created = await teamModel.create({
      companyId: req.auth.companyId,
      name,
      role,
      salary,
      shiftLabel,
      active,
    });

    res.status(201).json({ id: created.id, message: 'Membro criado.' });
  } catch (error) {
    next(error);
  }
}

async function updateMember(req, res, next) {
  try {
    const { name, role, salary = 0, shiftLabel, active = 1 } = req.body;
    if (!name || !role) {
      res.status(400).json({ message: 'Preencha name e role.' });
      return;
    }

    const result = await teamModel.updateById(req.auth.companyId, Number(req.params.id), {
      name,
      role,
      salary,
      shiftLabel,
      active,
    });

    if (!result.changes) {
      res.status(404).json({ message: 'Membro nao encontrado.' });
      return;
    }

    res.json({ message: 'Membro atualizado.' });
  } catch (error) {
    next(error);
  }
}

async function deleteMember(req, res, next) {
  try {
    const result = await teamModel.deleteById(req.auth.companyId, Number(req.params.id));
    if (!result.changes) {
      res.status(404).json({ message: 'Membro nao encontrado.' });
      return;
    }

    res.json({ message: 'Membro removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTeam,
  createMember,
  updateMember,
  deleteMember,
};
