function notFound(req, res) {
  res.status(404).json({ message: 'Rota nao encontrada.' });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  if (error?.status && error?.message) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error?.code === 'SQLITE_CONSTRAINT' || String(error?.message || '').includes('UNIQUE constraint failed')) {
    res.status(409).json({ message: 'Conflito de dados: ja existe um registro com esses valores.' });
    return;
  }

  res.status(500).json({ message: 'Erro interno do servidor.' });
}

module.exports = {
  notFound,
  errorHandler,
};
