const Notificacion = require('../models/notificacion');


// Obtener notificaciones por usuario
exports.getNotificacionesByUsuario = async (req, res) => {
  try {
    const { rol, id_usuario } = req.usuario;

    if (rol !== 'admin' && id_usuario.toString() !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver las notificaciones de otro usuario' });
    }

    const notificaciones = await Notificacion.find({ usuario: req.params.id })
      .sort({ createdAt: -1 });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones por usuario:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones por usuario' });
  }
};

// Obtener notificaciones no leídas por usuario
exports.getNotificacionesNoLeidas = async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({
      usuario: req.params.id,
      leida: false
    }).sort({ createdAt: -1 });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones no leídas:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones no leídas' });
  }
};

// Contar notificaciones no leídas
exports.contarNotificacionesNoLeidas = async (req, res) => {
  try {
    const count = await Notificacion.countDocuments({
      usuario: req.params.id,
      leida: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
};

// Crear una notificación
exports.createNotificacion = async (req, res) => {
  try {
    const { usuario, titulo, mensaje, tipo } = req.body;

    if (!usuario || !titulo || !mensaje) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const nuevaNotificacion = new Notificacion({
      usuario,
      titulo,
      mensaje,
      tipo: tipo || 'info',
      leida: false
    });

    await nuevaNotificacion.save();
    const notificacionCompleta = await Notificacion.findById(nuevaNotificacion._id)
      .populate('usuario', 'nombre email');

    res.status(201).json(notificacionCompleta);
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
};

// Marcar notificación como leída
exports.marcarComoLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(
      req.params.id,
      { leida: true },
      { new: true }
    ).populate('usuario', 'nombre email');

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json(notificacion);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
};

// Marcar todas las notificaciones de un usuario como leídas
exports.marcarTodasComoLeidas = async (req, res) => {
  try {
    const result = await Notificacion.updateMany(
      { usuario: req.params.id, leida: false },
      { leida: true }
    );
    res.json({ mensaje: `${result.modifiedCount} notificaciones marcadas como leídas` });
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    res.status(500).json({ error: 'Error al marcar todas como leídas' });
  }
};

// Eliminar una notificación
exports.deleteNotificacion = async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndDelete(req.params.id);
    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json({ mensaje: 'Notificación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};

// Eliminar todas las notificaciones de un usuario
exports.deleteNotificacionesByUsuario = async (req, res) => {
  try {
    const result = await Notificacion.deleteMany({ usuario: req.params.id });
    res.json({ mensaje: `${result.deletedCount} notificaciones eliminadas` });
  } catch (error) {
    console.error('Error al eliminar notificaciones por usuario:', error);
    res.status(500).json({ error: 'Error al eliminar notificaciones por usuario' });
  }
};
