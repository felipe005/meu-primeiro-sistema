const { createApp } = require('./src/app');
const { initializeDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await initializeDatabase();
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar a aplicacao:', error);
    process.exit(1);
  }
}

bootstrap();
