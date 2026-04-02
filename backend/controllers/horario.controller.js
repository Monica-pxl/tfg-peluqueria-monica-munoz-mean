const Horario = require('../models/horario');
const Profesional = require('../models/profesional');
const Centro = require('../models/centro');
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


// Crear un horario
exports.createHorario = async (req, res) => {
  try {
    const { profesional, dias, hora_inicio, hora_fin, festivo, fechas_festivas } = req.body;

    console.log('📝 Creando horario para profesional:', profesional);

    if (!profesional) {
      return res.status(400).json({ error: 'El profesional es obligatorio' });
    }
    if (!dias || dias.length === 0) {
      return res.status(400).json({ error: 'Los días son obligatorios' });
    }
    if (!hora_inicio) {
      return res.status(400).json({ error: 'La hora de inicio es obligatoria' });
    }
    if (!hora_fin) {
      return res.status(400).json({ error: 'La hora de fin es obligatoria' });
    }

    // Validar que los días son nombres válidos (lunes–sábado)
    const DIAS_VALIDOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasInvalidos = dias.filter(d => !DIAS_VALIDOS.includes(d));
    if (diasInvalidos.length > 0) {
      return res.status(400).json({ error: `Los siguientes días no son válidos: ${diasInvalidos.join(', ')}. Los días válidos son: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado` });
    }
    const profesionalDB = await Profesional.findById(profesional).populate('centro');
    if (!profesionalDB) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    if (!profesionalDB.centro) {
      return res.status(400).json({ error: 'El profesional no tiene un centro asignado' });
    }

    // Validar que el horario del profesional esté dentro del horario del centro
    const centro = profesionalDB.centro;
    const horarioAperturaCentro = centro.horario_apertura;
    const horarioCierreCentro = centro.horario_cierre;

    console.log('🏢 Centro:', centro.nombre);
    console.log('⏰ Horario del centro:', horarioAperturaCentro, '-', horarioCierreCentro);
    console.log('⏰ Horario del profesional:', hora_inicio, '-', hora_fin);

    // Validar que hora_inicio >= horario_apertura del centro
    if (hora_inicio < horarioAperturaCentro) {
      return res.status(400).json({
        error: `El horario de inicio (${hora_inicio}) no puede ser anterior al horario de apertura del centro (${horarioAperturaCentro})`
      });
    }

    // Validar que hora_fin <= horario_cierre del centro
    if (hora_fin > horarioCierreCentro) {
      return res.status(400).json({
        error: `El horario de fin (${hora_fin}) no puede ser posterior al horario de cierre del centro (${horarioCierreCentro})`
      });
    }

    // Validar que hora_inicio < hora_fin
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({
        error: 'El horario de inicio debe ser anterior al horario de fin'
      });
    }

    console.log('✅ Validación exitosa: El horario del profesional está dentro del horario del centro');

    // Verificar solapamiento con otros horarios del mismo profesional
    const horariosExistentes = await Horario.find({ profesional: profesional });
    console.log(`📋 Horarios existentes del profesional: ${horariosExistentes.length}`);

    for (const h of horariosExistentes) {
      // Verificar si hay días en común
      const diasEnComun = dias.filter(d => h.dias.includes(d));

      if (diasEnComun.length > 0) {
        console.log(`⚠️ Días en común encontrados: ${diasEnComun.join(', ')}`);
        console.log(`   Horario existente: ${h.hora_inicio} - ${h.hora_fin}`);
        console.log(`   Nuevo horario: ${hora_inicio} - ${hora_fin}`);

        // Verificar si hay solapamiento de horas
        // NO hay solapamiento si: el nuevo termina antes de que empiece el existente O el nuevo empieza después de que termine el existente
        if (!(hora_fin <= h.hora_inicio || hora_inicio >= h.hora_fin)) {
          console.log('❌ ¡Solapamiento detectado!');
          return res.status(400).json({
            error: `El horario se solapa con otro horario del mismo profesional en día(s): ${diasEnComun.join(', ')}. Horario existente: ${h.hora_inicio} - ${h.hora_fin}`
          });
        }
      }
    }

    console.log('✅ No hay solapamiento con otros horarios');

    // Validar que las fechas festivas caigan en días en que el profesional trabaja
    if (fechas_festivas && fechas_festivas.length > 0) {
      const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      for (const fecha of fechas_festivas) {
        const diaSemana = nombresDias[new Date(fecha).getUTCDay()];
        if (!dias.includes(diaSemana)) {
          return res.status(400).json({
            error: `La fecha ${fecha.split('T')[0]} cae en ${diaSemana}, pero el profesional no trabaja ese día`
          });
        }
      }
    }

    // Bloquear si hay citas confirmadas en alguna de las fechas festivas
    if (fechas_festivas && fechas_festivas.length > 0) {
      const Cita = require('../models/cita');
      for (const fecha of fechas_festivas) {
        const fechaNorm = fecha.split('T')[0];
        const todasCitas = await Cita.find({ profesional, estado: 'confirmada' });
        const enFecha = todasCitas.filter(c => {
          const f = typeof c.fecha === 'string' ? c.fecha.split('T')[0] : c.fecha.toISOString().split('T')[0];
          return f === fechaNorm;
        });
        if (enFecha.length > 0) {
          return res.status(400).json({
            error: `No se puede marcar como festiva la fecha ${fechaNorm}: hay ${enFecha.length} cita(s) confirmada(s). Primero cancela o reagenda esas citas.`
          });
        }
      }
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
    if (profesionalDB.usuario) {
      const diasTexto = dias.join(', ');
      await crearNotificacion(
        profesionalDB.usuario._id || profesionalDB.usuario,
        'profesional',
        'Nuevo horario asignado',
        `Se ha añadido un nuevo horario a tu agenda: <strong>${diasTexto}</strong> de <strong>${hora_inicio}</strong> a <strong>${hora_fin}</strong>.`,
        'info'
      );

      // Si se crearon fechas festivas, cancelar citas y notificar a clientes
      if (fechas_festivas && fechas_festivas.length > 0) {
        const Cita = require('../models/cita');
        const nombreProfesional = `${profesionalDB.nombre} ${profesionalDB.apellidos}`;
        const fechasTexto = fechas_festivas.map(f => formatearFecha(f)).join(', ');

        // Notificar al profesional sobre las fechas festivas
        await crearNotificacion(
          profesionalDB.usuario._id || profesionalDB.usuario,
          'profesional',
          'Día marcado como no laborable',
          `Se han añadido fechas festivas a tu horario: <strong>${fechasTexto}</strong>. No tendrás citas programadas en esos días.`,
          'info'
        );

        // Cancelar citas de clientes en esas fechas festivas
        for (const fechaFestiva of fechas_festivas) {
          console.log(`🎄 Procesando fecha festiva al crear horario: ${fechaFestiva}`);

          // Normalizar la fecha festiva para comparación (YYYY-MM-DD)
          const fechaNormalizada = fechaFestiva.split('T')[0]; // Asegurarse de tener solo YYYY-MM-DD
          console.log(`   📅 Fecha normalizada: ${fechaNormalizada}`);

          // Buscar TODAS las citas del profesional primero para debug
          const todasCitasProfesional = await Cita.find({
            profesional: profesional
          }).populate('usuario', 'nombre email');

          console.log(`   📋 Total citas del profesional: ${todasCitasProfesional.length}`);
          if (todasCitasProfesional.length > 0) {
            console.log(`   📅 Fechas de citas del profesional:`, todasCitasProfesional.map(c => {
              const fechaCita = typeof c.fecha === 'string' ? c.fecha : c.fecha.toISOString().split('T')[0];
              return `${fechaCita} (estado: ${c.estado})`;
            }));
          }

          // Buscar citas pendientes o confirmadas en esa fecha (comparar solo YYYY-MM-DD)
          const citasAfectadas = todasCitasProfesional.filter(cita => {
            const fechaCita = typeof cita.fecha === 'string'
              ? cita.fecha.split('T')[0]
              : cita.fecha.toISOString().split('T')[0];
            return fechaCita === fechaNormalizada && ['pendiente', 'confirmada'].includes(cita.estado);
          });

          console.log(`   📋 Citas encontradas en esa fecha: ${citasAfectadas.length}`);

          // Cancelar cada cita y notificar al cliente
          for (const cita of citasAfectadas) {
            if (!cita.usuario) continue;

            const nombreServicio = cita.servicioNombre || 'Servicio';
            const fechaFormateada = formatearFecha(cita.fecha);

            // Actualizar estado de la cita
            cita.estado = 'cancelada';
            cita.canceladaPor = 'admin';
            await cita.save();

            console.log(`   ✅ Cita ${cita._id} cancelada`);

            // Notificar al cliente
            await crearNotificacion(
              cita.usuario._id,
              'cliente',
              'Cita cancelada por festivo',
              `Tu cita de <strong>${nombreServicio}</strong> con <strong>${nombreProfesional}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque ese día se marcó como festivo.`,
              'advertencia'
            );

            console.log(`   📧 Cliente ${cita.usuario.nombre} notificado`);
          }
        }
      }
    }

    res.status(201).json(horarioCompleto);
  } catch (error) {
    console.error('❌ Error al crear horario:', error);
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

// Actualizar un horario
exports.updateHorario = async (req, res) => {
  try {
    const horarioAnterior = await Horario.findById(req.params.id).populate('profesional');
    if (!horarioAnterior) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    const { dias, hora_inicio, hora_fin, fechas_festivas } = req.body;

    // No se permite cambiar el profesional de un horario
    if (req.body.profesional !== undefined) {
      return res.status(400).json({ error: 'El profesional de un horario no puede modificarse una vez asignado' });
    }

    // Validar que los días son nombres válidos (lunes–sábado)
    const DIAS_VALIDOS_UPDATE = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    if (dias) {
      const diasInvalidosUpdate = dias.filter(d => !DIAS_VALIDOS_UPDATE.includes(d));
      if (diasInvalidosUpdate.length > 0) {
        return res.status(400).json({ error: `Los siguientes días no son válidos: ${diasInvalidosUpdate.join(', ')}. Los días válidos son: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado` });
      }
    }
    if (hora_inicio || hora_fin) {
      const horaInicioNueva = hora_inicio || horarioAnterior.hora_inicio;
      const horaFinNueva = hora_fin || horarioAnterior.hora_fin;

      // Obtener el profesional con su centro
      const profesionalDB = await Profesional.findById(horarioAnterior.profesional._id).populate('centro');
      if (!profesionalDB || !profesionalDB.centro) {
        return res.status(400).json({ error: 'El profesional no tiene un centro asignado' });
      }

      const centro = profesionalDB.centro;
      const horarioAperturaCentro = centro.horario_apertura;
      const horarioCierreCentro = centro.horario_cierre;

      console.log('🔄 Actualizando horario');
      console.log('🏢 Centro:', centro.nombre);
      console.log('⏰ Horario del centro:', horarioAperturaCentro, '-', horarioCierreCentro);
      console.log('⏰ Nuevo horario del profesional:', horaInicioNueva, '-', horaFinNueva);

      // Validar que hora_inicio >= horario_apertura del centro
      if (horaInicioNueva < horarioAperturaCentro) {
        return res.status(400).json({
          error: `El horario de inicio (${horaInicioNueva}) no puede ser anterior al horario de apertura del centro (${horarioAperturaCentro})`
        });
      }

      // Validar que hora_fin <= horario_cierre del centro
      if (horaFinNueva > horarioCierreCentro) {
        return res.status(400).json({
          error: `El horario de fin (${horaFinNueva}) no puede ser posterior al horario de cierre del centro (${horarioCierreCentro})`
        });
      }

      // Validar que hora_inicio < hora_fin
      if (horaInicioNueva >= horaFinNueva) {
        return res.status(400).json({
          error: 'El horario de inicio debe ser anterior al horario de fin'
        });
      }

      console.log('✅ Validación exitosa: El horario actualizado está dentro del horario del centro');
    }

    // Validar solapamiento con otros horarios del mismo profesional (excluyendo el actual)
    const diasNuevos = dias || horarioAnterior.dias;
    const horariosExistentes = await Horario.find({
      profesional: horarioAnterior.profesional._id,
      _id: { $ne: req.params.id } // Excluir el horario actual
    });

    console.log(`📋 Horarios existentes del profesional (excluyendo el actual): ${horariosExistentes.length}`);

    for (const h of horariosExistentes) {
      const diasEnComun = diasNuevos.filter(d => h.dias.includes(d));

      if (diasEnComun.length > 0) {
        const horaInicioNueva = hora_inicio || horarioAnterior.hora_inicio;
        const horaFinNueva = hora_fin || horarioAnterior.hora_fin;

        console.log(`⚠️ Días en común encontrados: ${diasEnComun.join(', ')}`);
        console.log(`   Horario existente: ${h.hora_inicio} - ${h.hora_fin}`);
        console.log(`   Nuevo horario: ${horaInicioNueva} - ${horaFinNueva}`);

        // Verificar si hay solapamiento de horas
        if (!(horaFinNueva <= h.hora_inicio || horaInicioNueva >= h.hora_fin)) {
          console.log('❌ ¡Solapamiento detectado!');
          return res.status(400).json({
            error: `El horario se solapa con otro horario del mismo profesional en día(s): ${diasEnComun.join(', ')}. Horario existente: ${h.hora_inicio} - ${h.hora_fin}`
          });
        }
      }
    }

    console.log('✅ No hay solapamiento con otros horarios');

    // Detectar cambios ANTES de actualizar
    const cambioHoras = (hora_inicio && hora_inicio !== horarioAnterior.hora_inicio) ||
                        (hora_fin && hora_fin !== horarioAnterior.hora_fin);
    const cambioDias = dias && JSON.stringify(dias) !== JSON.stringify(horarioAnterior.dias);

    const fechasFestivasAntiguas = horarioAnterior.fechas_festivas || [];
    const fechasFestivasNuevas = fechas_festivas || fechasFestivasAntiguas;

    // Validar que TODAS las fechas festivas resultantes caigan en días en que el profesional trabaja
    if (fechasFestivasNuevas.length > 0) {
      const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      for (const fecha of fechasFestivasNuevas) {
        const diaSemana = nombresDias[new Date(fecha).getUTCDay()];
        if (!diasNuevos.includes(diaSemana)) {
          return res.status(400).json({
            error: `La fecha ${fecha.split('T')[0]} cae en ${diaSemana}, pero el profesional no trabaja ese día`
          });
        }
      }
    }

    // Bloquear si hay citas confirmadas en alguna de las NUEVAS fechas festivas
    const nuevasFechasAValidar = fechasFestivasNuevas.filter(f => !fechasFestivasAntiguas.includes(f));
    if (nuevasFechasAValidar.length > 0) {
      const Cita = require('../models/cita');
      for (const fecha of nuevasFechasAValidar) {
        const fechaNorm = fecha.split('T')[0];
        const todasCitas = await Cita.find({ profesional: horarioAnterior.profesional._id, estado: 'confirmada' });
        const enFecha = todasCitas.filter(c => {
          const f = typeof c.fecha === 'string' ? c.fecha.split('T')[0] : c.fecha.toISOString().split('T')[0];
          return f === fechaNorm;
        });
        if (enFecha.length > 0) {
          return res.status(400).json({
            error: `No se puede marcar como festiva la fecha ${fechaNorm}: hay ${enFecha.length} cita(s) confirmada(s). Primero cancela o reagenda esas citas.`
          });
        }
      }
    }

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

          // IMPORTANTE: Cancelar citas de los clientes en esas fechas festivas y notificarles
          const Cita = require('../models/cita');
          const nombreProfesional = `${profesionalDB.nombre} ${profesionalDB.apellidos}`;

          for (const fechaFestiva of nuevasFechas) {
            console.log(`🎄 Procesando fecha festiva: ${fechaFestiva}`);

            // Normalizar la fecha festiva para comparación (YYYY-MM-DD)
            const fechaNormalizada = fechaFestiva.split('T')[0]; // Asegurarse de tener solo YYYY-MM-DD
            console.log(`   📅 Fecha normalizada: ${fechaNormalizada}`);

            // Buscar TODAS las citas del profesional primero para debug
            const todasCitasProfesional = await Cita.find({
              profesional: horario.profesional._id
            }).populate('usuario', 'nombre email');

            console.log(`   📋 Total citas del profesional: ${todasCitasProfesional.length}`);
            if (todasCitasProfesional.length > 0) {
              console.log(`   📅 Fechas de citas del profesional:`, todasCitasProfesional.map(c => {
                const fechaCita = typeof c.fecha === 'string' ? c.fecha : c.fecha.toISOString().split('T')[0];
                return `${fechaCita} (estado: ${c.estado})`;
              }));
            }

            // Buscar citas pendientes o confirmadas en esa fecha (comparar solo YYYY-MM-DD)
            const citasAfectadas = todasCitasProfesional.filter(cita => {
              const fechaCita = typeof cita.fecha === 'string'
                ? cita.fecha.split('T')[0]
                : cita.fecha.toISOString().split('T')[0];
              return fechaCita === fechaNormalizada && ['pendiente', 'confirmada'].includes(cita.estado);
            });

            console.log(`   📋 Citas encontradas en esa fecha: ${citasAfectadas.length}`);

            // Cancelar cada cita y notificar al cliente
            for (const cita of citasAfectadas) {
              if (!cita.usuario) continue;

              const nombreServicio = cita.servicioNombre || 'Servicio';
              const fechaFormateada = formatearFecha(cita.fecha);

              // Actualizar estado de la cita
              cita.estado = 'cancelada';
              cita.canceladaPor = 'admin';
              await cita.save();

              console.log(`   ✅ Cita ${cita._id} cancelada`);

              // Notificar al cliente
              await crearNotificacion(
                cita.usuario._id,
                'cliente',
                'Cita cancelada por festivo',
                `Tu cita de <strong>${nombreServicio}</strong> con <strong>${nombreProfesional}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque ese día se marcó como festivo.`,
                'advertencia'
              );

              console.log(`   📧 Cliente ${cita.usuario.nombre} notificado`);
            }
          }
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
