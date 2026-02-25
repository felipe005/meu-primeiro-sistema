const { app } = require('./app');
const { validateEnv, env } = require('./config/env');
const { pool } = require('./database/pool');

async function bootstrap() {
  validateEnv();
  await pool.query('SELECT 1');

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor v2 rodando na porta ${env.port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Falha ao iniciar aplicacao v2:', error.message);
  process.exit(1);
});
