module.exports = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
};
