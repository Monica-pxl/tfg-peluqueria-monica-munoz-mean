const ProfesionalServicio = require('../models/profesionalServicio');

// Obtener todas las relaciones
exports.getAllRelaciones = async (req, res) => {
  try {
    const relaciones = await ProfesionalServicio.find()
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio');
    res.json(relaciones);
  } catch (error) {
    console.error('Error al obtener relaciones:', error);
    res.status(500).json({ error: 'Error al obtener relaciones' });
  }
};


// Crear una relación
exports.createRelacion = async (req, res) => {
  try {
    const { profesional, servicio } = req.body;

    if (!profesional || !servicio) {
      return res.status(400).json({ error: 'Profesional y servicio son obligatorios' });
    }

    // Verificar si ya existe la relación
    const existeRelacion = await ProfesionalServicio.findOne({ profesional, servicio });
    if (existeRelacion) {
      return res.status(400).json({ error: 'La relación ya existe' });
    }

    const nuevaRelacion = new ProfesionalServicio({
      profesional,
      servicio
    });

    await nuevaRelacion.save();
    const relacionCompleta = await ProfesionalServicio.findById(nuevaRelacion._id)
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio');

    res.status(201).json(relacionCompleta);
  } catch (error) {
    console.error('Error al crear relación:', error);
    res.status(500).json({ error: 'Error al crear relación' });
  }
};

// Eliminar una relación
exports.deleteRelacion = async (req, res) => {
  try {
    const relacion = await ProfesionalServicio.findByIdAndDelete(req.params.id);
    if (!relacion) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    res.json({ mensaje: 'Relación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar relación:', error);
    res.status(500).json({ error: 'Error al eliminar relación' });
  }
};

// Eliminar todas las relaciones de un profesional
exports.deleteRelacionesByProfesional = async (req, res) => {
  try {
    const result = await ProfesionalServicio.deleteMany({ profesional: req.params.profesionalId });
    res.json({ mensaje: `${result.deletedCount} relaciones eliminadas` });
  } catch (error) {
    console.error('Error al eliminar relaciones por profesional:', error);
    res.status(500).json({ error: 'Error al eliminar relaciones por profesional' });
  }
};

// Eliminar todas las relaciones de un servicio
exports.deleteRelacionesByServicio = async (req, res) => {
  try {
    const result = await ProfesionalServicio.deleteMany({ servicio: req.params.servicioId });
    res.json({ mensaje: `${result.deletedCount} relaciones eliminadas` });
  } catch (error) {
    console.error('Error al eliminar relaciones por servicio:', error);
    res.status(500).json({ error: 'Error al eliminar relaciones por servicio' });
  }
};
