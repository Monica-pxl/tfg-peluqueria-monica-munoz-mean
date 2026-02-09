const mongoose = require('mongoose');
const Notificacion = require('./models/notificacion');
const Usuario = require('./models/usuario');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    // Obtener usuarios
    const usuarios = await Usuario.find().limit(5);

    if (usuarios.length === 0) {
      console.error("❌ Asegúrate de tener usuarios en la base de datos antes de ejecutar este seed");
      mongoose.disconnect();
      return;
    }

    // Limpiar colección
    await Notificacion.deleteMany({});
    console.log("🗑️ Notificaciones antiguas eliminadas");

    // Crear notificaciones de ejemplo
    const notificacionesEjemplo = [
      {
        usuario: usuarios[0]._id,
        titulo: 'Bienvenido',
        mensaje: 'Gracias por registrarte en nuestra plataforma',
        leida: true,
        tipo: 'info'
      },
      {
        usuario: usuarios[0]._id,
        titulo: 'Cita confirmada',
        mensaje: 'Tu cita para el día 15/02/2026 a las 10:00 ha sido confirmada',
        leida: false,
        tipo: 'exito'
      },
      {
        usuario: usuarios[1]._id,
        titulo: 'Recordatorio de cita',
        mensaje: 'Recuerda tu cita programada para mañana a las 15:00',
        leida: false,
        tipo: 'advertencia'
      },
      {
        usuario: usuarios[1]._id,
        titulo: 'Puntos acumulados',
        mensaje: 'Has acumulado 10 puntos por tu última visita. ¡Sigue así!',
        leida: true,
        tipo: 'exito'
      },
      {
        usuario: usuarios[2]._id,
        titulo: 'Cambio de horario',
        mensaje: 'El profesional ha modificado tu horario de cita',
        leida: false,
        tipo: 'advertencia'
      },
      {
        usuario: usuarios[0]._id,
        titulo: 'Promoción especial',
        mensaje: '¡20% de descuento en tu próxima cita!',
        leida: false,
        tipo: 'info'
      }
    ];

    await Notificacion.insertMany(notificacionesEjemplo);
    console.log(`📦 ${notificacionesEjemplo.length} Notificaciones insertadas en MongoDB Atlas`);

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
