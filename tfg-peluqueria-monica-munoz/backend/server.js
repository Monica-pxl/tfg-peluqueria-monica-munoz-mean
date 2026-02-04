const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

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

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" });
    }

    const usuarios = leerJSON('usuarios.json');
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const esValida = await bcrypt.compare(password, usuario.password);

    if (!esValida) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    // Validar que el usuario esté activo
    if (usuario.estado === 'inactivo') {
      return res.status(403).json({ error: "Tu cuenta ha sido desactivada. Contacta con el administrador." });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
        email: usuario.email
      },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: usuarioSinPassword(usuario)
    });

  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});




app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol = 'cliente' } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const usuarios = leerJSON('usuarios.json');

    if (usuarios.some(u => u.email === email)) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const passwordHasheada = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
      id_usuario: Math.max(...usuarios.map(u => u.id_usuario), 0) + 1,
      nombre,
      email,
      password: passwordHasheada,
      rol,
      estado: 'activo',
      fecha_alta: new Date().toISOString().split('T')[0],
      puntos: 0
    };

    usuarios.push(nuevoUsuario);
    escribirJSON('usuarios.json', usuarios);

    const token = jwt.sign(
      {
        id_usuario: nuevoUsuario.id_usuario,
        rol: nuevoUsuario.rol,
        email: nuevoUsuario.email
      },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      token,
      usuario: usuarioSinPassword(nuevoUsuario)
    });

  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});


app.get('/api/usuarios', (req, res) => {
  const usuarios = leerJSON('usuarios.json');
  const usuariosSeguros = usuarios.map(usuarioSinPassword);
  res.json(usuariosSeguros);
});







app.get('/api/servicios', (req, res) => {
  res.json(leerJSON('servicios.json'));
});


app.post('/api/servicios', (req, res) => {
  const servicios = leerJSON('servicios.json');
  const nuevo = req.body;

  // Generar ID consecutivo basado en el máximo ID existente
  nuevo.id_servicio = Math.max(...servicios.map(s => s.id_servicio), 0) + 1;
  servicios.push(nuevo);

  escribirJSON('servicios.json', servicios);

  res.status(201).json(nuevo);
});


app.put('/api/servicios/:id', (req, res) => {
  const servicios = leerJSON('servicios.json');
  const id = Number(req.params.id);
  const datos = req.body;

  const index = servicios.findIndex(s => s.id_servicio === id);
  if (index === -1) {
    return res.status(404).json({ mensaje: "Servicio no encontrado" });
  }

  servicios[index] = { ...servicios[index], ...datos };
  escribirJSON('servicios.json', servicios);

  res.json(servicios[index]);
});


app.delete('/api/servicios/:id', (req, res) => {
  const servicios = leerJSON('servicios.json');
  const id = Number(req.params.id);

  const filtrados = servicios.filter(s => s.id_servicio !== id);
  escribirJSON('servicios.json', filtrados);

  res.json({ mensaje: "Servicio eliminado" });
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


// Actualizar usuario (solo rol y estado)
app.put('/api/usuarios/:id', (req, res) => {
  try {
    const usuarios = leerJSON('usuarios.json');
    const id = Number(req.params.id);
    const { rol, estado } = req.body;

    const index = usuarios.findIndex(u => u.id_usuario === id);
    if (index === -1) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Solo actualizar rol y estado
    if (rol) usuarios[index].rol = rol;
    if (estado !== undefined) usuarios[index].estado = estado;

    escribirJSON('usuarios.json', usuarios);
    res.json({
      mensaje: "Usuario actualizado exitosamente",
      usuario: usuarioSinPassword(usuarios[index])
    });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// Eliminar usuario con validaciones
app.delete('/api/usuarios/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { id_admin } = req.body;

    console.log(`\n=== ELIMINANDO USUARIO ID: ${id} ===`);

    // 1. Leer y buscar el usuario
    let usuarios = leerJSON('usuarios.json');
    const usuario = usuarios.find(u => Number(u.id_usuario) === Number(id));

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`Usuario encontrado: ${usuario.nombre}, Rol: ${usuario.rol}`);

    // Validación: Solo admin puede eliminar admin
    if (usuario.rol === 'administrador') {
      const admin = usuarios.find(u => Number(u.id_usuario) === Number(id_admin));
      if (!admin || admin.rol !== 'administrador') {
        return res.status(403).json({ error: "Solo un administrador puede eliminar otro administrador" });
      }
    }

    // 2. BORRADO EN CASCADA si es profesional
    if (usuario.rol === 'profesional') {
      console.log('🔍 Es profesional, buscando registro en profesionales...');

      let profesionales = leerJSON('profesionales.json');
      const profesional = profesionales.find(p => Number(p.id_usuario) === Number(id));

      if (profesional) {
        const idProfesional = Number(profesional.id_profesional);
        console.log(`✓ Profesional encontrado con ID: ${idProfesional}`);

        // 2.1 Eliminar HORARIOS
        try {
          let horarios = leerJSON('horarios.json');
          const horariosAntes = horarios.length;
          horarios = horarios.filter(h => Number(h.id_profesional) !== idProfesional);
          fs.writeFileSync(
            path.join(__dirname, 'data', 'horarios.json'),
            JSON.stringify(horarios, null, 2),
            'utf8'
          );
          console.log(`✓ Horarios eliminados: ${horariosAntes - horarios.length}`);
        } catch (e) {
          console.error('Error eliminando horarios:', e.message);
        }

        // 2.2 Eliminar RELACIONES profesional-servicio
        try {
          let profesionalServicio = leerJSON('profesional_servicio.json');
          const relacionesAntes = profesionalServicio.length;
          profesionalServicio = profesionalServicio.filter(ps => Number(ps.id_profesional) !== idProfesional);
          fs.writeFileSync(
            path.join(__dirname, 'data', 'profesional_servicio.json'),
            JSON.stringify(profesionalServicio, null, 2),
            'utf8'
          );
          console.log(`✓ Relaciones con servicios eliminadas: ${relacionesAntes - profesionalServicio.length}`);
        } catch (e) {
          console.error('Error eliminando relaciones:', e.message);
        }

        // 2.3 Eliminar PROFESIONAL
        try {
          profesionales = profesionales.filter(p => Number(p.id_profesional) !== idProfesional);
          fs.writeFileSync(
            path.join(__dirname, 'data', 'profesionales.json'),
            JSON.stringify(profesionales, null, 2),
            'utf8'
          );
          console.log(`✓ Profesional eliminado de profesionales.json`);
        } catch (e) {
          console.error('Error eliminando profesional:', e.message);
        }
      } else {
        console.log('⚠ No se encontró registro de profesional');
      }
    }

    // 3. Eliminar USUARIO
    usuarios = usuarios.filter(u => Number(u.id_usuario) !== Number(id));
    fs.writeFileSync(
      path.join(__dirname, 'data', 'usuarios.json'),
      JSON.stringify(usuarios, null, 2),
      'utf8'
    );
    console.log(`✓ Usuario eliminado de usuarios.json`);
    console.log('=== ELIMINACIÓN COMPLETADA ===\n');

    res.json({ mensaje: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    console.error('Detalles:', error.message);
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
