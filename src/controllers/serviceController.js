const serviceModel = require('../models/serviceModel');

async function listServices(req, res, next) {
  try {
    const items = await serviceModel.listByCompany(req.auth.companyId);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function createService(req, res, next) {
  try {
    const { name, price, durationMinutes, active = 1 } = req.body;
    if (!name || price === undefined || !durationMinutes) {
      res.status(400).json({ message: 'Preencha name, price e durationMinutes.' });
      return;
    }

    const created = await serviceModel.create({
      companyId: req.auth.companyId,
      name,
      price,
      durationMinutes,
      active,
    });

    res.status(201).json({ id: created.id, message: 'Servico criado.' });
  } catch (error) {
    next(error);
  }
}

async function updateService(req, res, next) {
  try {
    const { name, price, durationMinutes, active = 1 } = req.body;
    if (!name || price === undefined || !durationMinutes) {
      res.status(400).json({ message: 'Preencha name, price e durationMinutes.' });
      return;
    }

    const result = await serviceModel.updateById(req.auth.companyId, Number(req.params.id), {
      name,
      price,
      durationMinutes,
      active,
    });

    if (!result.changes) {
      res.status(404).json({ message: 'Servico nao encontrado.' });
      return;
    }

    res.json({ message: 'Servico atualizado.' });
  } catch (error) {
    next(error);
  }
}

async function deleteService(req, res, next) {
  try {
    const result = await serviceModel.deleteById(req.auth.companyId, Number(req.params.id));
    if (!result.changes) {
      res.status(404).json({ message: 'Servico nao encontrado.' });
      return;
    }
    res.json({ message: 'Servico removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listServices,
  createService,
  updateService,
  deleteService,
};
