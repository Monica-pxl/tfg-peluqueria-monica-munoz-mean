const Usuario = require('../models/usuario');
const Profesional = require('../models/profesional');
const ProfesionalServicio = require('../models/profesionalServicio');
const Horario = require('../models/horario');
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

// Obtener un usuario por ID
exports.getUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// Crear un usuario
exports.createUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      rol,
      fecha_alta: new Date(),
      estado: 'activo',
      puntos: rol === 'cliente' ? 0 : undefined
    });

    await nuevoUsuario.save();
    const usuarioSinPassword = nuevoUsuario.toObject();
    delete usuarioSinPassword.password;

    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar un usuario
exports.updateUsuario = async (req, res) => {
  try {
    const { password, ...datosActualizados } = req.body;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      datosActualizados.password = await bcrypt.hash(password, salt);
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

// Eliminar un usuario
exports.deleteUsuario = async (req, res) => {
  try {
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

        // 3. Cancelar citas pendientes del profesional
        const citas = await Cita.updateMany(
          { profesional: profesional._id, estado: { $ne: 'realizada' } },
          { $set: { estado: 'cancelada' } }
        );
        console.log(`   ├─ ${citas.modifiedCount} citas canceladas`);

        // 4. Eliminar el registro de profesional
        await Profesional.findByIdAndDelete(profesional._id);
        console.log(`   └─ Registro de profesional eliminado`);
      }
    }

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Actualizar puntos de un cliente
exports.actualizarPuntos = async (req, res) => {
  try {
    const { puntos } = req.body;

    if (typeof puntos !== 'number') {
      return res.status(400).json({ error: 'Los puntos deben ser un número' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { $inc: { puntos } },
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar puntos:', error);
    res.status(500).json({ error: 'Error al actualizar puntos' });
  }
};
