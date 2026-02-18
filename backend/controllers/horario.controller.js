const Horario = require('../models/horario');
const Profesional = require('../models/profesional');
const { crearNotificacion, formatearFecha } = require('../helpers/notificaciones.helper');

// Obtener todos los horarios
exports.getAllHorarios = async (req, res) => {
  try {
    const horarios = await Horario.find()
      .populate('profesional', 'nombre apellidos');
    res.json(horarios);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
};

// Obtener un horario por ID
exports.getHorarioById = async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id)
      .populate('profesional', 'nombre apellidos');
    if (!horario) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    res.json(horario);
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).json({ error: 'Error al obtener horario' });
  }
};

// Obtener horarios por profesional
exports.getHorariosByProfesional = async (req, res) => {
  try {
    const horarios = await Horario.find({ profesional: req.params.profesionalId })
      .populate('profesional', 'nombre apellidos');
    res.json(horarios);
  } catch (error) {
    console.error('Error al obtener horarios por profesional:', error);
    res.status(500).json({ error: 'Error al obtener horarios por profesional' });
  }
};

// Crear un horario
exports.createHorario = async (req, res) => {
  try {
    const { profesional, dias, hora_inicio, hora_fin, festivo, fechas_festivas } = req.body;

    if (!profesional || !dias || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const nuevoHorario = new Horario({
      profesional,
      dias,
      hora_inicio,
      hora_fin,
      festivo,
      fechas_festivas
    });

    await nuevoHorario.save();
    const horarioCompleto = await Horario.findById(nuevoHorario._id)
      .populate('profesional', 'nombre apellidos');

    // Crear notificación para el profesional
    const profesionalDB = await Profesional.findById(profesional).populate('usuario');
    if (profesionalDB && profesionalDB.usuario) {
      const diasTexto = dias.join(', ');
      await crearNotificacion(
        profesionalDB.usuario._id,
        'profesional',
        'Nuevo horario asignado',
        `Se ha añadido un nuevo horario a tu agenda: <strong>${diasTexto}</strong> de <strong>${hora_inicio}</strong> a <strong>${hora_fin}</strong>.`,
        'info'
      );
    }

    res.status(201).json(horarioCompleto);
  } catch (error) {
    console.error('Error al crear horario:', error);
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

// Actualizar un horario
exports.updateHorario = async (req, res) => {
  try {
    const horarioAnterior = await Horario.findById(req.params.id);
    if (!horarioAnterior) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    const { dias, hora_inicio, hora_fin, fechas_festivas } = req.body;

    // Detectar cambios ANTES de actualizar
    const cambioHoras = (hora_inicio && hora_inicio !== horarioAnterior.hora_inicio) ||
                        (hora_fin && hora_fin !== horarioAnterior.hora_fin);
    const cambioDias = dias && JSON.stringify(dias) !== JSON.stringify(horarioAnterior.dias);

    const fechasFestivasAntiguas = horarioAnterior.fechas_festivas || [];
    const fechasFestivasNuevas = fechas_festivas || fechasFestivasAntiguas;

    const horario = await Horario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('profesional', 'nombre apellidos');

    // Crear notificaciones para el profesional
    const profesionalDB = await Profesional.findById(horario.profesional._id).populate('usuario');
    if (profesionalDB && profesionalDB.usuario) {

      // Si cambió días o horas
      if (cambioHoras || cambioDias) {
        const diasTexto = horario.dias.join(', ');
        await crearNotificacion(
          profesionalDB.usuario._id,
          'profesional',
          'Horario actualizado',
          `Se ha modificado tu horario de trabajo: <strong>${diasTexto}</strong> de <strong>${horario.hora_inicio}</strong> a <strong>${horario.hora_fin}</strong>.`,
          'info'
        );
      }

      // Si se agregaron fechas festivas
      if (fechasFestivasNuevas.length > fechasFestivasAntiguas.length) {
        const nuevasFechas = fechasFestivasNuevas.filter(f => !fechasFestivasAntiguas.includes(f));
        if (nuevasFechas.length > 0) {
          const fechasTexto = nuevasFechas.map(f => formatearFecha(f)).join(', ');
          await crearNotificacion(
            profesionalDB.usuario._id,
            'profesional',
            'Día marcado como no laborable',
            `Se han añadido fechas festivas a tu horario: <strong>${fechasTexto}</strong>. No tendrás citas programadas en esos días.`,
            'info'
          );
        }
      }
    }

    res.json(horario);
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
};

// Eliminar un horario
exports.deleteHorario = async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id);
    if (!horario) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    // Obtener información del horario antes de eliminarlo
    const profesionalDB = await Profesional.findById(horario.profesional).populate('usuario');
    const diasTexto = horario.dias.join(', ');
    const horaInicio = horario.hora_inicio;
    const horaFin = horario.hora_fin;

    // Eliminar el horario
    await Horario.findByIdAndDelete(req.params.id);

    // Crear notificación para el profesional
    if (profesionalDB && profesionalDB.usuario) {
      await crearNotificacion(
        profesionalDB.usuario._id,
        'profesional',
        'Horario eliminado',
        `Se ha eliminado un horario de tu agenda: <strong>${diasTexto}</strong> de <strong>${horaInicio}</strong> a <strong>${horaFin}</strong>.`,
        'advertencia'
      );
    }

    res.json({ mensaje: 'Horario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
};
