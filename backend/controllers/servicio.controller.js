const mongoose = require('mongoose');
const Servicio = require('../models/servicio');
const ProfesionalServicio = require('../models/profesionalServicio');

// Obtener todos los servicios
exports.getAllServicios = async (req, res) => {
  try {
    const servicios = await Servicio.find().populate('centro', 'nombre direccion').sort({ nombre: 1 });
    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};


// Crear un servicio
exports.createServicio = async (req, res) => {
  try {
    const { nombre, descripcion, duracion, precio, centro, imagen } = req.body;

    if (!nombre || !centro) {
      return res.status(400).json({ error: 'Nombre y centro son obligatorios' });
    }

    const nuevoServicio = new Servicio({
      nombre,
      descripcion,
      duracion,
      precio,
      centro,
      imagen
    });

    await nuevoServicio.save();
    const servicioConCentro = await Servicio.findById(nuevoServicio._id).populate('centro', 'nombre direccion');

    res.status(201).json(servicioConCentro);
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

// Actualizar un servicio
exports.updateServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('centro', 'nombre direccion');

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

// Eliminar un servicio
exports.deleteServicio = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ ========================================');
    console.log('🗑️ ELIMINANDO SERVICIO');
    console.log('🗑️ ID recibido:', id);

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ error: 'ID de servicio no válido' });
    }

    // PASO 1: Buscar todas las relaciones antes de eliminar
    const relacionesExistentes = await ProfesionalServicio.find({ servicio: id });
    console.log('📋 Relaciones encontradas ANTES de eliminar:', relacionesExistentes.length);
    relacionesExistentes.forEach((rel, index) => {
      console.log(`   ${index + 1}. Profesional: ${rel.profesional}, Servicio: ${rel.servicio}`);
    });

    // PASO 2: Eliminar todas las relaciones profesional_servicio asociadas a este servicio
    const relacionesEliminadas = await ProfesionalServicio.deleteMany({ servicio: id });
    console.log(`✅ Relaciones ELIMINADAS: ${relacionesEliminadas.deletedCount}`);

    // PASO 3: Verificar que se eliminaron
    const relacionesRestantes = await ProfesionalServicio.find({ servicio: id });
    console.log('📋 Relaciones RESTANTES después de eliminar:', relacionesRestantes.length);

    // PASO 4: Eliminar el servicio
    const servicio = await Servicio.findByIdAndDelete(id);

    if (!servicio) {
      console.log('❌ Servicio no encontrado con _id:', id);
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    console.log('✅ Servicio eliminado:', servicio.nombre);
    console.log('🗑️ ========================================');

    res.json({
      mensaje: 'Servicio eliminado exitosamente',
      relacionesEliminadas: relacionesEliminadas.deletedCount,
      nombreServicio: servicio.nombre
    });
  } catch (error) {
    console.error('❌ Error al eliminar servicio:', error);
    res.status(500).json({ error: 'Error al eliminar servicio', detalle: error.message });
  }
};

