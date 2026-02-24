const db = require('../utils/db');

function create({
  companyId,
  clientName,
  vehiclePlate,
  vehicleModel,
  phone,
  serviceId,
  teamMemberId,
  appointmentDate,
  appointmentTime,
  status = 'aguardando',
  price = 0,
  notes,
}) {
  return db.run(
    `INSERT INTO appointments (
      company_id, client_name, vehicle_plate, vehicle_model, phone,
      service_id, team_member_id, appointment_date, appointment_time, status, price, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyId,
      clientName,
      vehiclePlate || null,
      vehicleModel || null,
      phone || null,
      serviceId || null,
      teamMemberId || null,
      appointmentDate,
      appointmentTime,
      status,
      Number(price),
      notes || null,
    ]
  );
}

function listByCompany(companyId, { status, search }) {
  let sql = `SELECT a.id, a.client_name AS clientName, a.vehicle_plate AS vehiclePlate,
                    a.vehicle_model AS vehicleModel, a.phone, a.service_id AS serviceId,
                    a.team_member_id AS teamMemberId, a.appointment_date AS appointmentDate,
                    a.appointment_time AS appointmentTime, a.status, a.price, a.notes,
                    s.name AS serviceName,
                    t.name AS teamMemberName
             FROM appointments a
             LEFT JOIN wash_services s ON s.id = a.service_id
             LEFT JOIN team_members t ON t.id = a.team_member_id
             WHERE a.company_id = ?`;

  const params = [companyId];

  if (status && status !== 'todos') {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`;
    sql += ' AND (a.client_name LIKE ? OR a.vehicle_plate LIKE ? OR a.phone LIKE ?)';
    params.push(pattern, pattern, pattern);
  }

  sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

  return db.all(sql, params);
}

function updateById(companyId, appointmentId, payload) {
  return db.run(
    `UPDATE appointments
     SET client_name = ?, vehicle_plate = ?, vehicle_model = ?, phone = ?,
         service_id = ?, team_member_id = ?, appointment_date = ?, appointment_time = ?,
         status = ?, price = ?, notes = ?
     WHERE company_id = ? AND id = ?`,
    [
      payload.clientName,
      payload.vehiclePlate || null,
      payload.vehicleModel || null,
      payload.phone || null,
      payload.serviceId || null,
      payload.teamMemberId || null,
      payload.appointmentDate,
      payload.appointmentTime,
      payload.status,
      Number(payload.price),
      payload.notes || null,
      companyId,
      appointmentId,
    ]
  );
}

function updateStatus(companyId, appointmentId, status) {
  return db.run(
    'UPDATE appointments SET status = ? WHERE company_id = ? AND id = ?',
    [status, companyId, appointmentId]
  );
}

function deleteById(companyId, appointmentId) {
  return db.run('DELETE FROM appointments WHERE company_id = ? AND id = ?', [companyId, appointmentId]);
}

module.exports = {
  create,
  listByCompany,
  updateById,
  updateStatus,
  deleteById,
};
