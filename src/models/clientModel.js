const db = require('../utils/db');

function create({
  companyId,
  name,
  email,
  phone,
  vehiclePlate,
  vehicleModel,
  plateType,
  monthlyFee,
  nextDueDate,
  lastPaymentDate,
  paymentStatus,
  status,
  notes,
}) {
  return db.run(
    `INSERT INTO clients (
      company_id, name, email, phone, vehicle_plate, vehicle_model, plate_type,
      monthly_fee, next_due_date, last_payment_date, payment_status, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyId,
      name,
      email || null,
      phone || null,
      vehiclePlate || null,
      vehicleModel || null,
      plateType || 'nao_informado',
      Number(monthlyFee || 0),
      nextDueDate || null,
      lastPaymentDate || null,
      paymentStatus || 'pendente',
      status || 'lead',
      notes || null,
    ]
  );
}

function listByCompany(companyId, search = '') {
  const hasSearch = Boolean(search && search.trim());
  if (!hasSearch) {
    return db.all(
      `SELECT id, name, email, phone, vehicle_plate AS vehiclePlate, vehicle_model AS vehicleModel,
              plate_type AS plateType, monthly_fee AS monthlyFee, next_due_date AS nextDueDate,
              last_payment_date AS lastPaymentDate, payment_status AS paymentStatus, status, notes,
              created_at AS createdAt, updated_at AS updatedAt
       FROM clients
       WHERE company_id = ?
       ORDER BY created_at DESC`,
      [companyId]
    );
  }

  const pattern = `%${search.trim()}%`;
  return db.all(
    `SELECT id, name, email, phone, vehicle_plate AS vehiclePlate, vehicle_model AS vehicleModel,
            plate_type AS plateType, monthly_fee AS monthlyFee, next_due_date AS nextDueDate,
            last_payment_date AS lastPaymentDate, payment_status AS paymentStatus, status, notes,
            created_at AS createdAt, updated_at AS updatedAt
     FROM clients
     WHERE company_id = ?
       AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR vehicle_plate LIKE ?)
     ORDER BY created_at DESC`,
    [companyId, pattern, pattern, pattern, pattern]
  );
}

function findById(companyId, clientId) {
  return db.get(
    `SELECT id, name, email, phone, vehicle_plate AS vehiclePlate, vehicle_model AS vehicleModel,
            plate_type AS plateType, monthly_fee AS monthlyFee, next_due_date AS nextDueDate,
            last_payment_date AS lastPaymentDate, payment_status AS paymentStatus, status, notes,
            created_at AS createdAt, updated_at AS updatedAt
     FROM clients
     WHERE company_id = ? AND id = ?`,
    [companyId, clientId]
  );
}

function updateById(
  companyId,
  clientId,
  {
    name,
    email,
    phone,
    vehiclePlate,
    vehicleModel,
    plateType,
    monthlyFee,
    nextDueDate,
    lastPaymentDate,
    paymentStatus,
    status,
    notes,
  }
) {
  return db.run(
    `UPDATE clients
     SET name = ?, email = ?, phone = ?, vehicle_plate = ?, vehicle_model = ?, plate_type = ?,
         monthly_fee = ?, next_due_date = ?, last_payment_date = ?, payment_status = ?, status = ?, notes = ?
     WHERE company_id = ? AND id = ?`,
    [
      name,
      email || null,
      phone || null,
      vehiclePlate || null,
      vehicleModel || null,
      plateType || 'nao_informado',
      Number(monthlyFee || 0),
      nextDueDate || null,
      lastPaymentDate || null,
      paymentStatus || 'pendente',
      status || 'lead',
      notes || null,
      companyId,
      clientId,
    ]
  );
}

function deleteById(companyId, clientId) {
  return db.run('DELETE FROM clients WHERE company_id = ? AND id = ?', [companyId, clientId]);
}

function createPayment(companyId, clientId, { amount, method = 'pix', reference, paidAt }) {
  return db.run(
    `INSERT INTO client_payments (company_id, client_id, amount, method, reference, paid_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [companyId, clientId, Number(amount), method, reference || null, paidAt || new Date().toISOString()]
  );
}

function listPayments(companyId, search = '') {
  const pattern = `%${(search || '').trim()}%`;
  return db.all(
    `SELECT p.id, p.client_id AS clientId, c.name AS clientName, c.vehicle_plate AS vehiclePlate,
            p.amount, p.method, p.reference, p.paid_at AS paidAt, p.created_at AS createdAt
     FROM client_payments p
     JOIN clients c ON c.id = p.client_id AND c.company_id = p.company_id
     WHERE p.company_id = ?
       AND (? = '' OR c.name LIKE ? OR c.vehicle_plate LIKE ? OR p.reference LIKE ?)
     ORDER BY p.paid_at DESC`,
    [companyId, (search || '').trim(), pattern, pattern, pattern]
  );
}

module.exports = {
  create,
  listByCompany,
  findById,
  updateById,
  deleteById,
  createPayment,
  listPayments,
};
