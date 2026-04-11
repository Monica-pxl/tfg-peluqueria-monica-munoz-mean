const mongoose = require('mongoose');
const Profesional = require('../models/profesional');
const ProfesionalServicio = require('../models/profesionalServicio');
const Horario = require('../models/horario');
const Cita = require('../models/cita');
const Usuario = require('../models/usuario');
const Centro = require('../models/centro');

// Obtener todos los profesionales
exports.getAllProfesionales = async (req, res) => {
  try {
    const profesionales = await Profesional.find()
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion')
      .sort({ nombre: 1 });
    res.json(profesionales);
  } catch (error) {
    console.error('Error al obtener profesionales:', error);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
};

// Obtener un profesional por ID
exports.getProfesionalById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de profesional no válido' });
    }
    const profesional = await Profesional.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    res.json(profesional);
  } catch (error) {
    console.error('Error al obtener profesional:', error);
    res.status(500).json({ error: 'Error al obtener profesional' });
  }
};


// Crear un profesional
exports.createProfesional = async (req, res) => {
  try {
    // Aceptar tanto 'usuario' como 'id_usuario' para compatibilidad
    const { nombre, apellidos, usuario, id_usuario, centro } = req.body;
    const usuarioId = usuario || id_usuario;

    console.log('📝 Creando profesional con datos:', { nombre, apellidos, usuario: usuarioId, centro });

    if (!usuarioId) {
      return res.status(400).json({ error: 'El usuario es obligatorio' });
    }
    if (!centro) {
      return res.status(400).json({ error: 'El centro es obligatorio' });
    }
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const usuarioExiste = await Usuario.findById(usuarioId);
    if (!usuarioExiste) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const centroExiste = await Centro.findById(centro);
    if (!centroExiste) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    const nuevoProfesional = new Profesional({
      nombre,
      apellidos,
      usuario: usuarioId,
      centro
    });

    await nuevoProfesional.save();
    console.log('✅ Profesional guardado con _id:', nuevoProfesional._id);

    const profesionalCompleto = await Profesional.findById(nuevoProfesional._id)
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');

    res.status(201).json({ profesional: profesionalCompleto });
  } catch (error) {
    console.error('❌ Error al crear profesional:', error);
    res.status(500).json({ error: 'Error al crear profesional' });
  }
};

// Actualizar un profesional
exports.updateProfesional = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de profesional no válido' });
    }
    const { nombre } = req.body;

    if (nombre !== undefined && !nombre) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }

    // No se permite cambiar el centro de un profesional
    if (req.body.centro !== undefined) {
      return res.status(400).json({ error: 'El centro de un profesional no puede modificarse una vez asignado' });
    }

    // Excluir centro y usuario de los campos actualizables
    const { centro, usuario, id_usuario, ...datosActualizables } = req.body;

    const profesional = await Profesional.findByIdAndUpdate(
      req.params.id,
      datosActualizables,
      { new: true, runValidators: true }
    )
      .populate('usuario', 'nombre email')
      .populate('centro', 'nombre direccion');

    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    res.json(profesional);
  } catch (error) {
    console.error('Error al actualizar profesional:', error);
    res.status(500).json({ error: 'Error al actualizar profesional' });
  }
};

// Eliminar un profesional
exports.deleteProfesional = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ ========================================');
    console.log('🗑️ ELIMINANDO PROFESIONAL');
    console.log('🗑️ ID recibido:', id);

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ error: 'ID de profesional no válido' });
    }

    // PASO 1: Buscar el profesional
    const profesional = await Profesional.findById(id)
      .populate('usuario', 'nombre email');
    if (!profesional) {
      console.log('❌ Profesional no encontrado con _id:', id);
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    console.log(`✓ Profesional encontrado: ${profesional.nombre} ${profesional.apellidos}`);

    // PASO 2: Eliminar relaciones profesional_servicio
    const relacionesEliminadas = await ProfesionalServicio.deleteMany({ profesional: id });
    console.log(`✅ Relaciones profesional_servicio eliminadas: ${relacionesEliminadas.deletedCount}`);

    // PASO 3: Eliminar horarios del profesional
    const horariosEliminados = await Horario.deleteMany({ profesional: id });
    console.log(`✅ Horarios eliminados: ${horariosEliminados.deletedCount}`);

    // PASO 4: Cancelar citas futuras/pendientes/confirmadas y notificar a clientes
    // IMPORTANTE: NO eliminar las citas, solo cambiar su estado a "cancelada"
    console.log('🔍 Iniciando proceso de cancelación de citas...');

    const { crearNotificacion, formatearFecha, obtenerAdministradores } = require('../helpers/notificaciones.helper');
    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);

    console.log(`📅 Fecha de hoy (para comparación): ${fechaHoy.toISOString()}`);
    console.log(`🔍 Buscando citas del profesional con ID: ${id}`);

    // Buscar citas pendientes o confirmadas que NO hayan pasado
    const citasAfectadas = await Cita.find({
      profesional: id,
      estado: { $in: ['pendiente', 'confirmada'] }
    })
      .populate('usuario', 'nombre email')
      .populate('servicio', 'nombre')
      .populate('centro', 'nombre');

    console.log(`📋 Total citas afectadas encontradas: ${citasAfectadas.length}`);

    if (citasAfectadas.length === 0) {
      console.log('⚠️ No se encontraron citas pendientes o confirmadas para este profesional');
    }

    let citasCanceladas = 0;

    for (const cita of citasAfectadas) {
      // Verificar si la cita ya pasó
      const fechaCita = new Date(cita.fecha);
      fechaCita.setHours(0, 0, 0, 0);

      console.log(`   📅 Comparando: Cita ${cita._id} del ${fechaCita.toISOString()} vs Hoy ${fechaHoy.toISOString()}`);
      console.log(`   📅 fechaCita >= fechaHoy: ${fechaCita >= fechaHoy}`);

      if (fechaCita >= fechaHoy) {
        // La cita es futura o es hoy, cancelarla
        const estadoAnterior = cita.estado;

        // Guardar información histórica si no existe
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

        console.log(`   ✅ Cita ${cita._id} cancelada (estado anterior: ${estadoAnterior})`);

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

          // Notificar a administradores
          const admins = await obtenerAdministradores();
          for (const adminId of admins) {
            await crearNotificacion(
              adminId,
              'administrador',
              'Cita cancelada por eliminación de profesional',
              `La cita de <strong>${cita.usuarioNombre || cita.usuario?.nombre || 'Cliente'}</strong> para <strong>${nombreServicio}</strong> del <strong>${fechaFormateada}</strong> a las <strong>${cita.hora}</strong> ha sido cancelada porque el profesional ${nombreProfesional} ha sido eliminado del sistema.`,
              'info'
            );
          }

          console.log(`   ✉️ Notificación enviada a: ${cita.usuario.nombre}`);
        }
      } else {
        console.log(`   ⏩ Cita del ${cita.fecha} ya pasó, no se modifica`);
      }
    }

    console.log(`✅ Citas canceladas (futuras): ${citasCanceladas}`);
    console.log(`   Total citas afectadas: ${citasAfectadas.length}`);
    console.log(`   Citas ya pasadas (sin cambios): ${citasAfectadas.length - citasCanceladas}`);

    // PASO 5: Eliminar el profesional
    await Profesional.findByIdAndDelete(id);
    console.log(`✅ Profesional eliminado: ${profesional.nombre} ${profesional.apellidos}`);
    console.log('🗑️ ========================================');

    res.json({
      mensaje: 'Profesional eliminado exitosamente',
      relacionesEliminadas: relacionesEliminadas.deletedCount,
      horariosEliminados: horariosEliminados.deletedCount,
      citasCanceladas,
      clientesNotificados: citasCanceladas
    });
  } catch (error) {
    console.error('❌ Error al eliminar profesional:', error);
    res.status(500).json({ error: 'Error al eliminar profesional' });
  }
};

