const Cita = require('../models/cita');
const Usuario = require('../models/usuario');
const Profesional = require('../models/profesional');
const Servicio = require('../models/servicio');
const Centro = require('../models/centro');
const { crearNotificacion, obtenerAdministradores, getNivelFidelidad, formatearFecha } = require('../helpers/notificaciones.helper');

// Helper para agregar nombres históricos cuando las referencias son null
function agregarNombresHistoricos(cita) {
  const citaObj = typeof cita.toObject === 'function' ? cita.toObject() : cita;

  // Si usuario es null, usar nombres históricos
  if (!citaObj.usuario && (citaObj.usuarioNombre || citaObj.usuarioEmail)) {
    citaObj.usuario = {
      nombre: citaObj.usuarioNombre || '',
      email: citaObj.usuarioEmail || ''
    };
  }

  // Si profesional es null, usar nombres históricos
  if (!citaObj.profesional && (citaObj.profesionalNombre || citaObj.profesionalApellidos)) {
    citaObj.profesional = {
      nombre: citaObj.profesionalNombre || '',
      apellidos: citaObj.profesionalApellidos || ''
    };
  }

  // Si servicio es null, usar nombre histórico
  if (!citaObj.servicio && citaObj.servicioNombre) {
    citaObj.servicio = {
      nombre: citaObj.servicioNombre
    };
  }

  // Si centro es null, usar nombre histórico
  if (!citaObj.centro && citaObj.centroNombre) {
    citaObj.centro = {
      nombre: citaObj.centroNombre
    };
  }

  return citaObj;
}


// Obtener todas las citas
exports.getAllCitas = async (req, res) => {
  try {
    const citas = await Cita.find()
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion')
      .sort({ fecha: -1, hora: -1 });

    const citasConHistorico = citas.map(cita => agregarNombresHistoricos(cita));
    res.json(citasConHistorico);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// Obtener citas por usuario
exports.getCitasByUsuario = async (req, res) => {
  try {
    const { rol, id_usuario } = req.usuario;

    // Cliente: solo puede ver sus propias citas
    if (rol === 'cliente') {
      if (id_usuario.toString() !== req.params.usuarioId) {
        return res.status(403).json({ error: 'No tienes permiso para ver las citas de otro usuario' });
      }
    }

    // Profesional: ve las citas en las que él/ella aparece como profesional
    if (rol === 'profesional') {
      const profesional = await Profesional.findOne({ usuario: id_usuario });
      if (!profesional) {
        return res.status(404).json({ error: 'Profesional no encontrado' });
      }
      const citas = await Cita.find({ profesional: profesional._id })
        .populate('usuario', 'nombre email')
        .populate('profesional', 'nombre apellidos')
        .populate('servicio', 'nombre duracion precio')
        .populate('centro', 'nombre direccion')
        .sort({ fecha: -1, hora: -1 });

      const citasConHistorico = citas.map(cita => agregarNombresHistoricos(cita));
      return res.json(citasConHistorico);
    }

    // Administrador (o cliente ya validado arriba): busca por usuarioId del parámetro
    const citas = await Cita.find({ usuario: req.params.usuarioId })
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion')
      .sort({ fecha: -1, hora: -1 });

    const citasConHistorico = citas.map(cita => agregarNombresHistoricos(cita));
    res.json(citasConHistorico);
  } catch (error) {
    console.error('Error al obtener citas por usuario:', error);
    res.status(500).json({ error: 'Error al obtener citas por usuario' });
  }
};

// Obtener citas por profesional
exports.getCitasByProfesional = async (req, res) => {
  try {
    const { rol, id_usuario } = req.usuario;

    // Un profesional solo puede ver sus propias citas
    if (rol === 'profesional') {
      const profesional = await Profesional.findOne({ usuario: id_usuario });
      if (!profesional) {
        return res.status(404).json({ error: 'Profesional no encontrado' });
      }
      if (profesional._id.toString() !== req.params.profesionalId) {
        return res.status(403).json({ error: 'No tienes permiso para ver las citas de otro profesional' });
      }
    }

    const citas = await Cita.find({ profesional: req.params.profesionalId })
      .populate('usuario', 'nombre email')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion')
      .sort({ fecha: -1, hora: -1 });

    const citasConHistorico = citas.map(cita => agregarNombresHistoricos(cita));
    res.json(citasConHistorico);
  } catch (error) {
    console.error('Error al obtener citas por profesional:', error);
    res.status(500).json({ error: 'Error al obtener citas por profesional' });
  }
};

// Obtener una cita por ID
exports.getCitaById = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion');

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const { rol, id_usuario } = req.usuario;

    if (rol === 'cliente') {
      if (!cita.usuario || cita.usuario._id.toString() !== id_usuario.toString()) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta cita' });
      }
    } else if (rol === 'profesional') {
      const profesional = await Profesional.findOne({ usuario: id_usuario });
      if (!profesional) {
        return res.status(404).json({ error: 'Profesional no encontrado' });
      }
      if (!cita.profesional || cita.profesional._id.toString() !== profesional._id.toString()) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta cita' });
      }
    }

    const citaConHistorico = agregarNombresHistoricos(cita);
    res.json(citaConHistorico);
  } catch (error) {
    console.error('Error al obtener la cita:', error);
    res.status(500).json({ error: 'Error al obtener la cita' });
  }
};

// Crear una cita
exports.createCita = async (req, res) => {
  try {
    const { rol } = req.usuario;

    if (rol !== 'cliente') {
      return res.status(403).json({ error: 'Solo los clientes pueden crear citas' });
    }

    const { usuario, profesional, servicio, centro, fecha, hora } = req.body;

    if (!usuario || !profesional || !servicio || !centro || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Obtener los datos completos para guardar información histórica
    const usuarioDB = await Usuario.findById(usuario);
    if (!usuarioDB) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const servicioDB = await Servicio.findById(servicio);
    if (!servicioDB) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const profesionalDB = await Profesional.findById(profesional);
    if (!profesionalDB) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const centroDB = await Centro.findById(centro);
    if (!centroDB) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    // Verificar que no existe cita activa (pendiente/confirmada) en ese horario
    const citaDuplicada = await Cita.findOne({
      profesional,
      fecha,
      hora,
      estado: { $in: ['pendiente', 'confirmada'] }
    });
    if (citaDuplicada) {
      return res.status(400).json({ error: 'Ya existe una cita en ese horario para ese profesional' });
    }

    // Eliminar citas canceladas en ese hueco para que el índice único de MongoDB
    // no bloquee la inserción de la nueva cita
    await Cita.deleteMany({ profesional, fecha, hora, estado: 'cancelada' });

    const nuevaCita = new Cita({
      usuario,
      profesional,
      servicio,
      centro,
      fecha,
      hora,
      precio: servicioDB.precio,
      estado: 'pendiente',
      // Guardar datos históricos
      usuarioNombre: usuarioDB.nombre,
      usuarioEmail: usuarioDB.email,
      profesionalNombre: profesionalDB.nombre,
      profesionalApellidos: profesionalDB.apellidos,
      servicioNombre: servicioDB.nombre,
      centroNombre: centroDB.nombre
    });

    await nuevaCita.save();
    const citaCompleta = await Cita.findById(nuevaCita._id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion');

    // Crear notificaciones
    const fechaFormateada = formatearFecha(fecha);
    const nombreUsuario = citaCompleta.usuario.nombre;
    const nombreProfesional = citaCompleta.profesional.nombre + ' ' + citaCompleta.profesional.apellidos;
    const nombreServicio = citaCompleta.servicio.nombre;
    const nombreCentro = citaCompleta.centro.nombre;

    // 1. Notificación para el CLIENTE
    await crearNotificacion(
      usuario,
      'cliente',
      'Reserva realizada',
      `Has reservado una cita para <strong>${nombreServicio}</strong> con ${nombreProfesional} el <strong>${fechaFormateada}</strong> a las <strong>${hora}</strong>. Tu cita está <strong>pendiente de confirmación</strong>.`,
      'exito'
    );

    // 2. Notificación para el PROFESIONAL
    const profesionalData = await Profesional.findById(profesional).populate('usuario');
    if (profesionalData && profesionalData.usuario) {
      await crearNotificacion(
        profesionalData.usuario._id,
        'profesional',
        'Nueva cita reservada',
        `<strong>${nombreUsuario}</strong> ha reservado una cita para <strong>${nombreServicio}</strong> el <strong>${fechaFormateada}</strong> a las <strong>${hora}</strong>.`,
        'info'
      );
    }

    // 3. Notificación para todos los ADMINISTRADORES
    const admins = await obtenerAdministradores();
    for (const adminId of admins) {
      await crearNotificacion(
        adminId,
        'administrador',
        'Nueva reserva',
        `<strong>${nombreUsuario}</strong> reservó <strong>${nombreServicio}</strong> con ${nombreProfesional} en <strong>${nombreCentro}</strong> para el <strong>${fechaFormateada}</strong> a las <strong>${hora}</strong>.`,
        'info'
      );
    }

    res.status(201).json(citaCompleta);
  } catch (error) {
    console.error('Error al crear cita:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe una cita en ese horario para ese profesional' });
    }
    res.status(500).json({ error: 'Error al crear cita' });
  }
};

// Actualizar una cita
exports.updateCita = async (req, res) => {
  try {
    const { estado, fecha, hora, actualizadoPor, rolActualizador } = req.body;

    const cita = await Cita.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion');

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const { rol, id_usuario } = req.usuario;
    if (rol === 'cliente') {
      if (!cita.usuario || cita.usuario._id.toString() !== id_usuario.toString()) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta cita' });
      }
    } else if (rol === 'profesional') {
      const profesional = await Profesional.findOne({ usuario: id_usuario });
      if (!profesional || !cita.profesional || cita.profesional._id.toString() !== profesional._id.toString()) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta cita' });
      }
    }

    const estadoAnterior = cita.estado;

    // Validar máquina de estados
    if (estado && estado !== estadoAnterior) {
      // No se puede cambiar una cita ya realizada o cancelada
      if (estadoAnterior === 'realizada') {
        return res.status(400).json({ error: 'No se puede modificar una cita ya realizada' });
      }
      if (estadoAnterior === 'cancelada') {
        return res.status(400).json({ error: 'No se puede modificar una cita cancelada' });
      }
      // El estado "realizada" solo se puede poner desde /marcar-realizada
      if (estado === 'realizada') {
        return res.status(400).json({ error: 'Para marcar una cita como realizada usa el endpoint correspondiente' });
      }
      // No se puede volver a "pendiente"
      if (estado === 'pendiente') {
        return res.status(400).json({ error: 'No se puede revertir una cita a pendiente' });
      }
      // El cliente solo puede cancelar
      if (rol === 'cliente' && estado !== 'cancelada') {
        return res.status(403).json({ error: 'Los clientes solo pueden cancelar citas' });
      }
      // Profesional/admin: pendiente→confirmada o pendiente/confirmada→cancelada
      if ((rol === 'profesional' || rol === 'administrador') && estado === 'confirmada' && estadoAnterior !== 'pendiente') {
        return res.status(400).json({ error: 'Solo se puede confirmar una cita pendiente' });
      }
    }

    // Si se cambia fecha u hora, verificar disponibilidad
    if ((fecha && fecha !== cita.fecha) || (hora && hora !== cita.hora)) {
      const nuevaFecha = fecha || cita.fecha;
      const nuevaHora = hora || cita.hora;

      const citaExistente = await Cita.findOne({
        profesional: cita.profesional._id,
        fecha: nuevaFecha,
        hora: nuevaHora,
        _id: { $ne: req.params.id },
        estado: { $in: ['pendiente', 'confirmada'] }
      });

      if (citaExistente) {
        return res.status(400).json({ error: 'Ya existe una cita para ese profesional en ese horario' });
      }
    }

    // Actualizar campos
    if (estado) cita.estado = estado;
    if (fecha) cita.fecha = fecha;
    if (hora) cita.hora = hora;

    await cita.save();

    const citaActualizada = await Cita.findById(cita._id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion');

    // Crear notificaciones según cambios
    const fechaFormateada = formatearFecha(citaActualizada.fecha);
    const nombreUsuario = citaActualizada.usuario.nombre;
    const nombreProfesional = citaActualizada.profesional.nombre + ' ' + citaActualizada.profesional.apellidos;
    const nombreServicio = citaActualizada.servicio.nombre;

    // Si cambió el estado
    if (estado && estado !== estadoAnterior) {

      // CANCELACIÓN
      if (estado === 'cancelada') {

        // Si cancela el CLIENTE
        if (rolActualizador === 'cliente') {
          // Notificar al profesional
          const profesionalDB = await Profesional.findById(cita.profesional._id).populate('usuario');
          if (profesionalDB && profesionalDB.usuario) {
            await crearNotificacion(
              profesionalDB.usuario._id,
              'profesional',
              'Cancelación de cliente',
              `<strong>${nombreUsuario}</strong> ha cancelado su cita de <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'advertencia'
            );
          }

          // Notificar a admins
          const admins = await obtenerAdministradores();
          for (const adminId of admins) {
            await crearNotificacion(
              adminId,
              'administrador',
              'Cancelación de cliente',
              `<strong>${nombreUsuario}</strong> canceló su cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'advertencia'
            );
          }

          // Notificar al cliente
          await crearNotificacion(
            cita.usuario._id,
            'cliente',
            'Cita cancelada por ti',
            `Has cancelado tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
            'info'
          );
        }

        // Si cancela el PROFESIONAL
        else if (rolActualizador === 'profesional') {
          // Notificar al cliente
          await crearNotificacion(
            cita.usuario._id,
            'cliente',
            'Cita cancelada por profesional',
            `${nombreProfesional} ha cancelado tu cita de <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
            'advertencia'
          );

          // Notificar a admins
          const admins = await obtenerAdministradores();
          for (const adminId of admins) {
            await crearNotificacion(
              adminId,
              'administrador',
              'Profesional modifica estado de cita',
              `${nombreProfesional} canceló la cita de <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'info'
            );
          }
        }

        // Si cancela el ADMIN
        else if (rolActualizador === 'administrador') {
          // Notificar al cliente
          await crearNotificacion(
            cita.usuario._id,
            'cliente',
            'Cita cancelada por el centro',
            `El centro ha cancelado tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
            'advertencia'
          );

          // Notificar al profesional
          const profesionalDB = await Profesional.findById(cita.profesional._id).populate('usuario');
          if (profesionalDB && profesionalDB.usuario) {
            await crearNotificacion(
              profesionalDB.usuario._id,
              'profesional',
              'Admin modifica estado de cita',
              `El administrador canceló la cita de <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'info'
            );
          }
        }
      }

      // CONFIRMACIÓN
      else if (estado === 'confirmada') {

        // Si confirma el PROFESIONAL
        if (rolActualizador === 'profesional') {
          // Notificar al cliente
          await crearNotificacion(
            cita.usuario._id,
            'cliente',
            'Cita confirmada',
            `${nombreProfesional} ha confirmado tu cita de <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
            'exito'
          );

          // Notificar a admins
          const admins = await obtenerAdministradores();
          for (const adminId of admins) {
            await crearNotificacion(
              adminId,
              'administrador',
              'Profesional modifica estado de cita',
              `${nombreProfesional} confirmó la cita de <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'info'
            );
          }
        }

        // Si confirma el ADMIN
        else if (rolActualizador === 'administrador') {
          // Notificar al cliente
          await crearNotificacion(
            cita.usuario._id,
            'cliente',
            'Cita confirmada',
            `Tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong> ha sido confirmada.`,
            'exito'
          );

          // Notificar al profesional
          const profesionalDB = await Profesional.findById(cita.profesional._id).populate('usuario');
          if (profesionalDB && profesionalDB.usuario) {
            await crearNotificacion(
              profesionalDB.usuario._id,
              'profesional',
              'Admin modifica estado de cita',
              `El administrador confirmó tu cita con <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'info'
            );
          }
        }
      }
    }

    res.json({ mensaje: 'Cita actualizada exitosamente', cita: citaActualizada });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
};

// Eliminar una cita (solo admin, protegido por soloAdmin en las rutas)
exports.deleteCita = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await cita.deleteOne();
    res.json({ mensaje: 'Cita eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
};

// Marcar cita como realizada
exports.marcarRealizada = async (req, res) => {
  try {
    const { marcadoPor, rolMarcador } = req.body;

    const cita = await Cita.findById(req.params.id)
      .populate('usuario', 'nombre email puntos')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const { rol, id_usuario } = req.usuario;
    if (rol === 'cliente') {
      return res.status(403).json({ error: 'No tienes permiso para marcar citas como realizadas' });
    } else if (rol === 'profesional') {
      const profesional = await Profesional.findOne({ usuario: id_usuario });
      if (!profesional || cita.profesional._id.toString() !== profesional._id.toString()) {
        return res.status(403).json({ error: 'No tienes permiso para marcar esta cita como realizada' });
      }
    }

    if (cita.estado === 'realizada') {
      return res.status(400).json({ error: 'La cita ya fue marcada como realizada' });
    }

    if (cita.estado === 'cancelada') {
      return res.status(400).json({ error: 'No se puede marcar como realizada una cita cancelada' });
    }

    if (cita.estado === 'pendiente') {
      return res.status(400).json({ error: 'No se puede marcar como realizada una cita pendiente. Debe estar confirmada primero' });
    }

    // Verificar que la fecha y hora de la cita ya han pasado
    const [anio, mes, dia] = cita.fecha.split('-').map(Number);
    const [hh, mm] = cita.hora.split(':').map(Number);
    const fechaHoraCita = new Date(anio, mes - 1, dia, hh, mm);
    if (fechaHoraCita > new Date()) {
      return res.status(400).json({ error: 'No se puede marcar como realizada una cita que aún no ha llegado' });
    }

    // Actualizar estado de la cita
    cita.estado = 'realizada';
    await cita.save();

    // Sumar puntos al usuario
    const usuario = await Usuario.findById(cita.usuario._id);
    let puntosNuevos = 0;
    let puntosActuales = 0;
    let subioNivel = false;
    let nivelAnterior = '';
    let nivelNuevo = '';

    if (usuario && usuario.rol === 'cliente') {
      puntosActuales = usuario.puntos ?? 0;
      puntosNuevos = puntosActuales + 10;

      // Obtener niveles de fidelidad
      const infoNivelAnterior = getNivelFidelidad(puntosActuales);
      const infoNivelNuevo = getNivelFidelidad(puntosNuevos);

      nivelAnterior = infoNivelAnterior.nombre;
      nivelNuevo = infoNivelNuevo.nombre;
      subioNivel = infoNivelAnterior.nivel !== infoNivelNuevo.nivel;

      usuario.puntos = puntosNuevos;
      await usuario.save();
    }

    // Crear notificaciones
    const fechaFormateada = formatearFecha(cita.fecha);
    const nombreUsuario = cita.usuario.nombre;
    const nombreProfesional = cita.profesional.nombre + ' ' + cita.profesional.apellidos;
    const nombreServicio = cita.servicio.nombre;

    // Notificación para el CLIENTE
    let mensajeCliente = `Tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> ha sido completada.<br><br>`;
    mensajeCliente += `🎉 <strong>¡Has ganado 10 puntos de fidelidad!</strong><br>`;
    mensajeCliente += `💰 Ahora tienes <strong>${puntosNuevos} puntos</strong> en total.<br>`;
    mensajeCliente += `⭐ Tu nivel de fidelidad: <strong>${nivelNuevo}</strong>`;

    if (subioNivel) {
      mensajeCliente += `<br><br>🏆 <strong>¡FELICITACIONES!</strong><br>`;
      mensajeCliente += `¡Has alcanzado el nivel <strong>${nivelNuevo}</strong>! 🎊`;
    } else {
      // Mostrar progreso al siguiente nivel
      let puntosParaSiguienteNivel = 0;
      let siguienteNivel = '';

      if (puntosNuevos < 20) {
        puntosParaSiguienteNivel = 20 - puntosNuevos;
        siguienteNivel = 'Cliente Frecuente';
      } else if (puntosNuevos < 50) {
        puntosParaSiguienteNivel = 50 - puntosNuevos;
        siguienteNivel = 'Cliente Habitual';
      } else if (puntosNuevos < 100) {
        puntosParaSiguienteNivel = 100 - puntosNuevos;
        siguienteNivel = 'Cliente Premium';
      }

      if (puntosParaSiguienteNivel > 0) {
        mensajeCliente += `<br>📊 Te faltan <strong>${puntosParaSiguienteNivel} puntos</strong> para alcanzar <strong>${siguienteNivel}</strong>.`;
      }
    }

    await crearNotificacion(
      cita.usuario._id,
      'cliente',
      'Cita realizada',
      mensajeCliente,
      'exito'
    );

    // Si la marcó el ADMINISTRADOR
    if (rolMarcador === 'administrador') {
      const profesionalDB = await Profesional.findById(cita.profesional._id).populate('usuario');
      if (profesionalDB && profesionalDB.usuario) {
        await crearNotificacion(
          profesionalDB.usuario._id,
          'profesional',
          'Cita marcada como realizada por admin',
          `El administrador ha marcado como realizada tu cita con <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong>.`,
          'info'
        );
      }
    }

    // Si la marcó el PROFESIONAL
    if (rolMarcador === 'profesional') {
      const admins = await obtenerAdministradores();
      for (const adminId of admins) {
        await crearNotificacion(
          adminId,
          'administrador',
          'Profesional marca cita como realizada',
          `${nombreProfesional} ha marcado como realizada la cita con <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong>.`,
          'info'
        );
      }
    }

    return res.json({
      mensaje: 'Cita marcada como realizada y puntos sumados',
      cita,
      puntosSumados: 10,
      puntosActuales: puntosNuevos,
      subioNivel,
      nivelActual: nivelNuevo
    });
  } catch (error) {
    console.error('Error al marcar cita como realizada:', error);
    res.status(500).json({ error: 'Error al marcar cita como realizada' });
  }
};

// Verificar disponibilidad
exports.verificarDisponibilidad = async (req, res) => {
  try {
    const { profesionalId, fecha, hora } = req.params;

    if (!profesionalId || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
    }

    const citaExistente = await Cita.findOne({
      profesional: profesionalId,
      fecha,
      hora,
      estado: { $ne: 'cancelada' }
    });

    res.json({ disponible: !citaExistente });
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ error: 'Error al verificar disponibilidad' });
  }
};
