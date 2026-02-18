require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importar routes
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const servicioRoutes = require('./routes/servicio.routes');
const profesionalRoutes = require('./routes/profesional.routes');
const centroRoutes = require('./routes/centro.routes');
const horarioRoutes = require('./routes/horario.routes');
const citaRoutes = require('./routes/cita.routes');
const notificacionRoutes = require('./routes/notificacion.routes');
const profesionalServicioRoutes = require('./routes/profesionalServicio.routes');

// Inicializar Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Rutas de la API
app.use('/api', authRoutes);  // Mantiene /api/login y /api/registro
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/profesionales', profesionalRoutes);
app.use('/api/centros', centroRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/profesional_servicio', profesionalServicioRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: '🚀 API de Peluquería funcionando correctamente',
    version: '2.0',
    endpoints: {
      auth: '/api/login (POST), /api/registro (POST)',
      usuarios: '/api/usuarios',
      servicios: '/api/servicios',
      profesionales: '/api/profesionales',
      centros: '/api/centros',
      horarios: '/api/horarios',
      citas: '/api/citas',
      notificaciones: '/api/notificaciones',
      profesional_servicio: '/api/profesional_servicio'
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación: http://localhost:${PORT}/`);
});

module.exports = app;
