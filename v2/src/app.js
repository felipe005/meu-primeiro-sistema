const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { env } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'views', 'app.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = {
  app,
};
