// Cargar variables de entorno solo si no están ya cargadas (Vercel las inyecta)
if (!process.env.MONGODB_URI) {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');

// Importar la función que configura los middlewares
const aplicarMiddlewares = require('./middlewares');

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


// ✅ APLICAR MIDDLEWARES (DESDE /middlewares)
aplicarMiddlewares(app);  // ← Esto configura cors, express.json, etc.


const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
}

let mongoConnectionPromise = null;

const conectarMongo = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
  }

  try {
    await mongoConnectionPromise;
    return mongoose.connection;
  } catch (error) {
    mongoConnectionPromise = null;
    throw error;
  }
};

conectarMongo()
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

app.use(async (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  try {
    await conectarMongo();
    return next();
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB en petición API:', error);
    return res.status(500).json({ error: 'Error de conexión con la base de datos' });
  }
});


// RUTAS DE LA API
app.use('/api', authRoutes);  // Mantiene /api/login y /api/registro
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/profesionales', profesionalRoutes);
app.use('/api/centros', centroRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/profesional_servicio', profesionalServicioRoutes);



// RUTA DE PRUEBA
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



// MANEJO DE ERRORES
// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});


// Error global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});


// INICIAR SERVIDOR
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor local en http://localhost:${PORT}`);
  });
}

module.exports = app;