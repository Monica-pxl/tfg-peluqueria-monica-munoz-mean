const mongoose = require('mongoose');
const Usuario = require('../models/usuario');
const Profesional = require('../models/profesional');
const ProfesionalServicio = require('../models/profesionalServicio');
const Horario = require('../models/horario');
const Cita = require('../models/cita');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios
exports.getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};


// Actualizar un usuario (solo admin, solo rol y estado)
exports.updateUsuario = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }
    const { id_usuario } = req.usuario;

    if (id_usuario.toString() === req.params.id) {
      return res.status(403).json({ error: 'Un administrador no puede editarse a sí mismo' });
    }

    const { rol: nuevoRol, estado } = req.body;

    // Validar valores de rol y estado
    const ROLES_VALIDOS = ['cliente', 'profesional', 'administrador'];
    const ESTADOS_VALIDOS = ['activo', 'inactivo'];
    if (nuevoRol !== undefined && !ROLES_VALIDOS.includes(nuevoRol)) {
      return res.status(400).json({ error: `El rol '${nuevoRol}' no es válido. Los roles válidos son: cliente, profesional, administrador` });
    }
    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `El estado '${estado}' no es válido. Los estados válidos son: activo, inactivo` });
    }

    const datosActualizados = {};
    if (nuevoRol !== undefined) datosActualizados.rol = nuevoRol;
    if (estado !== undefined) datosActualizados.estado = estado;

    // Obtener el usuario actual para comprobar su rol antes de modificarlo
    const usuarioActual = await Usuario.findById(req.params.id).select('rol nombre');
    if (!usuarioActual) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Proteger: no dejar el sistema sin ningún administrador activo
    if (estado === 'inactivo') {
      if (usuarioActual.rol === 'administrador') {
        const adminsActivos = await Usuario.countDocuments({ rol: 'administrador', estado: 'activo' });
        if (adminsActivos <= 1) {
          return res.status(400).json({ error: 'No se puede desactivar al último administrador activo del sistema' });
        }
      }
    }

    // Borrado en cascada si se cambia el rol de profesional a otro rol
    if (nuevoRol && nuevoRol !== 'profesional' && usuarioActual.rol === 'profesional') {
      const profesional = await Profesional.findOne({ usuario: req.params.id });

      if (profesional) {
        const { crearNotificacion, formatearFecha, obtenerAdministradores } = require('../helpers/notificaciones.helper');

        // 1. Eliminar relaciones profesional-servicio
        const relaciones = await ProfesionalServicio.deleteMany({ profesional: profesional._id });
        console.log(`🔄 Cambio de rol cascada: ${relaciones.deletedCount} relaciones profesional-servicio eliminadas`);

        // 2. Eliminar horarios
        const horarios = await Horario.deleteMany({ profesional: profesional._id });
        console.log(`🔄 Cambio de rol cascada: ${horarios.deletedCount} horarios eliminados`);

        // 3. Cancelar citas futuras y notificar
        const todasLasCitas = await Cita.find({
          profesional: profesional._id,
          estado: { $in: ['pendiente', 'confirmada'] }
        })
          .populate('usuario', 'nombre email')
          .populate('servicio', 'nombre');

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const citasFuturas = todasLasCitas.filter(cita => new Date(cita.fecha + 'T00:00:00') >= hoy);

        if (citasFuturas.length > 0) {
          await Cita.updateMany(
            { _id: { $in: citasFuturas.map(c => c._id) } },
            { $set: { estado: 'cancelada' } }
          );

          const admins = await obtenerAdministradores();

          for (const cita of citasFuturas) {
            const nombreProfesional = `${profesional.nombre} ${profesional.apellidos}`;
            const fechaFormateada = formatearFecha(cita.fecha);
            const nombreServicio = cita.servicioNombre || cita.servicio?.nombre || 'Servicio';

            // Notificar al cliente
            if (cita.usuario && cita.usuario._id) {
              await crearNotificacion(
                cita.usuario._id,
                'cliente',
                'Cita cancelada por el centro',
                `Tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el profesional ha cambiado de rol en el sistema.`,
                'advertencia'
              );
            }

            // Notificar a administradores
            for (const adminId of admins) {
              await crearNotificacion(
                adminId,
                'administrador',
                'Cita cancelada por cambio de rol',
                `La cita de <strong>${cita.usuarioNombre || cita.usuario?.nombre || 'Cliente'}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el profesional ${nombreProfesional} ha cambiado de rol.`,
                'info'
              );
            }
          }
        }

        // 4. Eliminar el registro de profesional
        await Profesional.findByIdAndDelete(profesional._id);
        console.log(`🔄 Cambio de rol cascada: profesional ${profesional.nombre} ${profesional.apellidos} eliminado (${citasFuturas.length} citas canceladas)`);
      }
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      datosActualizados,
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar un usuario (solo admin, no puede eliminarse a sí mismo)
exports.deleteUsuario = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }
    const { id_usuario } = req.usuario;

    if (id_usuario.toString() === req.params.id) {
      return res.status(403).json({ error: 'Un administrador no puede eliminarse a sí mismo' });
    }

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { crearNotificacion, formatearFecha, obtenerAdministradores } = require('../helpers/notificaciones.helper');

    // Buscar TODAS las citas pendientes/confirmadas del usuario como cliente ANTES de eliminar
    // Sin filtro de fecha en DB para evitar problemas de zona horaria con strings YYYY-MM-DD
    const todasLasCitasCliente = await Cita.find({
      usuario: req.params.id,
      estado: { $in: ['pendiente', 'confirmada'] }
    })
      .populate('profesional', 'nombre apellidos usuario')
      .populate('servicio', 'nombre')
      .populate('centro', 'nombre');

    // Filtrar en JS: solo citas de hoy o futuras
    // 'T00:00:00' fuerza parseo en hora local (no UTC) para evitar desfase de día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const citasComoCliente = todasLasCitasCliente.filter(cita => {
      const fechaCita = new Date(cita.fecha + 'T00:00:00');
      return fechaCita >= hoy;
    });

    console.log(`🔍 Citas encontradas: ${todasLasCitasCliente.length} total, ${citasComoCliente.length} futuras/hoy a cancelar`);

    // Ahora sí eliminar el usuario
    await Usuario.findByIdAndDelete(req.params.id);
    console.log(`🗑️ Usuario eliminado: ${usuario.nombre} (${usuario.rol})`);

    // Limpiar registro de profesional si existe, sin importar el rol actual del usuario
    // (el rol pudo haber cambiado después de que se creó el registro de profesional)
    const profesional = await Profesional.findOne({ usuario: req.params.id });

    if (profesional) {
        console.log(`🗑️ Eliminando profesional asociado: ${profesional._id}`);

        // 1. Eliminar relaciones profesional-servicio
        const relaciones = await ProfesionalServicio.deleteMany({ profesional: profesional._id });
        console.log(`   ├─ ${relaciones.deletedCount} relaciones profesional-servicio eliminadas`);

        // 2. Eliminar horarios del profesional
        const horarios = await Horario.deleteMany({ profesional: profesional._id });
        console.log(`   ├─ ${horarios.deletedCount} horarios eliminados`);

        // 3. Cancelar citas futuras/pendientes/confirmadas y notificar
        const todasLasCitasProfesional = await Cita.find({
          profesional: profesional._id,
          estado: { $in: ['pendiente', 'confirmada'] }
        })
          .populate('usuario', 'nombre email')
          .populate('servicio', 'nombre')
          .populate('centro', 'nombre');

        const hoyProf = new Date();
        hoyProf.setHours(0, 0, 0, 0);

        const citasProfesional = todasLasCitasProfesional.filter(cita => {
          const fechaCita = new Date(cita.fecha + 'T00:00:00');
          return fechaCita >= hoyProf;
        });

        console.log(`   📋 Citas como profesional: ${todasLasCitasProfesional.length} total, ${citasProfesional.length} a cancelar`);

        if (citasProfesional.length > 0) {
          await Cita.updateMany(
            { _id: { $in: citasProfesional.map(c => c._id) } },
            { $set: { estado: 'cancelada' } }
          );

          const adminsProf = await obtenerAdministradores();

          for (const cita of citasProfesional) {
            const nombreProfesional = `${profesional.nombre} ${profesional.apellidos}`;
            const fechaFormateada = formatearFecha(cita.fecha);
            const nombreServicio = cita.servicioNombre || cita.servicio?.nombre || 'Servicio';

            // Notificar al cliente de la cita
            if (cita.usuario && cita.usuario._id) {
              await crearNotificacion(
                cita.usuario._id,
                'cliente',
                'Cita cancelada por el centro',
                `Tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el profesional ya no está disponible.`,
                'advertencia'
              );
            }

            // Notificar a administradores
            for (const adminId of adminsProf) {
              await crearNotificacion(
                adminId,
                'administrador',
                'Cita cancelada por eliminación de profesional',
                `La cita de <strong>${cita.usuarioNombre || cita.usuario?.nombre || 'Cliente'}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el profesional ${nombreProfesional} ha sido eliminado del sistema.`,
                'info'
              );
            }
          }

          console.log(`   ├─ ${citasProfesional.length} citas canceladas y notificaciones enviadas`);
        }

        // 4. Eliminar el registro de profesional
        await Profesional.findByIdAndDelete(profesional._id);
        console.log(`   └─ Registro de profesional eliminado`);
    }

    // Cancelar citas como cliente, independientemente del rol actual
    if (citasComoCliente.length > 0) {
      // updateMany evita problemas de validación con documentos populados que tienen refs requeridas
      await Cita.updateMany(
        { _id: { $in: citasComoCliente.map(c => c._id) } },
        { $set: { estado: 'cancelada' } }
      );

      console.log(`   ✅ ${citasComoCliente.length} citas canceladas`);

      const admins = await obtenerAdministradores();

      for (const cita of citasComoCliente) {
        const fechaFormateada = formatearFecha(cita.fecha);
        const nombreServicio = cita.servicioNombre || cita.servicio?.nombre || 'Servicio';
        const nombreCliente = usuario.nombre;

        // Notificar al profesional
        if (cita.profesional && cita.profesional.usuario) {
          await crearNotificacion(
            cita.profesional.usuario,
            'profesional',
            'Cita cancelada',
            `La cita de <strong>${nombreCliente}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el usuario ha sido eliminado del sistema.`,
            'advertencia'
          );
        }

        // Notificar a administradores
        for (const adminId of admins) {
          await crearNotificacion(
            adminId,
            'administrador',
            'Cita cancelada por eliminación de usuario',
            `La cita de <strong>${nombreCliente}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el usuario ha sido eliminado del sistema.`,
            'info'
          );
        }
      }

      console.log(`   └─ Notificaciones enviadas`);
    }

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

