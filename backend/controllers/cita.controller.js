const mongoose = require('mongoose');
const Cita = require('../models/cita');
const Usuario = require('../models/usuario');
const Profesional = require('../models/profesional');
const Servicio = require('../models/servicio');
const Centro = require('../models/centro');
const Horario = require('../models/horario');
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
    if (!mongoose.Types.ObjectId.isValid(req.params.usuarioId)) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }
    const { rol, id_usuario } = req.usuario;

    // Los profesionales no pueden acceder a las citas por usuario
    if (rol === 'profesional') {
      return res.status(403).json({ error: 'No tienes permiso para ver las citas de usuarios' });
    }

    // Cliente: solo puede ver sus propias citas
    if (rol === 'cliente') {
      if (id_usuario.toString() !== req.params.usuarioId) {
        return res.status(403).json({ error: 'No tienes permiso para ver las citas de otro usuario' });
      }
    }

    // Administrador (o cliente ya validado arriba): busca por usuarioId del parámetro
    const citas = await Cita.find({ usuario: req.params.usuarioId })
      .populate('usuario', 'nombre email')
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
    if (!mongoose.Types.ObjectId.isValid(req.params.profesionalId)) {
      return res.status(400).json({ error: 'ID de profesional no válido' });
    }
    const { rol, id_usuario } = req.usuario;

    // Los clientes no pueden acceder a las citas de un profesional
    if (rol === 'cliente') {
      return res.status(403).json({ error: 'No tienes permiso para ver las citas de profesionales' });
    }

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

    const citasQuery = Cita.find({ profesional: req.params.profesionalId })
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion');

    const citas = await citasQuery.sort({ fecha: -1, hora: -1 });

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de cita no válido' });
    }
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

    // El usuario de la cita SIEMPRE es el usuario autenticado, no el del body
    const usuario = req.usuario.id_usuario.toString();
    const { profesional, servicio, centro, fecha, hora } = req.body;

    if (!profesional) return res.status(400).json({ error: 'El profesional es obligatorio' });
    if (!servicio) return res.status(400).json({ error: 'El servicio es obligatorio' });
    if (!centro) return res.status(400).json({ error: 'El centro es obligatorio' });
    if (!fecha) return res.status(400).json({ error: 'La fecha es obligatoria' });
    if (!hora) return res.status(400).json({ error: 'La hora es obligatoria' });

    if (!mongoose.Types.ObjectId.isValid(profesional)) {
      return res.status(400).json({ error: 'El ID del profesional no es válido' });
    }
    if (!mongoose.Types.ObjectId.isValid(servicio)) {
      return res.status(400).json({ error: 'El ID del servicio no es válido' });
    }
    if (!mongoose.Types.ObjectId.isValid(centro)) {
      return res.status(400).json({ error: 'El ID del centro no es válido' });
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

    // Validar formato de fecha (YYYY-MM-DD)
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fecha)) {
      return res.status(400).json({ error: 'El formato de la fecha no es válido (YYYY-MM-DD)' });
    }

    // Validar formato de hora (HH:MM)
    const regexHora = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!regexHora.test(hora)) {
      return res.status(400).json({ error: 'El formato de la hora no es válido (HH:MM)' });
    }

    // Validar que la fecha no sea pasada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(fecha + 'T00:00:00');
    if (fechaReserva < hoy) {
      return res.status(400).json({ error: 'No se puede reservar una cita en una fecha pasada' });
    }

    // Obtener horarios del profesional para validar disponibilidad
    const horariosProf = await Horario.find({ profesional: profesional });
    if (horariosProf.length === 0) {
      return res.status(400).json({ error: 'El profesional no tiene horarios configurados' });
    }

    // Verificar si la fecha es un día festivo para el profesional
    const esFestivo = horariosProf.some(h => h.fechas_festivas && h.fechas_festivas.includes(fecha));
    if (esFestivo) {
      return res.status(400).json({ error: 'El profesional no atiende ese día (día festivo)' });
    }

    // Verificar que el profesional trabaja ese día de la semana
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = nombresDias[new Date(fecha + 'T00:00:00').getDay()];
    const horarioDia = horariosProf.find(h => h.dias.map(d => d.toLowerCase()).includes(diaSemana.toLowerCase()));
    if (!horarioDia) {
      return res.status(400).json({ error: `El profesional no trabaja los ${diaSemana}` });
    }

    // Verificar que la hora está dentro del horario laboral del profesional
    const [horaH, horaM] = hora.split(':').map(Number);
    const [inicioH, inicioM] = horarioDia.hora_inicio.split(':').map(Number);
    const [finH, finM] = horarioDia.hora_fin.split(':').map(Number);
    const horaMin = horaH * 60 + horaM;
    const inicioMin = inicioH * 60 + inicioM;
    const finMin = finH * 60 + finM;
    if (horaMin < inicioMin || horaMin >= finMin) {
      return res.status(400).json({
        error: `La hora ${hora} está fuera del horario laboral del profesional (${horarioDia.hora_inicio} - ${horarioDia.hora_fin})`
      });
    }

    // Verificar solapamiento considerando la duración de cada servicio
    const citasDelDia = await Cita.find({
      profesional,
      fecha,
      estado: { $in: ['pendiente', 'confirmada'] }
    }).populate('servicio', 'duracion');

    const nuevaInicioMin = horaH * 60 + horaM;
    const nuevaFinMin = nuevaInicioMin + servicioDB.duracion;

    for (const citaExistente of citasDelDia) {
      const [cH, cM] = citaExistente.hora.split(':').map(Number);
      const existInicioMin = cH * 60 + cM;
      const duracionExistente = citaExistente.servicio ? citaExistente.servicio.duracion : 30;
      const existFinMin = existInicioMin + duracionExistente;

      if (nuevaInicioMin < existFinMin && nuevaFinMin > existInicioMin) {
        return res.status(400).json({ error: 'La cita se solapa con una cita ya existente en ese horario' });
      }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de cita no válido' });
    }
    const { estado } = req.body;
    // El rol del actor se obtiene del token JWT, no del body,
    // para garantizar consistencia independientemente del cliente que llame.
    const rolActualizador = req.usuario.rol;

    // Solo se permite modificar el estado; cualquier otro campo es rechazado
    const camposNoPermitidos = ['fecha', 'hora', 'usuario', 'profesional', 'servicio', 'centro'];
    const camposEnviados = camposNoPermitidos.filter(c => req.body[c] !== undefined);
    if (camposEnviados.length > 0) {
      return res.status(400).json({ error: `No se pueden modificar los siguientes campos de una cita: ${camposEnviados.join(', ')}` });
    }

    // Validar estado si se proporciona
    const ESTADOS_VALIDOS_CITA = ['pendiente', 'confirmada', 'cancelada', 'realizada'];
    if (estado !== undefined && !ESTADOS_VALIDOS_CITA.includes(estado)) {
      return res.status(400).json({ error: `El estado '${estado}' no es válido. Los estados válidos son: pendiente, confirmada, cancelada, realizada` });
    }

    const cita = await Cita.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion');

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Bloquear modificación si la fecha de la cita ya ha pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(cita.fecha + 'T00:00:00');
    if (fechaCita < hoy) {
      return res.status(400).json({ error: 'No se puede modificar una cita cuya fecha ya ha pasado' });
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

    // Actualizar campos (solo se permite cambiar el estado)
    if (estado) cita.estado = estado;

    await cita.save();

    const citaActualizada = await Cita.findById(cita._id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre duracion precio')
      .populate('centro', 'nombre direccion');

    // Responder al cliente inmediatamente — el estado ya está guardado en DB.
    // Las notificaciones son secundarias y no deben bloquear la respuesta.
    res.json({ mensaje: 'Cita actualizada exitosamente', cita: agregarNombresHistoricos(citaActualizada) });

    // Crear notificaciones (fire-and-forget): si fallan no afectan al cliente.
    try {
      const fechaFormateada = formatearFecha(citaActualizada.fecha);
      const nombreUsuario = citaActualizada.usuario?.nombre || citaActualizada.usuarioNombre || 'Usuario';
      const nombreProfesional = citaActualizada.profesional
        ? `${citaActualizada.profesional.nombre} ${citaActualizada.profesional.apellidos}`.trim()
        : `${citaActualizada.profesionalNombre || ''} ${citaActualizada.profesionalApellidos || ''}`.trim() || 'Profesional';
      const nombreServicio = citaActualizada.servicio?.nombre || citaActualizada.servicioNombre || 'Servicio';

      // IDs seguros para notificaciones (pueden ser null si la entidad fue eliminada)
      const usuarioIdNotif = citaActualizada.usuario?._id || null;
      const profesionalIdDoc = citaActualizada.profesional?._id || null;

      if (estado && estado !== estadoAnterior) {

        // CANCELACIÓN
        if (estado === 'cancelada') {

          // Si cancela el CLIENTE
          if (rolActualizador === 'cliente') {
            if (profesionalIdDoc) {
              const profesionalDB = await Profesional.findById(profesionalIdDoc).populate('usuario');
              if (profesionalDB?.usuario) {
                await crearNotificacion(
                  profesionalDB.usuario._id, 'profesional', 'Cancelación de cliente',
                  `<strong>${nombreUsuario}</strong> ha cancelado su cita de <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
                  'advertencia'
                );
              }
            }
            const admins = await obtenerAdministradores();
            for (const adminId of admins) {
              await crearNotificacion(
                adminId, 'administrador', 'Cancelación de cliente',
                `<strong>${nombreUsuario}</strong> canceló su cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
                'advertencia'
              );
            }
            await crearNotificacion(
              usuarioIdNotif, 'cliente', 'Cita cancelada por ti',
              `Has cancelado tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'info'
            );
          }

          // Si cancela el PROFESIONAL
          else if (rolActualizador === 'profesional') {
            await crearNotificacion(
              usuarioIdNotif, 'cliente', 'Cita cancelada por profesional',
              `${nombreProfesional} ha cancelado tu cita de <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'advertencia'
            );
            const admins = await obtenerAdministradores();
            for (const adminId of admins) {
              await crearNotificacion(
                adminId, 'administrador', 'Profesional modifica estado de cita',
                `${nombreProfesional} canceló la cita de <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
                'info'
              );
            }
          }

          // Si cancela el ADMIN
          else if (rolActualizador === 'administrador') {
            await crearNotificacion(
              usuarioIdNotif, 'cliente', 'Cita cancelada por el centro',
              `El centro ha cancelado tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'advertencia'
            );
            if (profesionalIdDoc) {
              const profesionalDB = await Profesional.findById(profesionalIdDoc).populate('usuario');
              if (profesionalDB?.usuario) {
                await crearNotificacion(
                  profesionalDB.usuario._id, 'profesional', 'Admin modifica estado de cita',
                  `El administrador canceló la cita de <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
                  'info'
                );
              }
            }
          }
        }

        // CONFIRMACIÓN
        else if (estado === 'confirmada') {

          // Si confirma el PROFESIONAL
          if (rolActualizador === 'profesional') {
            await crearNotificacion(
              usuarioIdNotif, 'cliente', 'Cita confirmada',
              `${nombreProfesional} ha confirmado tu cita de <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
              'exito'
            );
            const admins = await obtenerAdministradores();
            for (const adminId of admins) {
              await crearNotificacion(
                adminId, 'administrador', 'Profesional modifica estado de cita',
                `${nombreProfesional} confirmó la cita de <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
                'info'
              );
            }
          }

          // Si confirma el ADMIN
          else if (rolActualizador === 'administrador') {
            await crearNotificacion(
              usuarioIdNotif, 'cliente', 'Cita confirmada',
              `Tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong> ha sido confirmada.`,
              'exito'
            );
            if (profesionalIdDoc) {
              const profesionalDB = await Profesional.findById(profesionalIdDoc).populate('usuario');
              if (profesionalDB?.usuario) {
                await crearNotificacion(
                  profesionalDB.usuario._id, 'profesional', 'Admin modifica estado de cita',
                  `El administrador confirmó tu cita con <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${citaActualizada.hora}</strong>.`,
                  'info'
                );
              }
            }
          }
        }
      }
    } catch (notifError) {
      // Solo se loguea; la respuesta ya fue enviada al cliente
      console.error('⚠️ Error al crear notificaciones tras actualizar cita (no crítico):', notifError.message);
    }
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al actualizar cita' });
    }
  }
};

// Eliminar una cita (solo admin, protegido por soloAdmin en las rutas)
exports.deleteCita = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de cita no válido' });
    }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de cita no válido' });
    }
    // El rol del actor se obtiene del token JWT, no del body,
    // para garantizar consistencia independientemente del cliente que llame.
    const rolMarcador = req.usuario.rol;

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
      if (!profesional || !cita.profesional || cita.profesional._id.toString() !== profesional._id.toString()) {
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

    // Verificar que la fecha y hora de la cita ya han pasado.
    // Se usa toLocaleString con timeZone 'Europe/Madrid' y locale 'sv-SE' porque
    // este locale devuelve el formato ISO "YYYY-MM-DD HH:MM:SS", que permite
    // comparar cadenas lexicográficamente de forma correcta y sin necesidad de
    // parsear. Así la comparación funciona correctamente tanto en local como en
    // Vercel (UTC), independientemente del timezone del servidor.
    const ahoraEnMadrid = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' });
    const fechaHoraCita = `${cita.fecha} ${cita.hora}:00`;
    if (fechaHoraCita > ahoraEnMadrid) {
      return res.status(400).json({ error: 'No se puede marcar como realizada una cita que aún no ha llegado' });
    }

    // Actualizar estado de la cita
    cita.estado = 'realizada';
    await cita.save();

    // Sumar puntos al usuario (solo si el usuario sigue existiendo)
    let puntosNuevos = 0;
    let subioNivel = false;
    let nivelNuevo = '';

    if (cita.usuario?._id) {
      const usuario = await Usuario.findById(cita.usuario._id);
      if (usuario && usuario.rol === 'cliente') {
        const puntosActuales = usuario.puntos ?? 0;
        puntosNuevos = puntosActuales + 10;
        const infoNivelAnterior = getNivelFidelidad(puntosActuales);
        const infoNivelNuevo = getNivelFidelidad(puntosNuevos);
        nivelNuevo = infoNivelNuevo.nombre;
        subioNivel = infoNivelAnterior.nivel !== infoNivelNuevo.nivel;
        usuario.puntos = puntosNuevos;
        await usuario.save();
      }
    }

    // Responder al cliente inmediatamente — puntos y estado ya guardados
    res.json({
      mensaje: 'Cita marcada como realizada y puntos sumados',
      cita,
      puntosSumados: 10,
      puntosActuales: puntosNuevos,
      subioNivel,
      nivelActual: nivelNuevo
    });

    // Notificaciones (fire-and-forget)
    try {
      const fechaFormateada = formatearFecha(cita.fecha);
      const nombreUsuario = cita.usuario?.nombre || cita.usuarioNombre || 'Usuario';
      const nombreProfesional = cita.profesional
        ? `${cita.profesional.nombre} ${cita.profesional.apellidos}`.trim()
        : `${cita.profesionalNombre || ''} ${cita.profesionalApellidos || ''}`.trim() || 'Profesional';
      const nombreServicio = cita.servicio?.nombre || cita.servicioNombre || 'Servicio';
      const usuarioIdNotif = cita.usuario?._id || null;
      const profesionalIdDoc = cita.profesional?._id || null;

      // Notificación para el CLIENTE con puntos
      let mensajeCliente = `Tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> ha sido completada.<br><br>`;
      mensajeCliente += `🎉 <strong>¡Has ganado 10 puntos de fidelidad!</strong><br>`;
      mensajeCliente += `💰 Ahora tienes <strong>${puntosNuevos} puntos</strong> en total.<br>`;
      mensajeCliente += `⭐ Tu nivel de fidelidad: <strong>${nivelNuevo || 'Cliente Nuevo'}</strong>`;
      if (subioNivel) {
        mensajeCliente += `<br><br>🏆 <strong>¡FELICITACIONES!</strong><br>¡Has alcanzado el nivel <strong>${nivelNuevo}</strong>! 🎊`;
      }

      await crearNotificacion(usuarioIdNotif, 'cliente', 'Cita realizada', mensajeCliente, 'exito');

      if (rolMarcador === 'administrador' && profesionalIdDoc) {
        const profesionalDB = await Profesional.findById(profesionalIdDoc).populate('usuario');
        if (profesionalDB?.usuario) {
          await crearNotificacion(
            profesionalDB.usuario._id, 'profesional', 'Cita marcada como realizada por admin',
            `El administrador ha marcado como realizada tu cita con <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong>.`,
            'info'
          );
        }
      }

      if (rolMarcador === 'profesional') {
        const admins = await obtenerAdministradores();
        for (const adminId of admins) {
          await crearNotificacion(
            adminId, 'administrador', 'Profesional marca cita como realizada',
            `${nombreProfesional} ha marcado como realizada la cita con <strong>${nombreUsuario}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong>.`,
            'info'
          );
        }
      }
    } catch (notifError) {
      console.error('⚠️ Error al crear notificaciones tras marcar cita realizada (no crítico):', notifError.message);
    }
  } catch (error) {
    console.error('Error al marcar cita como realizada:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al marcar cita como realizada' });
    }
  }
};

// Obtener slots ocupados para un profesional en una fecha (endpoint público, sin autenticación)
exports.getSlotsOcupados = async (req, res) => {
  try {
    const { profesionalId, fecha } = req.params;

    if (!mongoose.Types.ObjectId.isValid(profesionalId)) {
      return res.status(400).json({ error: 'ID de profesional no válido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha no válido. Use YYYY-MM-DD' });
    }

    const citas = await Cita.find({
      profesional: profesionalId,
      fecha,
      estado: { $in: ['pendiente', 'confirmada'] }
    }).populate('servicio', 'duracion');

    const slots = citas.map(cita => ({
      hora: cita.hora,
      duracion: typeof cita.servicio === 'object' && cita.servicio !== null
        ? cita.servicio.duracion
        : 30
    }));

    res.json(slots);
  } catch (error) {
    console.error('Error al obtener slots ocupados:', error);
    res.status(500).json({ error: 'Error al obtener slots ocupados' });
  }
};

// Verificar disponibilidad
exports.verificarDisponibilidad = async (req, res) => {
  try {
    const { profesionalId, fecha, hora } = req.params;

    if (!mongoose.Types.ObjectId.isValid(profesionalId)) {
      return res.status(400).json({ error: 'ID de profesional no válido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha no válido. Use YYYY-MM-DD' });
    }

    if (!/^\d{2}:\d{2}$/.test(hora)) {
      return res.status(400).json({ error: 'Formato de hora no válido. Use HH:MM' });
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
