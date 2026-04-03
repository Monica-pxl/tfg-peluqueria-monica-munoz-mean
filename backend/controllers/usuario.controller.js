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

    // Proteger: no dejar el sistema sin ningún administrador activo
    if (estado === 'inactivo') {
      const usuarioAfectado = await Usuario.findById(req.params.id).select('rol');
      if (usuarioAfectado && usuarioAfectado.rol === 'administrador') {
        const adminsActivos = await Usuario.countDocuments({ rol: 'administrador', estado: 'activo' });
        if (adminsActivos <= 1) {
          return res.status(400).json({ error: 'No se puede desactivar al último administrador activo del sistema' });
        }
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

    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log(`🗑️ Usuario eliminado: ${usuario.nombre} (${usuario.rol})`);

    // Si el usuario es profesional, eliminar su registro de profesional Y TODAS sus relaciones
    if (usuario.rol === 'profesional') {
      const profesional = await Profesional.findOne({ usuario: req.params.id });

      if (profesional) {
        console.log(`🗑️ Eliminando profesional asociado: ${profesional._id}`);

        // 1. Eliminar relaciones profesional-servicio
        const relaciones = await ProfesionalServicio.deleteMany({ profesional: profesional._id });
        console.log(`   ├─ ${relaciones.deletedCount} relaciones profesional-servicio eliminadas`);

        // 2. Eliminar horarios del profesional
        const horarios = await Horario.deleteMany({ profesional: profesional._id });
        console.log(`   ├─ ${horarios.deletedCount} horarios eliminados`);

        // 3. Cancelar citas futuras/pendientes/confirmadas y notificar a clientes
        // IMPORTANTE: NO eliminar las citas, solo cambiar su estado a "cancelada"
        const { crearNotificacion, formatearFecha, obtenerAdministradores } = require('../helpers/notificaciones.helper');
        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);

        console.log(`   📅 Fecha de hoy (para comparación): ${fechaHoy.toISOString()}`);

        // Buscar citas pendientes o confirmadas que NO hayan pasado
        const citasAfectadas = await Cita.find({
          profesional: profesional._id,
          estado: { $in: ['pendiente', 'confirmada'] }
        })
          .populate('usuario', 'nombre email')
          .populate('servicio', 'nombre')
          .populate('centro', 'nombre');

        console.log(`   📋 Total citas afectadas encontradas: ${citasAfectadas.length}`);

        let citasCanceladas = 0;

        for (const cita of citasAfectadas) {
          // Verificar si la cita ya pasó
          const fechaCita = new Date(cita.fecha);
          fechaCita.setHours(0, 0, 0, 0);

          console.log(`      📅 Comparando: Cita ${cita._id} del ${fechaCita.toISOString()} vs Hoy ${fechaHoy.toISOString()}`);

          if (fechaCita >= fechaHoy) {
            // La cita es futura o es hoy, cancelarla
            const estadoAnterior = cita.estado;

            // Guardar información histórica si no existe
            if (!cita.usuarioNombre && cita.usuario?.nombre) {
              cita.usuarioNombre = cita.usuario.nombre;
            }
            if (!cita.usuarioEmail && cita.usuario?.email) {
              cita.usuarioEmail = cita.usuario.email;
            }
            if (!cita.profesionalNombre) {
              cita.profesionalNombre = profesional.nombre;
            }
            if (!cita.profesionalApellidos) {
              cita.profesionalApellidos = profesional.apellidos;
            }
            if (!cita.servicioNombre && cita.servicio?.nombre) {
              cita.servicioNombre = cita.servicio.nombre;
            }
            if (!cita.centroNombre && cita.centro?.nombre) {
              cita.centroNombre = cita.centro.nombre;
            }

            cita.estado = 'cancelada';
            await cita.save();
            citasCanceladas++;

            console.log(`      ✅ Cita ${cita._id} cancelada (estado anterior: ${estadoAnterior})`);

            // Notificar al cliente
            if (cita.usuario && cita.usuario._id) {
              const nombreProfesional = `${profesional.nombre} ${profesional.apellidos}`;
              const fechaFormateada = formatearFecha(cita.fecha);
              const nombreServicio = cita.servicioNombre || cita.servicio?.nombre || 'Servicio';

              await crearNotificacion(
                cita.usuario._id,
                'cliente',
                'Cita cancelada por el centro',
                `Tu cita de <strong>${nombreServicio}</strong> con ${nombreProfesional} del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el profesional ya no está disponible.`,
                'advertencia'
              );

              console.log(`      ✉️ Notificación enviada a: ${cita.usuario.nombre}`);
            }
          } else {
            console.log(`      ⏩ Cita del ${cita.fecha} ya pasó, no se modifica`);
          }
        }

        console.log(`   ├─ ${citasCanceladas} citas canceladas (futuras)`);
        console.log(`   ├─ ${citasAfectadas.length - citasCanceladas} citas ya pasadas (sin cambios)`);

        // 4. Eliminar el registro de profesional
        await Profesional.findByIdAndDelete(profesional._id);
        console.log(`   └─ Registro de profesional eliminado`);
      }
    }

    // Si el usuario es cliente, cancelar sus citas futuras y notificar
    if (usuario.rol === 'cliente') {
      console.log(`🗑️ Gestionando citas del cliente: ${usuario.nombre}`);

      const { crearNotificacion, formatearFecha, obtenerAdministradores } = require('../helpers/notificaciones.helper');
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);

      console.log(`   📅 Fecha de hoy (para comparación): ${fechaHoy.toISOString()}`);

      // Buscar citas pendientes o confirmadas que NO hayan pasado
      const citasAfectadas = await Cita.find({
        usuario: req.params.id,
        estado: { $in: ['pendiente', 'confirmada'] }
      })
        .populate('profesional', 'nombre apellidos usuario')
        .populate('servicio', 'nombre')
        .populate('centro', 'nombre');

      console.log(`   📋 Total citas afectadas encontradas: ${citasAfectadas.length}`);

      let citasCanceladas = 0;

      for (const cita of citasAfectadas) {
        // Verificar si la cita ya pasó
        const fechaCita = new Date(cita.fecha);
        fechaCita.setHours(0, 0, 0, 0);

        console.log(`      📅 Comparando: Cita ${cita._id} del ${fechaCita.toISOString()} vs Hoy ${fechaHoy.toISOString()}`);

        if (fechaCita >= fechaHoy) {
          // La cita es futura o es hoy, cancelarla
          const estadoAnterior = cita.estado;

          // Guardar información histórica del usuario si no existe
          if (!cita.usuarioNombre) {
            cita.usuarioNombre = usuario.nombre;
          }
          if (!cita.usuarioEmail) {
            cita.usuarioEmail = usuario.email;
          }
          if (!cita.profesionalNombre && cita.profesional?.nombre) {
            cita.profesionalNombre = cita.profesional.nombre;
          }
          if (!cita.profesionalApellidos && cita.profesional?.apellidos) {
            cita.profesionalApellidos = cita.profesional.apellidos;
          }
          if (!cita.servicioNombre && cita.servicio?.nombre) {
            cita.servicioNombre = cita.servicio.nombre;
          }
          if (!cita.centroNombre && cita.centro?.nombre) {
            cita.centroNombre = cita.centro.nombre;
          }

          cita.estado = 'cancelada';
          await cita.save();
          citasCanceladas++;

          console.log(`      ✅ Cita ${cita._id} cancelada (estado anterior: ${estadoAnterior})`);

          const fechaFormateada = formatearFecha(cita.fecha);
          const nombreServicio = cita.servicioNombre || cita.servicio?.nombre || 'Servicio';
          const nombreCliente = usuario.nombre;

          // Notificar al profesional
          if (cita.profesional && cita.profesional.usuario) {
            const nombreProfesional = `${cita.profesional.nombre} ${cita.profesional.apellidos}`;

            await crearNotificacion(
              cita.profesional.usuario,
              'profesional',
              'Cita cancelada',
              `La cita de <strong>${nombreCliente}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el cliente eliminó su cuenta.`,
              'advertencia'
            );

            console.log(`      ✉️ Notificación enviada al profesional: ${nombreProfesional}`);
          }

          // Notificar a administradores
          const admins = await obtenerAdministradores();
          for (const adminId of admins) {
            await crearNotificacion(
              adminId,
              'administrador',
              'Cita cancelada por eliminación de cliente',
              `La cita de <strong>${nombreCliente}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el cliente eliminó su cuenta.`,
              'info'
            );
          }

          console.log(`      ✉️ Notificaciones enviadas a ${admins.length} administrador(es)`);
        } else {
          console.log(`      ⏩ Cita del ${cita.fecha} ya pasó, no se modifica`);
        }
      }

      console.log(`   ├─ ${citasCanceladas} citas canceladas (futuras)`);
      console.log(`   └─ ${citasAfectadas.length - citasCanceladas} citas ya pasadas (sin cambios)`);
    }

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

