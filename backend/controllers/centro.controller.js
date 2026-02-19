const Centro = require('../models/centro');
const Profesional = require('../models/profesional');
const Servicio = require('../models/servicio');


// Obtener todos los centros
exports.getAllCentros = async (req, res) => {
  try {
    const centros = await Centro.find().sort({ nombre: 1 });
    res.json(centros);
  } catch (error) {
    console.error('Error al obtener centros:', error);
    res.status(500).json({ error: 'Error al obtener centros' });
  }
};

// Obtener un centro por ID
exports.getCentroById = async (req, res) => {
  try {
    const centro = await Centro.findById(req.params.id);
    if (!centro) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }
    res.json(centro);
  } catch (error) {
    console.error('Error al obtener centro:', error);
    res.status(500).json({ error: 'Error al obtener centro' });
  }
};

// Crear un centro
exports.createCentro = async (req, res) => {
  try {
    const { nombre, direccion, telefono, email, horario_apertura, horario_cierre } = req.body;

    console.log('📝 Creando centro con datos:', { nombre, direccion, telefono, email, horario_apertura, horario_cierre });

    if (!nombre || !direccion || !telefono || !email || !horario_apertura || !horario_cierre) {
      console.log('❌ Faltan campos obligatorios:', {
        nombre: !!nombre,
        direccion: !!direccion,
        telefono: !!telefono,
        email: !!email,
        horario_apertura: !!horario_apertura,
        horario_cierre: !!horario_cierre
      });
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const nuevoCentro = new Centro({
      nombre,
      direccion,
      telefono,
      email,
      horario_apertura,
      horario_cierre
    });

    await nuevoCentro.save();
    console.log('✅ Centro guardado con _id:', nuevoCentro._id);

    res.status(201).json(nuevoCentro);
  } catch (error) {
    console.error('❌ Error al crear centro:', error);
    res.status(500).json({ error: 'Error al crear centro' });
  }
};

// Actualizar un centro
exports.updateCentro = async (req, res) => {
  try {
    const centro = await Centro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!centro) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    res.json(centro);
  } catch (error) {
    console.error('Error al actualizar centro:', error);
    res.status(500).json({ error: 'Error al actualizar centro' });
  }
};

// Eliminar un centro
exports.deleteCentro = async (req, res) => {
  try {
    // Verificar si hay profesionales asignados a este centro
    const profesionales = await Profesional.find({ centro: req.params.id });
    if (profesionales.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el centro porque tiene profesionales asignados',
        profesionalesAsignados: profesionales.length
      });
    }

    // Verificar si hay servicios asignados a este centro
    const servicios = await Servicio.find({ centro: req.params.id });
    if (servicios.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el centro porque tiene servicios asignados',
        serviciosAsignados: servicios.length
      });
    }

    const centro = await Centro.findByIdAndDelete(req.params.id);
    if (!centro) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    res.json({ mensaje: 'Centro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar centro:', error);
    res.status(500).json({ error: 'Error al eliminar centro' });
  }
};
