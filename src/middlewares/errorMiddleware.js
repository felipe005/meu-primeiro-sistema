function notFound(req, res) {
  res.status(404).json({ message: 'Rota nao encontrada.' });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
}

module.exports = {
  notFound,
  errorHandler,
};
