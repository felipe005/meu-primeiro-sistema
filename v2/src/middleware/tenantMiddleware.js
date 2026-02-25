function enforceTenant(req, res, next) {
  if (!req.auth?.empresaId) {
    res.status(401).json({ message: 'Empresa nao identificada no token.' });
    return;
  }

  req.tenant = {
    empresaId: Number(req.auth.empresaId),
  };

  next();
}

module.exports = {
  enforceTenant,
};
