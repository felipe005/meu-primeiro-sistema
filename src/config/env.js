const path = require('path');

module.exports = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'dados.db'),
  sessionDays: Number(process.env.SESSION_DAYS) || 7,
};
