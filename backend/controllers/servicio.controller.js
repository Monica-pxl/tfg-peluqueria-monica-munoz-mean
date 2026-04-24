const mongoose = require('mongoose');
const Servicio = require('../models/servicio');
const ProfesionalServicio = require('../models/profesionalServicio');
const Centro = require('../models/centro');

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

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!descripcion) {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }
    if (!duracion) {
      return res.status(400).json({ error: 'La duración es obligatoria' });
    }
    if (!precio) {
      return res.status(400).json({ error: 'El precio es obligatorio' });
    }
    if (!centro) {
      return res.status(400).json({ error: 'El centro es obligatorio' });
    }

    if (!mongoose.Types.ObjectId.isValid(centro)) {
      return res.status(400).json({ error: 'El ID del centro no es válido' });
    }

    if (Number(duracion) < 1) {
      return res.status(400).json({ error: 'La duración debe ser al menos 1 minuto' });
    }

    if (Number(precio) < 0.01) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    // Validar URL de imagen (opcional, pero si se proporciona debe ser válida)
    if (imagen && imagen.trim() !== '') {
      const urlPattern = /^https?:\/\/.+/;
      const rutaLocalPattern = /^\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)$/i;
      if (!urlPattern.test(imagen) && !rutaLocalPattern.test(imagen)) {
        return res.status(400).json({ error: 'La imagen no es válida. Debe ser una URL (http/https) o una ruta local (/img/...)' });
      }
    }

    const centroExiste = await Centro.findById(centro);
    if (!centroExiste) {
      return res.status(404).json({ error: 'Centro no encontrado' });
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de servicio no válido' });
    }
    const { nombre, descripcion, duracion, precio, centro } = req.body;

    // Si se envían campos obligatorios, validarlos
    if (nombre !== undefined && !nombre) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    if (descripcion !== undefined && !descripcion) {
      return res.status(400).json({ error: 'La descripción no puede estar vacía' });
    }
    if (duracion !== undefined && !duracion) {
      return res.status(400).json({ error: 'La duración no puede estar vacía' });
    }
    if (duracion !== undefined && Number(duracion) < 1) {
      return res.status(400).json({ error: 'La duración debe ser al menos 1 minuto' });
    }
    if (precio !== undefined && !precio) {
      return res.status(400).json({ error: 'El precio no puede estar vacío' });
    }
    if (precio !== undefined && Number(precio) < 0.01) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }
    if (centro !== undefined && !centro) {
      return res.status(400).json({ error: 'El centro no puede estar vacío' });
    }
    if (centro !== undefined && !mongoose.Types.ObjectId.isValid(centro)) {
      return res.status(400).json({ error: 'El ID del centro no es válido' });
    }
    if (centro) {
      const centroExiste = await Centro.findById(centro);
      if (!centroExiste) {
        return res.status(404).json({ error: 'Centro no encontrado' });
      }
    }

    // Validar URL de imagen (opcional, pero si se proporciona debe ser válida)
    const imagen = req.body.imagen;
    if (imagen && imagen.trim() !== '') {
      const urlPattern = /^https?:\/\/.+/;
      const rutaLocalPattern = /^\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)$/i;
      if (!urlPattern.test(imagen) && !rutaLocalPattern.test(imagen)) {
        return res.status(400).json({ error: 'La imagen no es válida. Debe ser una URL (http/https) o una ruta local (/img/...)' });
      }
    }

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

