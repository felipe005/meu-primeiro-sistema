const jwt = require('jsonwebtoken');

function issueToken(user) {
  return jwt.sign(
    {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo_usuario: user.tipo_usuario
    },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token não informado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.tipo_usuario)) {
      return res.status(403).json({ message: 'Sem permissão para esta operação.' });
    }
    return next();
  };
}

module.exports = { issueToken, authenticate, authorize };
