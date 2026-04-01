const Centro = require('../models/centro');
const Profesional = require('../models/profesional');
const Servicio = require('../models/servicio');
const Horario = require('../models/horario');


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
      return res.status(400).json({ error: 'Nombre, dirección, teléfono, email, horario de apertura y horario de cierre son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    // Validar formato de teléfono (9 dígitos numéricos)
    if (/[^0-9]/.test(telefono)) {
      return res.status(400).json({ error: 'El teléfono solo debe contener números' });
    }
    if (!/^[0-9]{9}$/.test(telefono)) {
      return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos' });
    }

    // Validar que el horario de cierre sea posterior al de apertura
    if (horario_cierre <= horario_apertura) {
      return res.status(400).json({ error: 'El horario de cierre debe ser posterior al de apertura' });
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
    const { nombre, direccion, telefono, email, horario_apertura, horario_cierre } = req.body;

    // Validar que los campos de texto no lleguen vacíos si se envían
    if (nombre !== undefined && !nombre) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    if (direccion !== undefined && !direccion) {
      return res.status(400).json({ error: 'La dirección no puede estar vacía' });
    }
    if (horario_apertura !== undefined && !horario_apertura) {
      return res.status(400).json({ error: 'El horario de apertura no puede estar vacío' });
    }
    if (horario_cierre !== undefined && !horario_cierre) {
      return res.status(400).json({ error: 'El horario de cierre no puede estar vacío' });
    }

    // Validar formato de email si se envía
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'El formato del email no es válido' });
      }
    }

    // Validar formato de teléfono si se envía
    if (telefono !== undefined) {
      if (/[^0-9]/.test(telefono)) {
        return res.status(400).json({ error: 'El teléfono solo debe contener números' });
      }
      if (!/^[0-9]{9}$/.test(telefono)) {
        return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos' });
      }
    }

    // Validar horarios si se envía alguno
    if (horario_apertura !== undefined || horario_cierre !== undefined) {
      const centroActual = await Centro.findById(req.params.id);
      if (!centroActual) {
        return res.status(404).json({ error: 'Centro no encontrado' });
      }
      const aperturaFinal = horario_apertura || centroActual.horario_apertura;
      const cierreFinal = horario_cierre || centroActual.horario_cierre;
      if (cierreFinal <= aperturaFinal) {
        return res.status(400).json({ error: 'El horario de cierre debe ser posterior al de apertura' });
      }

      // Verificar que ningún horario de profesional quede fuera del nuevo rango
      const profesionalesDelCentro = await Profesional.find({ centro: req.params.id });
      if (profesionalesDelCentro.length > 0) {
        const idsProfesionales = profesionalesDelCentro.map(p => p._id);
        const horariosDelCentro = await Horario.find({ profesional: { $in: idsProfesionales } });
        const conflictos = horariosDelCentro.filter(h =>
          h.hora_inicio < aperturaFinal || h.hora_fin > cierreFinal
        );
        if (conflictos.length > 0) {
          return res.status(400).json({
            error: `No se puede actualizar el horario del centro porque ${conflictos.length} horario(s) de profesionales quedarían fuera del nuevo rango (${aperturaFinal} - ${cierreFinal}). Ajusta primero los horarios de los profesionales afectados.`
          });
        }
      }
    }

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
