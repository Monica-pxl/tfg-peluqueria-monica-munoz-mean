const Servicio = require('../models/servicio');

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

// Obtener un servicio por ID
exports.getServicioById = async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).populate('centro', 'nombre direccion');
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json(servicio);
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({ error: 'Error al obtener servicio' });
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
    const servicio = await Servicio.findByIdAndDelete(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json({ mensaje: 'Servicio eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};

// Obtener servicios por centro
exports.getServiciosByCentro = async (req, res) => {
  try {
    const servicios = await Servicio.find({ centro: req.params.centroId }).populate('centro', 'nombre direccion');
    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios por centro:', error);
    res.status(500).json({ error: 'Error al obtener servicios por centro' });
  }
};
