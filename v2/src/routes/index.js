const express = require('express');
const authRoutes = require('./authRoutes');
const clientRoutes = require('./clientRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const serviceRoutes = require('./serviceRoutes');
const employeeRoutes = require('./employeeRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const cashRoutes = require('./cashRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const { requireAuth } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');
const { requireActiveSubscription } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lavajato-saas-v2' });
});

router.use('/auth', authRoutes);

router.get('/me', requireAuth, enforceTenant, async (req, res) => {
  res.json({
    empresaId: req.tenant.empresaId,
    email: req.auth.email,
    plano: req.auth.plano,
    statusAssinatura: req.auth.statusAssinatura,
  });
});

router.use('/assinatura', requireAuth, enforceTenant, subscriptionRoutes);

router.use(requireAuth, enforceTenant, requireActiveSubscription);
router.use('/clientes', clientRoutes);
router.use('/veiculos', vehicleRoutes);
router.use('/servicos', serviceRoutes);
router.use('/funcionarios', employeeRoutes);
router.use('/agendamentos', appointmentRoutes);
router.use('/caixa', cashRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
