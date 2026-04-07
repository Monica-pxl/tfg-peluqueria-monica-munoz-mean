const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registrar nuevo usuario
exports.register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const rol = 'cliente'; // El registro público siempre crea usuarios con rol cliente; no se acepta desde fuera

    // Validar campos obligatorios individualmente
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }
    if (!password) {
      return res.status(400).json({ error: 'La contraseña es obligatoria' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el email ya existe
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
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

    // Generar token
    const token = jwt.sign(
      { id_usuario: nuevoUsuario._id, rol: nuevoUsuario.rol, email: nuevoUsuario.email },
      process.env.JWT_SECRET || 'tu_clave_secreta',
      { expiresIn: '2h' }
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        _id: nuevoUsuario._id,
        id_usuario: nuevoUsuario._id, // Compatibilidad con frontend antiguo
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        estado: nuevoUsuario.estado,
        fecha_alta: nuevoUsuario.fecha_alta,
        puntos: nuevoUsuario.puntos
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos obligatorios individualmente
    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }
    if (!password) {
      return res.status(400).json({ error: 'La contraseña es obligatoria' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar que el usuario esté activo
    if (usuario.estado !== 'activo') {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Generar token
    const token = jwt.sign(
      { id_usuario: usuario._id, rol: usuario.rol, email: usuario.email },
      process.env.JWT_SECRET || 'tu_clave_secreta',
      { expiresIn: '2h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        _id: usuario._id,
        id_usuario: usuario._id, // Compatibilidad con frontend antiguo
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        estado: usuario.estado,
        fecha_alta: usuario.fecha_alta,
        puntos: usuario.puntos
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};
