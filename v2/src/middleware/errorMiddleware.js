function notFound(req, res) {
  res.status(404).json({ message: 'Rota nao encontrada.' });
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  if (error.name === 'ZodError') {
    res.status(400).json({ message: error.issues?.[0]?.message || 'Dados invalidos.' });
    return;
  }

  if (error.code === '23505') {
    res.status(409).json({ message: 'Registro duplicado.' });
    return;
  }

  if (error.code === '22P02') {
    res.status(400).json({ message: 'Parametro invalido.' });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(error);
  res.status(status).json({ message: error.message || 'Erro interno do servidor.' });
}

module.exports = {
  notFound,
  errorHandler,
};
