const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const orderRoutes = require('./orderRoutes');
const productionRoutes = require('./productionRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/production', productionRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
