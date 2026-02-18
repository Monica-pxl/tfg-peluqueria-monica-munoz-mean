const Centro = require('../models/centro');

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
    const { nombre, direccion, telefono, horario } = req.body;

    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'Nombre y dirección son obligatorios' });
    }

    const nuevoCentro = new Centro({
      nombre,
      direccion,
      telefono,
      horario
    });

    await nuevoCentro.save();
    res.status(201).json(nuevoCentro);
  } catch (error) {
    console.error('Error al crear centro:', error);
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
