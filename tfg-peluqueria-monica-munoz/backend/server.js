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

    console.log('🗑️ Eliminando servicio con _id:', id);

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID no válido:', id);
      return res.status(400).json({ mensaje: "ID de servicio no válido" });
    }

    const eliminado = await Servicio.findByIdAndDelete(id);

    if (!eliminado) {
      console.log('❌ Servicio no encontrado con _id:', id);
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    console.log('✅ Servicio eliminado:', eliminado.nombre);
    res.json({ mensaje: 'Servicio eliminado' });
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
    const profesional = await Profesional.findById(profesionalId);
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

    if (nuevaHoraInicio >= nuevaHoraFin) {
      return res.status(400).json({ error: "La hora de inicio debe ser menor que la hora de fin" });
    }

    const profesional = await Profesional.findById(nuevoProfesionalId);
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

    horario.profesional = nuevoProfesionalId;
    horario.dias = nuevosDias;
    horario.hora_inicio = nuevaHoraInicio;
    horario.hora_fin = nuevaHoraFin;
    if (fechas_festivas !== undefined) horario.fechas_festivas = fechas_festivas;

    await horario.save();
    res.json({ mensaje: "Horario actualizado exitosamente", horario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el horario" });
  }
});




// Eliminar un horario
app.delete('/api/horarios/:id', async (req, res) => {
  try {
    const eliminado = await Horario.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "Horario no encontrado" });

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

    if (!id_usuario || !nombre || !apellidos || !centro) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Validar que el usuario existe y es profesional
    const usuario = await Usuario.findById(id_usuario);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    if (usuario.rol !== 'profesional') return res.status(400).json({ error: "El usuario debe tener rol 'profesional'" });

    // Validar que no exista ya un profesional para ese usuario
    const profesionalExistente = await Profesional.findOne({ usuario: id_usuario });
    if (profesionalExistente) return res.status(400).json({ error: "Ya existe un profesional asociado a este usuario" });

    // Crear el profesional
    const nuevoProfesional = await Profesional.create({
      usuario: id_usuario,
      nombre,
      apellidos,
      centro
    });

    res.status(201).json({ mensaje: "Profesional creado exitosamente", profesional: nuevoProfesional });
  } catch (error) {
    console.error(error);
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
    const eliminado = await Profesional.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "Profesional no encontrado" });

    res.json({ mensaje: "Profesional eliminado" });
  } catch (error) {
    console.error(error);
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

    // Validar que los IDs sean ObjectId válidos
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(id_admin)) {
      return res.status(400).json({ error: "ID de usuario o admin no válido" });
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

      // 3.1 Eliminar horarios
      try {
        const result = await Horario.deleteMany({ id_profesional: usuario._id });
        console.log(`✓ Horarios eliminados: ${result.deletedCount}`);
      } catch (e) {
        console.error('Error eliminando horarios:', e.message);
      }

      // 3.2 Eliminar relaciones profesional-servicio
      try {
        const result = await ProfesionalServicio.deleteMany({ id_profesional: usuario._id });
        console.log(`✓ Relaciones con servicios eliminadas: ${result.deletedCount}`);
      } catch (e) {
        console.error('Error eliminando relaciones profesional-servicio:', e.message);
      }

      // 3.3 Eliminar profesional
      try {
        const result = await Profesional.deleteOne({ id_usuario: usuario._id });
        if (result.deletedCount) console.log('✓ Profesional eliminado de la colección profesional');
      } catch (e) {
        console.error('Error eliminando profesional:', e.message);
      }
    }

    // 4️⃣ Eliminar usuario
    await Usuario.findByIdAndDelete(id);
    console.log(`✓ Usuario eliminado: ${usuario.nombre}`);
    console.log('=== ELIMINACIÓN COMPLETADA ===\n');

    res.json({ mensaje: "Usuario eliminado exitosamente" });

  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ error: "Error al eliminar usuario", detalle: error.message });
  }
});








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
    const { usuario, profesional, servicio, centro, fecha, hora, notas, precio } = req.body;

    // Validar campos requeridos
    if (!usuario || !profesional || !servicio || !centro || !fecha || !hora || !precio) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Verificar que no exista otra cita en el mismo horario para el mismo profesional
    const citaExistente = await Cita.findOne({ profesional, fecha, hora });
    if (citaExistente) {
      return res.status(400).json({ error: "Ya existe una cita para ese profesional en ese horario" });
    }

    const nuevaCita = new Cita({
      usuario,
      profesional,
      servicio,
      centro,
      fecha,
      hora,
      notas: notas || '',
      precio,
      estado: 'pendiente'
    });

    await nuevaCita.save();

    // Devolver la cita con populate
    const citaCreada = await Cita.findById(nuevaCita._id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

    res.status(201).json({ mensaje: "Cita creada exitosamente", cita: citaCreada });
  } catch (error) {
    console.error('Error al crear cita:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Ya existe una cita para ese profesional en ese horario" });
    }
    res.status(500).json({ error: "Error al crear la cita" });
  }
});

// PUT: Actualizar cita (cambiar estado, notas, fecha, hora, etc.)
app.put('/api/citas/:id', async (req, res) => {
  try {
    const { estado, fecha, hora, notas } = req.body;

    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Si se cambia fecha u hora, verificar disponibilidad
    if ((fecha && fecha !== cita.fecha) || (hora && hora !== cita.hora)) {
      const nuevaFecha = fecha || cita.fecha;
      const nuevaHora = hora || cita.hora;

      const citaExistente = await Cita.findOne({
        profesional: cita.profesional,
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
    if (notas !== undefined) cita.notas = notas;

    await cita.save();

    const citaActualizada = await Cita.findById(cita._id)
      .populate('usuario', 'nombre email')
      .populate('profesional', 'nombre apellidos')
      .populate('servicio', 'nombre precio duracion')
      .populate('centro', 'nombre direccion');

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
    const cita = await Cita.findById(req.params.id);

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
    const usuario = await Usuario.findById(cita.usuario);
    if (usuario && usuario.rol === 'cliente') {
      const puntosActuales = usuario.puntos || 0;
      const puntosNuevos = puntosActuales + 10;

      usuario.puntos = puntosNuevos;
      await usuario.save();

      return res.json({
        mensaje: "Cita marcada como realizada y puntos sumados",
        cita,
        puntosSumados: 10,
        puntosActuales: puntosNuevos
      });
    }

    res.json({ mensaje: "Cita marcada como realizada", cita });
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
    const { usuario, titulo, mensaje, tipo } = req.body;

    if (!usuario || !titulo || !mensaje) {
      return res.status(400).json({ error: "Faltan campos requeridos (usuario, titulo, mensaje)" });
    }

    const nuevaNotificacion = new Notificacion({
      usuario,
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
