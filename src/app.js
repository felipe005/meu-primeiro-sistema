const path = require('path');
const express = require('express');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

require('dotenv').config();

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.use('/api', routes);

  app.get('/', (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

  app.get('/app', (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'app.html'));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
