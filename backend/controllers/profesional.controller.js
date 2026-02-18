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
    // Aceptar tanto 'usuario' como 'id_usuario' para compatibilidad
    const { nombre, apellidos, usuario, id_usuario, centro } = req.body;
    const usuarioId = usuario || id_usuario;

    console.log('📝 Creando profesional con datos:', { nombre, apellidos, usuario: usuarioId, centro });

    if (!nombre || !apellidos || !usuarioId) {
      console.log('❌ Faltan campos obligatorios:', { nombre: !!nombre, apellidos: !!apellidos, usuario: !!usuarioId });
      return res.status(400).json({ error: 'Nombre, apellidos y usuario son obligatorios' });
    }

    const nuevoProfesional = new Profesional({
      nombre,
      apellidos,
      usuario: usuarioId,
      centro
    });

    await nuevoProfesional.save();
    console.log('✅ Profesional guardado con _id:', nuevoProfesional._id);

    const profesionalCompleto = await Profesional.findById(nuevoProfesional._id)
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');

    res.status(201).json({ profesional: profesionalCompleto });
  } catch (error) {
    console.error('❌ Error al crear profesional:', error);
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
    const { id } = req.params;

    console.log('🗑️ ========================================');
    console.log('🗑️ ELIMINANDO PROFESIONAL');
    console.log('🗑️ ID recibido:', id);

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ error: 'ID de profesional no válido' });
    }

    // PASO 1: Buscar el profesional
    const profesional = await Profesional.findById(id);
    if (!profesional) {
      console.log('❌ Profesional no encontrado con _id:', id);
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    console.log(`✓ Profesional encontrado: ${profesional.nombre} ${profesional.apellidos}`);

    // PASO 2: Eliminar relaciones profesional_servicio
    const relacionesEliminadas = await ProfesionalServicio.deleteMany({ profesional: id });
    console.log(`✅ Relaciones profesional_servicio eliminadas: ${relacionesEliminadas.deletedCount}`);

    // PASO 3: Eliminar horarios del profesional
    const horariosEliminados = await Horario.deleteMany({ profesional: id });
    console.log(`✅ Horarios eliminados: ${horariosEliminados.deletedCount}`);

    // PASO 4: Actualizar/eliminar citas del profesional
    const citasActualizadas = await Cita.updateMany(
      { profesional: id, estado: { $ne: 'realizada' } },
      { $set: { estado: 'cancelada' } }
    );
    console.log(`✅ Citas actualizadas a canceladas: ${citasActualizadas.modifiedCount}`);

    // PASO 5: Eliminar el profesional
    await Profesional.findByIdAndDelete(id);
    console.log(`✅ Profesional eliminado: ${profesional.nombre} ${profesional.apellidos}`);
    console.log('🗑️ ========================================');

    res.json({
      mensaje: 'Profesional eliminado exitosamente',
      relacionesEliminadas: relacionesEliminadas.deletedCount,
      horariosEliminados: horariosEliminados.deletedCount,
      citasActualizadas: citasActualizadas.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error al eliminar profesional:', error);
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
