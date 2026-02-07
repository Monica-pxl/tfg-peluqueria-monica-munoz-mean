const mongoose = require('mongoose');
const Servicio = require('./models/servicio');
const Usuario = require('./models/usuario');
const Centro = require('./models/centro');
const Horario = require('./models/horario');
const ProfesionalServicio = require('./models/profesionalServicio');
const Profesional = require('./models/profesional');


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






app.get('/api/profesional_servicio', (req, res) => {
  res.json(leerJSON('profesional_servicio.json'));
});


app.post('/api/profesional_servicio', (req, res) => {
  const relaciones = leerJSON('profesional_servicio.json');
  const nueva = req.body;

  // Verificar si ya existe esta relación (evitar duplicados)
  const yaExiste = relaciones.find(
    r => r.id_profesional === nueva.id_profesional && r.id_servicio === nueva.id_servicio
  );

  if (yaExiste) {
    console.log('Relación duplicada detectada y rechazada:', nueva);
    return res.status(200).json(nueva); // Devolver éxito sin duplicar
  }

  // No agregar id_relacion, solo los campos necesarios
  relaciones.push(nueva);

  escribirJSON('profesional_servicio.json', relaciones);

  res.status(201).json(nueva);
});


app.delete('/api/profesional_servicio/servicio/:id', (req, res) => {
  const relaciones = leerJSON('profesional_servicio.json');
  const id_servicio = Number(req.params.id);

  const nuevas = relaciones.filter(r => r.id_servicio !== id_servicio);
  escribirJSON('profesional_servicio.json', nuevas);

  res.json({ mensaje: 'Relaciones eliminadas por servicio' });
});


app.delete('/api/profesional_servicio/profesional/:id', (req, res) => {
  const relaciones = leerJSON('profesional_servicio.json');
  const id_profesional = Number(req.params.id);

  const nuevas = relaciones.filter(r => r.id_profesional !== id_profesional);
  escribirJSON('profesional_servicio.json', nuevas);

  res.json({ mensaje: 'Relaciones eliminadas por profesional' });
});


app.delete('/api/profesional_servicio/:id', (req, res) => {
  const relaciones = leerJSON('profesional_servicio.json');
  const id = Number(req.params.id);

  const nuevas = relaciones.filter(r => r.id_relacion !== id);
  escribirJSON('profesional_servicio.json', nuevas);

  res.json({ mensaje: 'Relación eliminada' });
});





app.get('/api/centros', (req, res) => {
  res.json(leerJSON('centros.json'));
});

app.get('/api/centros/:id', (req, res) => {
  const centros = leerJSON('centros.json');
  const centro = centros.find(c => c.id_centro === Number(req.params.id));

  if (!centro) return res.status(404).json({ error: "Centro no encontrado" });

  res.json(centro);
});

app.post('/api/centros', (req, res) => {
  try {
    const { nombre, direccion, telefono, email, horario_apertura, horario_cierre } = req.body;

    if (!nombre || !direccion || !telefono || !email || !horario_apertura || !horario_cierre) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const centros = leerJSON('centros.json');
    const nuevoCentro = {
      id_centro: Math.max(...centros.map(c => c.id_centro), 0) + 1,
      nombre,
      direccion,
      telefono,
      email,
      horario_apertura,
      horario_cierre
    };

    centros.push(nuevoCentro);
    escribirJSON('centros.json', centros);

    res.status(201).json({ mensaje: "Centro creado exitosamente", centro: nuevoCentro });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el centro" });
  }
});

app.put('/api/centros/:id', (req, res) => {
  try {
    const centros = leerJSON('centros.json');
    const id = Number(req.params.id);

    const index = centros.findIndex(c => c.id_centro === id);
    if (index === -1) return res.status(404).json({ error: "Centro no encontrado" });

    centros[index] = { ...centros[index], ...req.body, id_centro: id };

    escribirJSON('centros.json', centros);
    res.json({ mensaje: "Centro actualizado exitosamente", centro: centros[index] });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el centro" });
  }
});

app.delete('/api/centros/:id', (req, res) => {
  try {
    const id = Number(req.params.id);

    // Verificar si hay profesionales asignados a este centro
    const profesionales = leerJSON('profesionales.json');
    const tieneProfesionales = profesionales.some(p => p.id_centro === id);

    if (tieneProfesionales) {
      return res.status(400).json({
        error: "No se puede eliminar el centro porque tiene profesionales asignados"
      });
    }

    const centros = leerJSON('centros.json');
    const nuevos = centros.filter(c => c.id_centro !== id);

    if (centros.length === nuevos.length) {
      return res.status(404).json({ error: "Centro no encontrado" });
    }

    escribirJSON('centros.json', nuevos);
    res.json({ mensaje: "Centro eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el centro" });
  }
});

app.get('/api/horarios', (req, res) => {
  res.json(leerJSON('horarios.json'));
});

app.get('/api/horarios/:id', (req, res) => {
  const horarios = leerJSON('horarios.json');
  const horario = horarios.find(h => h.id_horario === Number(req.params.id));

  if (!horario) return res.status(404).json({ error: "Horario no encontrado" });

  res.json(horario);
});

app.post('/api/horarios', (req, res) => {
  try {
    const { id_profesional, dias, hora_inicio, hora_fin, fechas_festivas = [] } = req.body;

    if (!id_profesional || !dias || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar que hora_inicio < hora_fin
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({ error: "La hora de inicio debe ser menor que la hora de fin" });
    }

    // Validar que el horario esté dentro de la jornada del centro
    const profesionales = leerJSON('profesionales.json');
    const profesional = profesionales.find(p => p.id_profesional === Number(id_profesional));

    console.log('Buscando profesional con ID:', id_profesional, 'Tipo:', typeof id_profesional);
    console.log('Profesional encontrado:', profesional);

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    const centros = leerJSON('centros.json');
    const centro = centros.find(c => c.id_centro === profesional.id_centro);

    if (!centro) {
      return res.status(404).json({ error: "Centro no encontrado" });
    }

    console.log(`Validando horario: ${hora_inicio} - ${hora_fin} dentro de ${centro.horario_apertura} - ${centro.horario_cierre}`);

    if (hora_inicio < centro.horario_apertura || hora_fin > centro.horario_cierre) {
      console.log('ERROR: Horario fuera de la jornada del centro');
      return res.status(400).json({
        error: `El horario debe estar dentro de la jornada del centro (${centro.horario_apertura} - ${centro.horario_cierre})`
      });
    }

    const horarios = leerJSON('horarios.json');

    // Validar solapamiento con otros horarios del mismo profesional
    const horariosDelProfesional = horarios.filter(h => h.id_profesional === Number(id_profesional));

    for (const horarioExistente of horariosDelProfesional) {
      // Verificar si hay días en común
      const diasEnComun = dias.filter(dia => horarioExistente.dias.includes(dia));

      if (diasEnComun.length > 0) {
        // Verificar solapamiento de horas
        const inicioNuevo = hora_inicio;
        const finNuevo = hora_fin;
        const inicioExistente = horarioExistente.hora_inicio;
        const finExistente = horarioExistente.hora_fin;

        if (!(finNuevo <= inicioExistente || inicioNuevo >= finExistente)) {
          return res.status(400).json({
            error: `El horario se solapa con otro horario del mismo profesional en día(s): ${diasEnComun.join(', ')}`
          });
        }
      }
    }

    const nuevoHorario = {
      id_horario: Math.max(...horarios.map(h => h.id_horario), 0) + 1,
      id_profesional: Number(id_profesional),
      dias,
      hora_inicio,
      hora_fin,
      fechas_festivas: fechas_festivas || []
    };

    horarios.push(nuevoHorario);
    escribirJSON('horarios.json', horarios);

    res.status(201).json({ mensaje: "Horario creado exitosamente", horario: nuevoHorario });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el horario" });
  }
});

app.put('/api/horarios/:id', (req, res) => {
  try {
    const horarios = leerJSON('horarios.json');
    const id = Number(req.params.id);

    const index = horarios.findIndex(h => h.id_horario === id);
    if (index === -1) return res.status(404).json({ error: "Horario no encontrado" });

    const horarioActual = horarios[index];
    const { id_profesional, dias, hora_inicio, hora_fin, fechas_festivas } = req.body;

    // Validar que hora_inicio < hora_fin
    const horaInicio = hora_inicio || horarioActual.hora_inicio;
    const horaFin = hora_fin || horarioActual.hora_fin;

    if (horaInicio >= horaFin) {
      return res.status(400).json({ error: "La hora de inicio debe ser menor que la hora de fin" });
    }

    // Validar que el horario esté dentro de la jornada del centro
    const idProfesional = id_profesional !== undefined ? id_profesional : horarioActual.id_profesional;

    const profesionales = leerJSON('profesionales.json');
    const profesional = profesionales.find(p => p.id_profesional === idProfesional);

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    const centros = leerJSON('centros.json');
    const centro = centros.find(c => c.id_centro === profesional.id_centro);

    if (!centro) {
      return res.status(404).json({ error: "Centro no encontrado" });
    }

    console.log(`Validando horario: ${horaInicio} - ${horaFin} dentro de ${centro.horario_apertura} - ${centro.horario_cierre}`);

    if (horaInicio < centro.horario_apertura || horaFin > centro.horario_cierre) {
      console.log('ERROR: Horario fuera de la jornada del centro');
      return res.status(400).json({
        error: `El horario debe estar dentro de la jornada del centro (${centro.horario_apertura} - ${centro.horario_cierre})`
      });
    }

    // Validar solapamiento con otros horarios del mismo profesional (excluyendo el actual)
    const diasNuevos = dias || horarioActual.dias;

    const horariosDelProfesional = horarios.filter(h =>
      h.id_profesional === idProfesional && h.id_horario !== id
    );

    for (const horarioExistente of horariosDelProfesional) {
      const diasEnComun = diasNuevos.filter(dia => horarioExistente.dias.includes(dia));

      if (diasEnComun.length > 0) {
        const inicioExistente = horarioExistente.hora_inicio;
        const finExistente = horarioExistente.hora_fin;

        if (!(horaFin <= inicioExistente || horaInicio >= finExistente)) {
          return res.status(400).json({
            error: `El horario se solapa con otro horario del mismo profesional en día(s): ${diasEnComun.join(', ')}`
          });
        }
      }
    }

    // Actualizar el horario con el nuevo campo fechas_festivas
    const horarioActualizado = {
      ...horarioActual,
      ...req.body,
      id_horario: id
    };

    // Si fechas_festivas viene en el request, usarlas directamente
    if (fechas_festivas !== undefined) {
      horarioActualizado.fechas_festivas = fechas_festivas;
    }

    horarios[index] = horarioActualizado;

    escribirJSON('horarios.json', horarios);
    res.json({ mensaje: "Horario actualizado exitosamente", horario: horarios[index] });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el horario" });
  }
});

app.delete('/api/horarios/:id', (req, res) => {
  const horarios = leerJSON('horarios.json');
  const id = Number(req.params.id);

  const nuevos = horarios.filter(h => h.id_horario !== id);

  if (nuevos.length === horarios.length) {
    return res.status(404).json({ error: "Horario no encontrado" });
  }

  escribirJSON('horarios.json', nuevos);
  res.json({ mensaje: "Horario eliminado exitosamente" });
});

// Eliminar todos los horarios de un profesional
app.delete('/api/horarios/profesional/:id', (req, res) => {
  const horarios = leerJSON('horarios.json');
  const id_profesional = Number(req.params.id);

  const nuevos = horarios.filter(h => h.id_profesional !== id_profesional);
  escribirJSON('horarios.json', nuevos);

  res.json({ mensaje: "Horarios del profesional eliminados exitosamente" });
});






app.get('/api/profesionales', (req, res) => {
  res.json(leerJSON('profesionales.json'));
});


app.post('/api/profesionales', (req, res) => {
  try {
    const profesionales = leerJSON('profesionales.json');
    const { id_usuario, nombre, apellidos, id_centro } = req.body;

    if (!id_usuario || !nombre || !id_centro) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Verificar que el usuario existe y tiene rol profesional
    const usuarios = leerJSON('usuarios.json');
    const usuario = usuarios.find(u => u.id_usuario === id_usuario);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.rol !== 'profesional') {
      return res.status(400).json({ error: "El usuario debe tener rol 'profesional'" });
    }

    // Verificar que no exista ya un profesional con ese id_usuario
    const profesionalExistente = profesionales.find(p => p.id_usuario === id_usuario);
    if (profesionalExistente) {
      return res.status(400).json({ error: "Ya existe un profesional asociado a este usuario" });
    }

    // Generar nuevo ID
    const nuevoId = profesionales.length > 0
      ? Math.max(...profesionales.map(p => p.id_profesional)) + 1
      : 1;

    const nuevoProfesional = {
      id_profesional: nuevoId,
      id_usuario,
      nombre,
      apellidos,
      id_centro
    };

    profesionales.push(nuevoProfesional);
    escribirJSON('profesionales.json', profesionales);

    res.status(201).json({ mensaje: "Profesional creado exitosamente", profesional: nuevoProfesional });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el profesional" });
  }
});


app.get('/api/profesionales/:id', (req, res) => {
  const profesionales = leerJSON('profesionales.json');
  const profesional = profesionales.find(p => p.id_profesional === Number(req.params.id));

  if (!profesional) return res.status(404).json({ error: "Profesional no encontrado" });

  res.json(profesional);
});


app.put('/api/profesionales/:id', (req, res) => {
  const profesionales = leerJSON('profesionales.json');
  const id = Number(req.params.id);

  const index = profesionales.findIndex(p => p.id_profesional === id);
  if (index === -1) return res.status(404).json({ error: "Profesional no encontrado" });

  profesionales[index] = { ...profesionales[index], ...req.body };

  escribirJSON('profesionales.json', profesionales);
  res.json({ mensaje: "Profesional actualizado" });
});


app.delete('/api/profesionales/:id', (req, res) => {
  const profesionales = leerJSON('profesionales.json');
  const id = Number(req.params.id);

  const nuevos = profesionales.filter(p => p.id_profesional !== id);
  escribirJSON('profesionales.json', nuevos);

  res.json({ mensaje: "Profesional eliminado" });
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




// ============= ENDPOINTS PARA SISTEMA DE PUNTOS =============

// Marcar cita como realizada y sumar puntos automáticamente
// Las citas están en localStorage, por lo que este endpoint recibe el id_usuario
app.post('/api/citas/marcar-realizada', (req, res) => {
  try {
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ error: "id_usuario es requerido" });
    }

    const usuarios = leerJSON('usuarios.json');
    const index = usuarios.findIndex(u => u.id_usuario === id_usuario);

    if (index === -1) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Calcular puntos y niveles
    const puntosActuales = usuarios[index].puntos || 0;
    const puntosNuevos = puntosActuales + 10;
    const nivelAnterior = obtenerNivel(puntosActuales);
    const nivelNuevo = obtenerNivel(puntosNuevos);
    const subeNivel = nivelNuevo !== nivelAnterior;

    // Actualizar puntos
    usuarios[index].puntos = puntosNuevos;
    escribirJSON('usuarios.json', usuarios);

    res.json({
      mensaje: "Cita marcada como realizada y puntos sumados",
      puntosSumados: 10,
      puntosActuales: puntosNuevos,
      nivelAnterior,
      nivelActual: nivelNuevo,
      subeNivel,
      usuario: usuarioSinPassword(usuarios[index])
    });
  } catch (error) {
    console.error('Error al marcar cita como realizada:', error);
    res.status(500).json({ error: "Error al procesar la cita" });
  }
});

// Obtener puntos y nivel de un usuario
app.get('/api/usuarios/:id/puntos', (req, res) => {
  try {
    const usuarios = leerJSON('usuarios.json');
    const id = Number(req.params.id);

    const usuario = usuarios.find(u => u.id_usuario === id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const puntos = usuario.puntos || 0;
    const nivel = obtenerNivel(puntos);

    res.json({
      puntos,
      nivel
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener puntos" });
  }
});

// Función auxiliar para obtener el nivel según los puntos
function obtenerNivel(puntos) {
  if (puntos >= 100) return 'Cliente Premium';
  if (puntos >= 50) return 'Cliente Habitual';
  if (puntos >= 20) return 'Cliente Frecuente';
  return 'Cliente Nuevo';
}

// ============= FIN ENDPOINTS PUNTOS =============


app.listen(3001, () => console.log("API en http://localhost:3001"));
