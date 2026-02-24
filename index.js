const app = require('./src/app');
const { initDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor SaaS rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Falha ao iniciar banco de dados:', error);
    process.exit(1);
  });
