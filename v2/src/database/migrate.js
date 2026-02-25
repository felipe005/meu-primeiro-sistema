const fs = require('fs');
const path = require('path');
const { validateEnv } = require('../config/env');
const { pool } = require('./pool');

async function runMigrations() {
  validateEnv();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
}

runMigrations()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Migracoes aplicadas com sucesso.');
    return pool.end();
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Erro ao aplicar migracoes:', error.message);
    return pool.end().finally(() => process.exit(1));
  });
