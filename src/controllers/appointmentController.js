const appointmentModel = require('../models/appointmentModel');

const validStatus = ['aguardando', 'em_lavagem', 'pronto', 'entregue'];

async function listAppointments(req, res, next) {
  try {
    const rows = await appointmentModel.listByCompany(req.auth.companyId, {
      status: req.query.status,
      search: req.query.search,
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function createAppointment(req, res, next) {
  try {
    const payload = req.body;
    if (!payload.clientName || !payload.appointmentDate || !payload.appointmentTime) {
      res.status(400).json({ message: 'Preencha clientName, appointmentDate e appointmentTime.' });
      return;
    }

    const status = payload.status || 'aguardando';
    if (!validStatus.includes(status)) {
      res.status(400).json({ message: 'Status invalido.' });
      return;
    }

    const created = await appointmentModel.create({
      companyId: req.auth.companyId,
      ...payload,
      status,
    });

    res.status(201).json({ id: created.id, message: 'Agendamento criado.' });
  } catch (error) {
    next(error);
  }
}

async function updateAppointment(req, res, next) {
  try {
    const payload = req.body;
    if (!payload.clientName || !payload.appointmentDate || !payload.appointmentTime) {
      res.status(400).json({ message: 'Preencha clientName, appointmentDate e appointmentTime.' });
      return;
    }

    if (!validStatus.includes(payload.status)) {
      res.status(400).json({ message: 'Status invalido.' });
      return;
    }

    const result = await appointmentModel.updateById(req.auth.companyId, Number(req.params.id), payload);
    if (!result.changes) {
      res.status(404).json({ message: 'Agendamento nao encontrado.' });
      return;
    }

    res.json({ message: 'Agendamento atualizado.' });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!validStatus.includes(status)) {
      res.status(400).json({ message: 'Status invalido.' });
      return;
    }

    const result = await appointmentModel.updateStatus(req.auth.companyId, Number(req.params.id), status);
    if (!result.changes) {
      res.status(404).json({ message: 'Agendamento nao encontrado.' });
      return;
    }

    res.json({ message: 'Status atualizado.' });
  } catch (error) {
    next(error);
  }
}

async function deleteAppointment(req, res, next) {
  try {
    const result = await appointmentModel.deleteById(req.auth.companyId, Number(req.params.id));
    if (!result.changes) {
      res.status(404).json({ message: 'Agendamento nao encontrado.' });
      return;
    }

    res.json({ message: 'Agendamento removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAppointments,
  createAppointment,
  updateAppointment,
  updateStatus,
  deleteAppointment,
};
