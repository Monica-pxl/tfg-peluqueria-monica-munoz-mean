const mongoose = require('mongoose');
const Servicio = require('./models/servicio');
const Usuario = require('./models/usuario');
const Centro = require('./models/centro');
const Horario = require('./models/horario');
const ProfesionalServicio = require('./models/profesionalServicio');
const Profesional = require('./models/profesional');
const Cita = require('./models/cita');
const Notificacion = require('./models/notificacion');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const {raceWith} = require("rxjs");

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch(err => console.error("❌ Error al conectar:", err));

const SECRET_KEY = 'mi-clave-secreta-super-segura-2024';

const app = express();
app.use(cors());
app.use(express.json());


function leerJSON(nombre) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', nombre), 'utf8'));
}

function escribirJSON(nombre, datos) {
  fs.writeFileSync(
    path.join(__dirname, 'data', nombre),
    JSON.stringify(datos, null, 2),
    'utf8'
  );
}


function usuarioSinPassword(usuario) {
  const { password, ...usuarioSeguro } = usuario;
  return usuarioSeguro;
}


app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const esValida = await bcrypt.compare(password, usuario.password);
    if (!esValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (usuario.estado === 'inactivo') {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        rol: usuario.rol,
        email: usuario.email
      },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    res.json({
      mensaje: 'Login correcto',
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        puntos: usuario.puntos
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});




app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol = 'cliente' } = req.body;

    console.log('📝 Intento de registro:', { nombre, email, rol });

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // 1. Comprobar si el email ya existe
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      console.log('⚠️ Email ya registrado:', email);
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // 2. Hashear contraseña
    const passwordHasheada = await bcrypt.hash(password, 10);

    // 3. Crear usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: passwordHasheada,
      rol,
      estado: 'activo',
      fecha_alta: new Date(),
      ...(rol === 'cliente' && { puntos: 0 })
    });

    await nuevoUsuario.save();
    console.log('✅ Usuario guardado en MongoDB:', { _id: nuevoUsuario._id, email: nuevoUsuario.email });

    // 4. Crear token
    const token = jwt.sign(
      {
        id_usuario: nuevoUsuario._id,
        rol: nuevoUsuario.rol,
        email: nuevoUsuario.email
      },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      token,
      usuario: usuarioSinPassword(nuevoUsuario.toObject())
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});



// GET todos los usuarios (MongoDB)
app.get('/api/usuarios', async (req, res) => {
  try {
    console.log('📊 Consultando usuarios en MongoDB...');
    const usuarios = await Usuario.find();
    console.log(`✅ Usuarios encontrados en MongoDB: ${usuarios.length}`);
    console.log('Usuarios:', usuarios.map(u => ({ email: u.email, nombre: u.nombre })));

    const usuariosSeguros = usuarios.map(u => {
      const { password, ...usuarioSeguro } = u.toObject();
      return usuarioSeguro;
    });
    res.json(usuariosSeguros);
  } catch (err) {
    console.error('❌ Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});









// GET todos los servicios (MongoDB)
app.get('/api/servicios', async (req, res) => {
  try {
    console.log('📊 Consultando servicios en MongoDB...');
    const servicios = await Servicio.find().sort({ _id: 1 });
    console.log(`✅ Servicios encontrados: ${servicios.length}`);
    res.json(servicios);
  } catch (err) {
    console.error('❌ Error al obtener servicios:', err);
    res.status(500).json({ mensaje: 'Error al obtener servicios' });
  }
});

// POST nuevo servicio (MongoDB)
app.post('/api/servicios', async (req, res) => {
  try {
    console.log('📝 Creando nuevo servicio:', req.body);

    const nuevoServicio = new Servicio(req.body);
    await nuevoServicio.save();

    console.log('✅ Servicio creado con _id:', nuevoServicio._id);
    res.status(201).json(nuevoServicio);
  } catch (err) {
    console.error('❌ Error al crear servicio:', err);
    res.status(400).json({ mensaje: 'Error al crear servicio', error: err.message });
  }
});

// PUT actualizar servicio (MongoDB)
app.put('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📝 Actualizando servicio con _id:', id);
    console.log('Datos a actualizar:', req.body);

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ mensaje: "ID de servicio no válido" });
    }

    const actualizado = await Servicio.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!actualizado) {
      console.log('❌ Servicio no encontrado con _id:', id);
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    console.log('✅ Servicio actualizado:', actualizado.nombre);
    res.json(actualizado);
  } catch (err) {
    console.error('❌ Error al actualizar servicio:', err);
    res.status(400).json({ mensaje: 'Error al actualizar servicio', error: err.message });
  }
});

// DELETE borrar servicio (MongoDB)
app.delete('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ ========================================');
    console.log('🗑️ ELIMINANDO SERVICIO');
    console.log('🗑️ ID recibido:', id);

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ mensaje: "ID de servicio no válido" });
    }

    // PASO 1: Buscar todas las relaciones antes de eliminar
    const relacionesExistentes = await ProfesionalServicio.find({ servicio: id });
    console.log('📋 Relaciones encontradas ANTES de eliminar:', relacionesExistentes.length);
    relacionesExistentes.forEach((rel, index) => {
      console.log(`   ${index + 1}. Profesional: ${rel.profesional}, Servicio: ${rel.servicio}`);
    });

    // PASO 2: Eliminar todas las relaciones profesional_servicio asociadas a este servicio
    const relacionesEliminadas = await ProfesionalServicio.deleteMany({ servicio: id });
    console.log(`✅ Relaciones ELIMINADAS: ${relacionesEliminadas.deletedCount}`);

    // PASO 3: Verificar que se eliminaron
    const relacionesRestantes = await ProfesionalServicio.find({ servicio: id });
    console.log('📋 Relaciones RESTANTES después de eliminar:', relacionesRestantes.length);

    // PASO 4: Eliminar el servicio
    const eliminado = await Servicio.findByIdAndDelete(id);

    if (!eliminado) {
      console.log('❌ Servicio no encontrado con _id:', id);
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    console.log('✅ Servicio eliminado:', eliminado.nombre);
    console.log('🗑️ ========================================');

    res.json({
      mensaje: 'Servicio eliminado',
      relacionesEliminadas: relacionesEliminadas.deletedCount,
      nombreServicio: eliminado.nombre
    });
  } catch (err) {
    console.error('❌ Error al eliminar servicio:', err);
    res.status(400).json({ mensaje: 'Error al eliminar servicio', error: err.message });
  }
});





// GET: Todas las relaciones profesional-servicio
app.get('/api/profesional_servicio', async (req, res) => {
  try {
    const relaciones = await ProfesionalServicio.find()
      .populate('profesional', 'nombre apellidos') // opcional: si quieres ver datos del profesional
      .populate('servicio', 'nombre');
    res.json(relaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las relaciones" });
  }
});


// POST: Crear nueva relación
app.post('/api/profesional_servicio', async (req, res) => {
  try {
    const { profesional, servicio } = req.body;

    if (!profesional || !servicio) {
      return res.status(400).json({ error: "Se requiere profesional y servicio" });
    }

    // Evitar duplicados
    const existe = await ProfesionalServicio.findOne({ profesional, servicio });
    if (existe) {
      return res.status(200).json(existe); // ya existe, devolvemos el existente
    }

    const nuevaRelacion = new ProfesionalServicio({ profesional, servicio });
    await nuevaRelacion.save();

    res.status(201).json(nuevaRelacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la relación" });
  }
});


// DELETE: Eliminar todas las relaciones de un servicio
app.delete('/api/profesional_servicio/servicio/:id', async (req, res) => {
  try {
    await ProfesionalServicio.deleteMany({ servicio: req.params.id });
    res.json({ mensaje: 'Relaciones eliminadas por servicio' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar relaciones por servicio" });
  }
});



// DELETE: Eliminar todas las relaciones de un profesional
app.delete('/api/profesional_servicio/profesional/:id', async (req, res) => {
  try {
    await ProfesionalServicio.deleteMany({ profesional: req.params.id });
    res.json({ mensaje: 'Relaciones eliminadas por profesional' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar relaciones por profesional" });
  }
});

// DELETE: Eliminar una relación específica por _id
app.delete('/api/profesional_servicio/:id', async (req, res) => {
  try {
    await ProfesionalServicio.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Relación eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la relación" });
  }
});






// Obtener todos los centros
app.get('/api/centros', async (req, res) => {
  try {
    const centros = await Centro.find();
    res.json(centros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener centros" });
  }
});



// Obtener un centro por _id
app.get('/api/centros/:id', async (req, res) => {
  try {
    const centro = await Centro.findById(req.params.id);
    if (!centro) return res.status(404).json({ error: "Centro no encontrado" });
    res.json(centro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener centro" });
  }
});



// Crear un centro
app.post('/api/centros', async (req, res) => {
  try {
    const { nombre, direccion, telefono, email, horario_apertura, horario_cierre } = req.body;

    if (!nombre || !direccion || !telefono || !email || !horario_apertura || !horario_cierre) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const nuevoCentro = await Centro.create({
      nombre,
      direccion,
      telefono,
      email,
      horario_apertura,
      horario_cierre
    });

    res.status(201).json({ mensaje: "Centro creado exitosamente", centro: nuevoCentro });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el centro" });
  }
});



// Actualizar un centro
app.put('/api/centros/:id', async (req, res) => {
  try {
    const actualizado = await Centro.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    if (!actualizado) return res.status(404).json({ error: "Centro no encontrado" });

    res.json({ mensaje: "Centro actualizado exitosamente", centro: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el centro" });
  }
});




// Eliminar un centro
app.delete('/api/centros/:id', async (req, res) => {
  try {
    // Verificar si hay profesionales asignados a este centro
    const profesionales = await Profesional.find({ centro: req.params.id });
    if (profesionales.length > 0) {
      return res.status(400).json({
        error: "No se puede eliminar el centro porque tiene profesionales asignados"
      });
    }

    const eliminado = await Centro.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "Centro no encontrado" });

    res.json({ mensaje: "Centro eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el centro" });
  }
});






// Obtener todos los horarios
app.get('/api/horarios', async (req, res) => {
  try {
    const horarios = await Horario.find().populate('profesional', 'nombre apellidos');
    res.json(horarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener horarios" });
  }
});



// Obtener un horario por _id
app.get('/api/horarios/:id', async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id).populate('profesional', 'nombre apellidos');
    if (!horario) return res.status(404).json({ error: "Horario no encontrado" });
    res.json(horario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener horario" });
  }
});


// Crear un horario
app.post('/api/horarios', async (req, res) => {
  try {
    const { profesional: profesionalId, dias, hora_inicio, hora_fin, fechas_festivas = [] } = req.body;

    if (!profesionalId || !dias || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (hora_inicio >= hora_fin) {
      return res.status(400).json({ error: "La hora de inicio debe ser menor que la hora de fin" });
    }

    // Verificar profesional
    const profesional = await Profesional.findById(profesionalId).populate('usuario');
    if (!profesional) return res.status(404).json({ error: "Profesional no encontrado" });

    // Verificar centro
    const centro = await Centro.findById(profesional.centro);
    if (!centro) return res.status(404).json({ error: "Centro no encontrado" });

    if (hora_inicio < centro.horario_apertura || hora_fin > centro.horario_cierre) {
      return res.status(400).json({
        error: `El horario debe estar dentro de la jornada del centro (${centro.horario_apertura} - ${centro.horario_cierre})`
      });
    }

    // Verificar solapamiento
    const horariosExistentes = await Horario.find({ profesional: profesionalId });
    for (const h of horariosExistentes) {
      const diasEnComun = dias.filter(d => h.dias.includes(d));
      if (diasEnComun.length > 0) {
        if (!(hora_fin <= h.hora_inicio || hora_inicio >= h.hora_fin)) {
          return res.status(400).json({
            error: `El horario se solapa con otro horario del mismo profesional en día(s): ${diasEnComun.join(', ')}`
          });
        }
      }
    }

    const nuevoHorario = await Horario.create({
      profesional: profesionalId,
      dias,
      hora_inicio,
      hora_fin,
      fechas_festivas
    });

    // ========== CREAR NOTIFICACIÓN ==========

    if (profesional.usuario) {
      const diasTexto = dias.join(', ');
      await crearNotificacion(
        profesional.usuario._id,
        'profesional',
        'Nuevo horario asignado',
        `Se ha añadido un nuevo horario a tu agenda: <strong>${diasTexto}</strong> de <strong>${hora_inicio}</strong> a <strong>${hora_fin}</strong>.`,
        'info'
      );
    }

    console.log('✅ Notificación de nuevo horario creada');

    // ==========================================

    res.status(201).json({ mensaje: "Horario creado exitosamente", horario: nuevoHorario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el horario" });
  }
});




// Actualizar horario
app.put('/api/horarios/:id', async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id);
    if (!horario) return res.status(404).json({ error: "Horario no encontrado" });

    const { profesional: profesionalId, dias, hora_inicio, hora_fin, fechas_festivas } = req.body;

    const nuevoProfesionalId = profesionalId || horario.profesional;
    const nuevosDias = dias || horario.dias;
    const nuevaHoraInicio = hora_inicio || horario.hora_inicio;
    const nuevaHoraFin = hora_fin || horario.hora_fin;
    const nuevasFechasFestivas = fechas_festivas !== undefined ? fechas_festivas : horario.fechas_festivas;

    if (nuevaHoraInicio >= nuevaHoraFin) {
      return res.status(400).json({ error: "La hora de inicio debe ser menor que la hora de fin" });
    }

    const profesional = await Profesional.findById(nuevoProfesionalId).populate('usuario');
    if (!profesional) return res.status(404).json({ error: "Profesional no encontrado" });

    const centro = await Centro.findById(profesional.centro);
    if (!centro) return res.status(404).json({ error: "Centro no encontrado" });

    if (nuevaHoraInicio < centro.horario_apertura || nuevaHoraFin > centro.horario_cierre) {
      return res.status(400).json({
        error: `El horario debe estar dentro de la jornada del centro (${centro.horario_apertura} - ${centro.horario_cierre})`
      });
    }

    // Verificar solapamiento (excluyendo el horario actual)
    const horariosExistentes = await Horario.find({ profesional: nuevoProfesionalId, _id: { $ne: req.params.id } });
    for (const h of horariosExistentes) {
      const diasEnComun = nuevosDias.filter(d => h.dias.includes(d));
      if (diasEnComun.length > 0) {
        if (!(nuevaHoraFin <= h.hora_inicio || nuevaHoraInicio >= h.hora_fin)) {
          return res.status(400).json({
            error: `El horario se solapa con otro horario del mismo profesional en día(s): ${diasEnComun.join(', ')}`
          });
        }
      }
    }

    // Detectar cambios ANTES de guardar
    const cambioHoras = (hora_inicio && hora_inicio !== horario.hora_inicio) || (hora_fin && hora_fin !== horario.hora_fin);
    const cambioDias = dias && JSON.stringify(dias) !== JSON.stringify(horario.dias);

    // Guardar fechas antiguas para comparar después
    const fechasFestivasAntiguas = horario.fechas_festivas || [];
    const fechasFestivasNuevas = nuevasFechasFestivas || [];

    console.log('🔍 Comparando fechas festivas:');
    console.log('   - Antiguas:', fechasFestivasAntiguas);
    console.log('   - Nuevas:', fechasFestivasNuevas);

    horario.profesional = nuevoProfesionalId;
    horario.dias = nuevosDias;
    horario.hora_inicio = nuevaHoraInicio;
    horario.hora_fin = nuevaHoraFin;
    horario.fechas_festivas = fechasFestivasNuevas;

    await horario.save();

    // ========== CREAR NOTIFICACIONES ==========

    if (profesional.usuario) {

      // Si cambió días o horas
      if (cambioHoras || cambioDias) {
        const diasTexto = nuevosDias.join(', ');
        await crearNotificacion(
          profesional.usuario._id,
          'profesional',
          'Horario actualizado',
          `Se ha modificado tu horario de trabajo: <strong>${diasTexto}</strong> de <strong>${nuevaHoraInicio}</strong> a <strong>${nuevaHoraFin}</strong>.`,
          'info'
        );
        console.log('✅ Notificación: Horario actualizado');
      }

      // Si se agregaron fechas festivas
      if (fechasFestivasNuevas.length > fechasFestivasAntiguas.length) {
        const nuevasFechas = fechasFestivasNuevas.filter(f => !fechasFestivasAntiguas.includes(f));

        if (nuevasFechas.length > 0) {
          const fechasTexto = nuevasFechas.map(f => formatearFecha(f)).join(', ');

          await crearNotificacion(
            profesional.usuario._id,
            'profesional',
            'Día marcado como no laborable',
            `Se han añadido fechas festivas a tu horario: <strong>${fechasTexto}</strong>. No tendrás citas programadas en esos días.`,
            'info'
          );
          console.log('✅ Notificación: Día marcado como no laborable -', fechasTexto);
        }
      }
    }

    console.log('✅ Proceso de notificaciones de horario completado');

    // ==========================================

    res.json({ mensaje: "Horario actualizado exitosamente", horario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el horario" });
  }
});




// Eliminar un horario
app.delete('/api/horarios/:id', async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id);
    if (!horario) return res.status(404).json({ error: "Horario no encontrado" });

    // Obtener información del horario antes de eliminarlo
    const profesional = await Profesional.findById(horario.profesional).populate('usuario');
    const diasTexto = horario.dias.join(', ');
    const horaInicio = horario.hora_inicio;
    const horaFin = horario.hora_fin;

    // Eliminar el horario
    await Horario.findByIdAndDelete(req.params.id);

    // ========== CREAR NOTIFICACIÓN ==========

    if (profesional && profesional.usuario) {
      await crearNotificacion(
        profesional.usuario._id,
        'profesional',
        'Horario eliminado',
        `Se ha eliminado un horario de tu agenda: <strong>${diasTexto}</strong> de <strong>${horaInicio}</strong> a <strong>${horaFin}</strong>.`,
        'advertencia'
      );
    }

    console.log('✅ Notificación de horario eliminado creada');

    // ==========================================

    res.json({ mensaje: "Horario eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el horario" });
  }
});

// Eliminar todos los horarios de un profesional
app.delete('/api/horarios/profesional/:id', async (req, res) => {
  try {
    const idProfesional = mongoose.Types.ObjectId(req.params.id); // convertir a ObjectId
    const result = await Horario.deleteMany({ profesional: idProfesional });
    res.json({ mensaje: `Horarios del profesional eliminados: ${result.deletedCount}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar los horarios del profesional" });
  }
});







// Obtener todos los profesionales
app.get('/api/profesionales', async (req, res) => {
  try {
    const profesionales = await Profesional.find().populate('usuario', '-password').populate('centro');
    res.json(profesionales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener profesionales" });
  }
});


// Crear un profesional
app.post('/api/profesionales', async (req, res) => {
  try {
    const { id_usuario, nombre, apellidos, centro } = req.body;

    console.log('Datos recibidos para crear profesional:');
    console.log('- id_usuario:', id_usuario);
    console.log('- nombre:', nombre);
    console.log('- apellidos:', apellidos);
    console.log('- centro:', centro);

    // Validar campos obligatorios (apellidos puede ser cadena vacía)
    if (!id_usuario || !nombre || apellidos === undefined || apellidos === null || !centro) {
      console.error('Validación fallida - Faltan datos requeridos');
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Validar que el usuario existe y es profesional
    const usuario = await Usuario.findById(id_usuario);
    if (!usuario) {
      console.error('Usuario no encontrado:', id_usuario);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (usuario.rol !== 'profesional') {
      console.error('Usuario no es profesional:', usuario.rol);
      return res.status(400).json({ error: "El usuario debe tener rol 'profesional'" });
    }

    // Validar que no exista ya un profesional para ese usuario
    const profesionalExistente = await Profesional.findOne({ usuario: id_usuario });
    if (profesionalExistente) {
      console.error('Ya existe profesional para este usuario');
      return res.status(400).json({ error: "Ya existe un profesional asociado a este usuario" });
    }

    // Crear el profesional
    const nuevoProfesional = await Profesional.create({
      usuario: id_usuario,
      nombre,
      apellidos: apellidos || 'Sin apellidos',  // Valor por defecto si está vacío
      centro
    });

    console.log('Profesional creado exitosamente:', nuevoProfesional);
    res.status(201).json({ mensaje: "Profesional creado exitosamente", profesional: nuevoProfesional });
  } catch (error) {
    console.error('Error al crear profesional:', error);
    res.status(500).json({ error: "Error al crear el profesional" });
  }
});


// Obtener un profesional por _id
app.get('/api/profesionales/:id', async (req, res) => {
  try {
    const profesional = await Profesional.findById(req.params.id).populate('usuario', '-password').populate('centro');
    if (!profesional) return res.status(404).json({ error: "Profesional no encontrado" });
    res.json(profesional);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el profesional" });
  }
});


// Actualizar profesional
app.put('/api/profesionales/:id', async (req, res) => {
  try {
    const actualizado = await Profesional.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    if (!actualizado) return res.status(404).json({ error: "Profesional no encontrado" });

    res.json({ mensaje: "Profesional actualizado", profesional: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar profesional" });
  }
});



// Eliminar profesional
app.delete('/api/profesionales/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ ========================================');
    console.log('🗑️ ELIMINANDO PROFESIONAL');
    console.log('🗑️ ID recibido:', id);

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ error: "ID de profesional no válido" });
    }

    // PASO 1: Buscar el profesional
    const profesional = await Profesional.findById(id);
    if (!profesional) {
      console.log('❌ Profesional no encontrado con _id:', id);
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    console.log(`✓ Profesional encontrado: ${profesional.nombre} ${profesional.apellidos}`);

    // PASO 2: Eliminar relaciones profesional_servicio
    const relacionesEliminadas = await ProfesionalServicio.deleteMany({ profesional: id });
    console.log(`✅ Relaciones profesional_servicio eliminadas: ${relacionesEliminadas.deletedCount}`);

    // PASO 3: Eliminar horarios del profesional
    const horariosEliminados = await Horario.deleteMany({ profesional: id });
    console.log(`✅ Horarios eliminados: ${horariosEliminados.deletedCount}`);

    // PASO 4: Actualizar/eliminar citas del profesional
    const citasActualizadas = await Cita.updateMany(
      { profesional: id, estado: { $ne: 'completada' } },
      { $set: { estado: 'cancelada', canceladaPor: 'sistema' } }
    );
    console.log(`✅ Citas actualizadas a canceladas: ${citasActualizadas.modifiedCount}`);

    // PASO 5: Eliminar el profesional
    const eliminado = await Profesional.findByIdAndDelete(id);
    console.log(`✅ Profesional eliminado: ${eliminado.nombre} ${eliminado.apellidos}`);
    console.log('🗑️ ========================================');

    res.json({
      mensaje: "Profesional eliminado exitosamente",
      relacionesEliminadas: relacionesEliminadas.deletedCount,
      horariosEliminados: horariosEliminados.deletedCount,
      citasActualizadas: citasActualizadas.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error al eliminar profesional:', error);
    res.status(500).json({ error: "Error al eliminar profesional" });
  }
});




// Actualizar usuario (solo rol y estado) - MongoDB
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, estado } = req.body;

    console.log('📝 Actualizando usuario con _id:', id);
    console.log('Datos a actualizar:', { rol, estado });

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ error: "ID de usuario no válido" });
    }

    // Buscar y actualizar solo los campos permitidos
    const actualizado = await Usuario.findByIdAndUpdate(
      id,
      { ...(rol && { rol }), ...(estado !== undefined && { estado }) },
      { new: true }
    );

    if (!actualizado) {
      console.log('❌ Usuario no encontrado con _id:', id);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log('✅ Usuario actualizado:', actualizado.email);

    // Eliminar la contraseña antes de enviar la respuesta
    const { password, ...usuarioSeguro } = actualizado.toObject();

    res.json({
      mensaje: "Usuario actualizado exitosamente",
      usuario: usuarioSeguro
    });

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ error: "Error al actualizar usuario", detalle: error.message });
  }
});


// Eliminar usuario con validaciones - MongoDB
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;             // _id de MongoDB del usuario a eliminar
    const id_admin = req.query.id_admin;   // _id del admin que intenta eliminar (desde query param)

    console.log(`\n=== ELIMINANDO USUARIO _id: ${id} ===`);
    console.log(`ID Admin: ${id_admin}`);

    // Validar que los IDs sean ObjectId válidos
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ ID de usuario no válido:', id);
      return res.status(400).json({ error: "ID de usuario no válido" });
    }

    if (!id_admin || !mongoose.Types.ObjectId.isValid(id_admin)) {
      console.error('❌ ID de admin no válido:', id_admin);
      return res.status(400).json({ error: "ID de admin no válido" });
    }

    // 1️⃣ Buscar usuario a eliminar
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`Usuario encontrado: ${usuario.nombre}, Rol: ${usuario.rol}`);

    // 2️⃣ Validación: solo admin puede eliminar admin
    if (usuario.rol === 'administrador') {
      const admin = await Usuario.findById(id_admin);
      if (!admin || admin.rol !== 'administrador') {
        return res.status(403).json({ error: "Solo un administrador puede eliminar otro administrador" });
      }
    }

    // 3️⃣ Borrado en cascada si es profesional
    if (usuario.rol === 'profesional') {
      console.log('🔍 Es profesional, eliminando registros relacionados...');
      console.log('🔍 Buscando profesional con usuario._id:', id);

      // Buscar el profesional por el campo 'usuario' - Mongoose convierte automáticamente el string a ObjectId
      const profesional = await Profesional.findOne({ usuario: id });

      if (profesional) {
        console.log(`✓ Profesional encontrado: ${profesional.nombre} ${profesional.apellidos} (_id: ${profesional._id})`);

        // 3.1.1 Eliminar horarios del profesional (usando el campo 'profesional' que es el _id del profesional)
        try {
          const result = await Horario.deleteMany({ profesional: profesional._id });
          console.log(`✓ Horarios eliminados: ${result.deletedCount}`);
        } catch (e) {
          console.error('Error eliminando horarios:', e.message);
        }

        // 3.1.2 Eliminar relaciones profesional-servicio (usando el campo 'profesional')
        try {
          const result = await ProfesionalServicio.deleteMany({ profesional: profesional._id });
          console.log(`✓ Relaciones con servicios eliminadas: ${result.deletedCount}`);
        } catch (e) {
          console.error('Error eliminando relaciones profesional-servicio:', e.message);
        }

        // 3.1.3 Eliminar citas del profesional (usando el campo 'profesional')
        try {
          const result = await Cita.deleteMany({ profesional: profesional._id });
          console.log(`✓ Citas del profesional eliminadas: ${result.deletedCount}`);
        } catch (e) {
          console.error('Error eliminando citas:', e.message);
        }

        // 3.1.4 Eliminar el profesional
        try {
          const deleteResult = await Profesional.findByIdAndDelete(profesional._id);
          if (deleteResult) {
            console.log('✓ Profesional eliminado de la colección profesionales');
          } else {
            console.error('❌ No se pudo eliminar el profesional - findByIdAndDelete retornó null');
          }
        } catch (e) {
          console.error('❌ ERROR CRÍTICO eliminando profesional:', e);
          console.error('Stack:', e.stack);
        }
      } else {
        console.error('⚠️⚠️⚠️ PROBLEMA: No se encontró profesional asociado a este usuario');
        console.error('⚠️ Usuario a eliminar tiene rol "profesional" pero no existe en la colección Profesional');
        console.error('⚠️ Esto indica que el usuario fue creado sin crear su registro de profesional');
      }
    }

    // 4️⃣ Eliminar notificaciones del usuario
    try {
      const result = await Notificacion.deleteMany({ usuario: id });
      console.log(`✓ Notificaciones eliminadas: ${result.deletedCount}`);
    } catch (e) {
      console.error('Error eliminando notificaciones:', e.message);
    }

    // 5️⃣ Eliminar citas del usuario como cliente
    try {
      const result = await Cita.deleteMany({ usuario: id });
      console.log(`✓ Citas como cliente eliminadas: ${result.deletedCount}`);
    } catch (e) {
      console.error('Error eliminando citas como cliente:', e.message);
    }

    // 6️⃣ Eliminar usuario
    await Usuario.findByIdAndDelete(id);
    console.log(`✓ Usuario eliminado: ${usuario.nombre}`);
    console.log('=== ELIMINACIÓN COMPLETADA ===\n');

    res.json({ mensaje: "Usuario eliminado exitosamente" });

  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ error: "Error al eliminar usuario", detalle: error.message });
  }
});








// ============= FUNCIONES HELPER PARA NOTIFICACIONES =============

// Función helper para crear notificación
async function crearNotificacion(usuario, rolDestino, titulo, mensaje, tipo = 'info') {
  try {
    const notificacion = new Notificacion({
      usuario,
      rolDestino,
      titulo,
      mensaje,
      tipo,
      leida: false
    });
    await notificacion.save();
    console.log(`✅ Notificación creada para usuario ${usuario}: ${titulo}`);
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
  }
}

// Función para obtener todos los administradores
async function obtenerAdministradores() {
  try {
    const admins = await Usuario.find({ rol: 'administrador', estado: 'activo' });
    return admins.map(admin => admin._id);
  } catch (error) {
    console.error('Error al obtener administradores:', error);
    return [];
  }
}

// Función para obtener nivel de fidelidad según puntos
function getNivelFidelidad(puntos) {
  if (puntos >= 100) return { nivel: 'premium', nombre: 'Cliente Premium' };
  if (puntos >= 50) return { nivel: 'habitual', nombre: 'Cliente Habitual' };
  if (puntos >= 20) return { nivel: 'frecuente', nombre: 'Cliente Frecuente' };
  return { nivel: 'nuevo', nombre: 'Cliente Nuevo' };
}

// Función para formatear fecha
function formatearFecha(fecha) {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// ============= FIN FUNCIONES HELPER =============


// ============= ENDPOINTS PARA CITAS =============

// GET: Obtener todas las citas (con populate)
app.get('/api/citas', async (req, res) => {
  try {
    const citas = await Cita.find()
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion')
      .sort({ fecha: -1, hora: -1 });
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

// GET: Obtener citas de un usuario específico
app.get('/api/citas/usuario/:id', async (req, res) => {
  try {
    const citas = await Cita.find({ usuario: req.params.id })
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion')
      .sort({ fecha: -1, hora: -1 });
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas del usuario:', error);
    res.status(500).json({ error: "Error al obtener citas del usuario" });
  }
});

// GET: Obtener citas de un profesional específico
app.get('/api/citas/profesional/:id', async (req, res) => {
  try {
    const citas = await Cita.find({ profesional: req.params.id })
      .populate('usuario', 'nombre email')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion')
      .sort({ fecha: -1, hora: -1 });
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas del profesional:', error);
    res.status(500).json({ error: "Error al obtener citas del profesional" });
  }
});

// GET: Obtener una cita por _id
app.get('/api/citas/:id', async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json(cita);
  } catch (error) {
    console.error('Error al obtener la cita:', error);
    res.status(500).json({ error: "Error al obtener la cita" });
  }
});

// POST: Crear nueva cita
app.post('/api/citas', async (req, res) => {
  try {
    const { usuario, profesional, servicio, centro, fecha, hora } = req.body;

    // Validar campos requeridos
    if (!usuario || !profesional || !servicio || !centro || !fecha || !hora) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Verificar que no exista otra cita en el mismo horario para el mismo profesional
    const citaExistente = await Cita.findOne({ profesional, fecha, hora });
    if (citaExistente) {
      return res.status(400).json({ error: "Ya existe una cita para ese profesional en ese horario" });
    }

    // Obtener el precio del servicio
    const servicioDB = await Servicio.findById(servicio);
    if (!servicioDB) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const nuevaCita = new Cita({
      usuario,
      profesional,
      servicio,
      centro,
      fecha,
      hora,
      precio: servicioDB.precio,
      estado: 'pendiente'
    });

    await nuevaCita.save();

    // Devolver la cita con populate
    const citaCreada = await Cita.findById(nuevaCita._id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

    // ========== CREAR NOTIFICACIONES ==========

    const fechaFormateada = formatearFecha(fecha);
    const nombreUsuario = citaCreada.usuario.nombre;
    const nombreProfesional = citaCreada.profesional.nombre + ' ' + citaCreada.profesional.apellidos;
    const nombreServicio = citaCreada.servicio.nombre;
    const nombreCentro = citaCreada.centro.nombre;

    // 1. Notificación para el CLIENTE
    await crearNotificacion(
      usuario,
      'cliente',
      'Reserva realizada',
      `Has reservado una cita para <strong>${nombreServicio}</strong> con ${nombreProfesional} el <strong>${fechaFormateada}</strong> a las <strong>${hora}</strong>. Tu cita está <strong>pendiente de confirmación</strong>.`,
      'exito'
    );

    // 2. Notificación para el PROFESIONAL
    const profesionalDB = await Profesional.findById(profesional).populate('usuario');
    if (profesionalDB && profesionalDB.usuario) {
      await crearNotificacion(
        profesionalDB.usuario._id,
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

    console.log('✅ Notificaciones de nueva cita creadas exitosamente');

    // ==========================================

    res.status(201).json({ mensaje: "Cita creada exitosamente", cita: citaCreada });
  } catch (error) {
    console.error('Error al crear cita:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Ya existe una cita para ese profesional en ese horario" });
    }
    res.status(500).json({ error: "Error al crear la cita" });
  }
});

// PUT: Actualizar cita (cambiar estado, fecha, hora, etc.)
app.put('/api/citas/:id', async (req, res) => {
  try {
    const { estado, fecha, hora, actualizadoPor, rolActualizador } = req.body;

    const cita = await Cita.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const estadoAnterior = cita.estado;

    // Si se cambia fecha u hora, verificar disponibilidad
    if ((fecha && fecha !== cita.fecha) || (hora && hora !== cita.hora)) {
      const nuevaFecha = fecha || cita.fecha;
      const nuevaHora = hora || cita.hora;

      const citaExistente = await Cita.findOne({
        profesional: cita.profesional._id,
        fecha: nuevaFecha,
        hora: nuevaHora,
        _id: { $ne: req.params.id }
      });

      if (citaExistente) {
        return res.status(400).json({ error: "Ya existe una cita para ese profesional en ese horario" });
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
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

    // ========== CREAR NOTIFICACIONES SEGÚN CAMBIOS ==========

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

    console.log('✅ Notificaciones de actualización de cita creadas');

    // ==========================================

    res.json({ mensaje: "Cita actualizada exitosamente", cita: citaActualizada });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ error: "Error al actualizar la cita" });
  }
});

// DELETE: Cancelar/eliminar cita
app.delete('/api/citas/:id', async (req, res) => {
  try {
    const cita = await Cita.findByIdAndDelete(req.params.id);

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json({ mensaje: "Cita eliminada exitosamente" });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ error: "Error al eliminar la cita" });
  }
});

// PUT: Marcar cita como realizada (cambia estado y suma puntos)
app.put('/api/citas/:id/marcar-realizada', async (req, res) => {
  try {
    const { marcadoPor, rolMarcador } = req.body; // Quién marca la cita

    const cita = await Cita.findById(req.params.id)
      .populate('usuario', 'nombre email puntos')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (cita.estado === 'realizada') {
      return res.status(400).json({ error: "La cita ya fue marcada como realizada" });
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
      // Asegurarse de que puntos no sea undefined o null
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

      console.log(`✅ Puntos actualizados: ${puntosActuales} → ${puntosNuevos}`);
      console.log(`   Nivel: ${nivelAnterior} → ${nivelNuevo} ${subioNivel ? '🏆 ¡SUBIÓ DE NIVEL!' : ''}`);
    }

    // ========== CREAR NOTIFICACIONES ==========

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
      // Notificar al profesional
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
      // Notificar a admins
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

    console.log('✅ Notificaciones de cita realizada creadas');

    // ==========================================

    return res.json({
      mensaje: "Cita marcada como realizada y puntos sumados",
      cita,
      puntosSumados: 10,
      puntosActuales: puntosNuevos,
      subioNivel,
      nivelActual: Math.floor(puntosNuevos / 100)
    });
  } catch (error) {
    console.error('Error al marcar cita como realizada:', error);
    res.status(500).json({ error: "Error al procesar la cita" });
  }
});

// GET: Verificar disponibilidad de un profesional en fecha/hora específica
app.get('/api/citas/disponibilidad/:profesionalId/:fecha/:hora', async (req, res) => {
  try {
    const { profesionalId, fecha, hora } = req.params;

    const citaExistente = await Cita.findOne({
      profesional: profesionalId,
      fecha,
      hora,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    res.json({ disponible: !citaExistente });
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ error: "Error al verificar disponibilidad" });
  }
});

// ============= FIN ENDPOINTS CITAS =============



// ============= ENDPOINTS PARA NOTIFICACIONES =============

// GET: Obtener todas las notificaciones de un usuario
app.get('/api/notificaciones/usuario/:id', async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: req.params.id })
      .sort({ createdAt: -1 });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

// GET: Obtener notificaciones no leídas de un usuario
app.get('/api/notificaciones/usuario/:id/no-leidas', async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({
      usuario: req.params.id,
      leida: false
    }).sort({ createdAt: -1 });

    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones no leídas:', error);
    res.status(500).json({ error: "Error al obtener notificaciones no leídas" });
  }
});

// GET: Contar notificaciones no leídas de un usuario
app.get('/api/notificaciones/usuario/:id/contar-no-leidas', async (req, res) => {
  try {
    const count = await Notificacion.countDocuments({
      usuario: req.params.id,
      leida: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    res.status(500).json({ error: "Error al contar notificaciones" });
  }
});

// POST: Crear nueva notificación
app.post('/api/notificaciones', async (req, res) => {
  try {
    const { usuario, rolDestino, titulo, mensaje, tipo } = req.body;

    if (!usuario || !rolDestino || !titulo || !mensaje) {
      return res.status(400).json({ error: "Faltan campos requeridos (usuario, rolDestino, titulo, mensaje)" });
    }

    const nuevaNotificacion = new Notificacion({
      usuario,
      rolDestino,
      titulo,
      mensaje,
      tipo: tipo || 'info',
      leida: false
    });

    await nuevaNotificacion.save();
    res.status(201).json({ mensaje: "Notificación creada exitosamente", notificacion: nuevaNotificacion });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: "Error al crear la notificación" });
  }
});

// PUT: Marcar notificación como leída
app.put('/api/notificaciones/:id/marcar-leida', async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(
      req.params.id,
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ mensaje: "Notificación marcada como leída", notificacion });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: "Error al actualizar la notificación" });
  }
});

// PUT: Marcar todas las notificaciones de un usuario como leídas
app.put('/api/notificaciones/usuario/:id/marcar-todas-leidas', async (req, res) => {
  try {
    const result = await Notificacion.updateMany(
      { usuario: req.params.id, leida: false },
      { leida: true }
    );

    res.json({
      mensaje: "Todas las notificaciones marcadas como leídas",
      actualizadas: result.modifiedCount
    });
  } catch (error) {
    console.error('Error al marcar notificaciones como leídas:', error);
    res.status(500).json({ error: "Error al actualizar las notificaciones" });
  }
});

// DELETE: Eliminar una notificación
app.delete('/api/notificaciones/:id', async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndDelete(req.params.id);

    if (!notificacion) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ mensaje: "Notificación eliminada exitosamente" });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: "Error al eliminar la notificación" });
  }
});

// DELETE: Eliminar todas las notificaciones de un usuario
app.delete('/api/notificaciones/usuario/:id', async (req, res) => {
  try {
    const result = await Notificacion.deleteMany({ usuario: req.params.id });

    res.json({
      mensaje: "Notificaciones eliminadas exitosamente",
      eliminadas: result.deletedCount
    });
  } catch (error) {
    console.error('Error al eliminar notificaciones:', error);
    res.status(500).json({ error: "Error al eliminar las notificaciones" });
  }
});

// ============= FIN ENDPOINTS NOTIFICACIONES =============


app.listen(3001, () => console.log("API en http://localhost:3001"));
