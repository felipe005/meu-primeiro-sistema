const path = require('path');
const express = require('express');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const teamRoutes = require('./routes/teamRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const { requireAuth, requireAdmin, requireActiveSubscription } = require('./middlewares/authMiddleware');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'app.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', requireAuth, requireActiveSubscription, dashboardRoutes);
app.use('/api/users', requireAuth, requireActiveSubscription, requireAdmin, userRoutes);
app.use('/api/clients', requireAuth, requireActiveSubscription, clientRoutes);
app.use('/api/services', requireAuth, requireActiveSubscription, serviceRoutes);
app.use('/api/team', requireAuth, requireActiveSubscription, teamRoutes);
app.use('/api/appointments', requireAuth, requireActiveSubscription, appointmentRoutes);
app.use('/api/subscription', requireAuth, subscriptionRoutes);

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
