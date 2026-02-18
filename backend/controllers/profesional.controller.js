const Profesional = require('../models/profesional');
const ProfesionalServicio = require('../models/profesionalServicio');
const Horario = require('../models/horario');

// Obtener todos los profesionales
exports.getAllProfesionales = async (req, res) => {
  try {
    const profesionales = await Profesional.find()
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion')
      .sort({ nombre: 1 });
    res.json(profesionales);
  } catch (error) {
    console.error('Error al obtener profesionales:', error);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
};

// Obtener un profesional por ID
exports.getProfesionalById = async (req, res) => {
  try {
    const profesional = await Profesional.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    res.json(profesional);
  } catch (error) {
    console.error('Error al obtener profesional:', error);
    res.status(500).json({ error: 'Error al obtener profesional' });
  }
};

// Obtener profesional por usuario
exports.getProfesionalByUsuario = async (req, res) => {
  try {
    const profesional = await Profesional.findOne({ usuario: req.params.usuarioId })
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    res.json(profesional);
  } catch (error) {
    console.error('Error al obtener profesional por usuario:', error);
    res.status(500).json({ error: 'Error al obtener profesional por usuario' });
  }
};

// Crear un profesional
exports.createProfesional = async (req, res) => {
  try {
    const { nombre, apellidos, usuario, centro } = req.body;

    if (!nombre || !apellidos || !usuario) {
      return res.status(400).json({ error: 'Nombre, apellidos y usuario son obligatorios' });
    }

    const nuevoProfesional = new Profesional({
      nombre,
      apellidos,
      usuario,
      centro
    });

    await nuevoProfesional.save();
    const profesionalCompleto = await Profesional.findById(nuevoProfesional._id)
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');

    res.status(201).json(profesionalCompleto);
  } catch (error) {
    console.error('Error al crear profesional:', error);
    res.status(500).json({ error: 'Error al crear profesional' });
  }
};

// Actualizar un profesional
exports.updateProfesional = async (req, res) => {
  try {
    const profesional = await Profesional.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');

    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    res.json(profesional);
  } catch (error) {
    console.error('Error al actualizar profesional:', error);
    res.status(500).json({ error: 'Error al actualizar profesional' });
  }
};

// Eliminar un profesional
exports.deleteProfesional = async (req, res) => {
  try {
    const profesional = await Profesional.findByIdAndDelete(req.params.id);
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    // Eliminar relaciones profesional-servicio
    await ProfesionalServicio.deleteMany({ profesional: req.params.id });

    // Eliminar horarios del profesional
    await Horario.deleteMany({ profesional: req.params.id });

    res.json({ mensaje: 'Profesional eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar profesional:', error);
    res.status(500).json({ error: 'Error al eliminar profesional' });
  }
};

// Obtener profesionales por centro
exports.getProfesionalesByCentro = async (req, res) => {
  try {
    const profesionales = await Profesional.find({ centro: req.params.centroId })
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');
    res.json(profesionales);
  } catch (error) {
    console.error('Error al obtener profesionales por centro:', error);
    res.status(500).json({ error: 'Error al obtener profesionales por centro' });
  }
};
