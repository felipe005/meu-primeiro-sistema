const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Token nao informado.' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalido ou expirado.' });
  }
}

module.exports = {
  requireAuth,
};
