const clientModel = require('../models/clientModel');

async function listClients(req, res, next) {
  try {
    const clients = await clientModel.listByCompany(req.auth.companyId, req.query.search || '');
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

async function getClient(req, res, next) {
  try {
    const client = await clientModel.findById(req.auth.companyId, Number(req.params.id));
    if (!client) {
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const { name, email, phone, status = 'lead', notes } = req.body;
    if (!name) {
      res.status(400).json({ message: 'name e obrigatorio.' });
      return;
    }

    if (!['lead', 'active', 'inactive'].includes(status)) {
      res.status(400).json({ message: 'status invalido.' });
      return;
    }

    const created = await clientModel.create({
      companyId: req.auth.companyId,
      name,
      email,
      phone,
      status,
      notes,
    });

    res.status(201).json({ id: created.id, message: 'Cliente criado.' });
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const { name, email, phone, status = 'lead', notes } = req.body;
    if (!name) {
      res.status(400).json({ message: 'name e obrigatorio.' });
      return;
    }

    if (!['lead', 'active', 'inactive'].includes(status)) {
      res.status(400).json({ message: 'status invalido.' });
      return;
    }

    const result = await clientModel.updateById(req.auth.companyId, Number(req.params.id), {
      name,
      email,
      phone,
      status,
      notes,
    });

    if (!result.changes) {
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
    }

    res.json({ message: 'Cliente atualizado.' });
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    const result = await clientModel.deleteById(req.auth.companyId, Number(req.params.id));
    if (!result.changes) {
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
    }

    res.json({ message: 'Cliente removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
};
