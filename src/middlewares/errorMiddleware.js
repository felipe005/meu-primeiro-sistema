function notFoundHandler(_req, res) {
  res.status(404).json({ message: 'Rota não encontrada.' });
}

function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Imagem muito grande. Máximo de 8 MB.' });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Erro interno do servidor.' });
}

module.exports = { notFoundHandler, errorHandler };
