const Usuario = require('../models/usuario');

// Verifica que el usuario del token siga activo en la BD
module.exports = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id_usuario).select('estado');
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    if (usuario.estado !== 'activo') {
      return res.status(403).json({ error: 'Tu cuenta está inactiva. Contacta con un administrador.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar el estado del usuario' });
  }
};
