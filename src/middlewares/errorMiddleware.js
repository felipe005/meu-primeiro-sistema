function notFoundHandler(_req, res) {
  res.status(404).json({ message: 'Rota nao encontrada.' });
}

function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Erro interno do servidor.' });
}

module.exports = { notFoundHandler, errorHandler };
