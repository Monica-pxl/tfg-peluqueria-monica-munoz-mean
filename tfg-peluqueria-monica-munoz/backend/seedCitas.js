const mongoose = require('mongoose');
const Cita = require('./models/cita');
const Usuario = require('./models/usuario');
const Profesional = require('./models/profesional');
const Servicio = require('./models/servicio');
const Centro = require('./models/centro');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    // Obtener datos de las colecciones
    const usuarios = await Usuario.find({ rol: 'cliente' }).limit(3);
    const profesionales = await Profesional.find().limit(3);
    const servicios = await Servicio.find().limit(5);
    const centros = await Centro.find().limit(2);

    if (usuarios.length === 0 || profesionales.length === 0 || servicios.length === 0 || centros.length === 0) {
      console.error("❌ Asegúrate de tener datos en usuarios, profesionales, servicios y centros antes de ejecutar este seed");
      mongoose.disconnect();
      return;
    }

    // Limpiar colección
    await Cita.deleteMany({});
    console.log("🗑️ Citas antiguas eliminadas");

    // Crear citas de ejemplo
    const citasEjemplo = [
      {
        usuario: usuarios[0]._id,
        profesional: profesionales[0]._id,
        servicio: servicios[0]._id,
        centro: centros[0]._id,
        fecha: '2026-02-15',
        hora: '10:00',
        estado: 'pendiente',
        notas: 'Primera cita del cliente',
        precio: servicios[0].precio || 25
      },
      {
        usuario: usuarios[0]._id,
        profesional: profesionales[1]._id,
        servicio: servicios[1]._id,
        centro: centros[0]._id,
        fecha: '2026-02-20',
        hora: '11:30',
        estado: 'confirmada',
        notas: '',
        precio: servicios[1].precio || 30
      },
      {
        usuario: usuarios[1]._id,
        profesional: profesionales[0]._id,
        servicio: servicios[2]._id,
        centro: centros[1]._id,
        fecha: '2026-02-18',
        hora: '15:00',
        estado: 'realizada',
        notas: 'Cliente satisfecho',
        precio: servicios[2].precio || 40
      },
      {
        usuario: usuarios[2]._id,
        profesional: profesionales[2]._id,
        servicio: servicios[3]._id,
        centro: centros[0]._id,
        fecha: '2026-02-12',
        hora: '09:30',
        estado: 'cancelada',
        notas: 'Cliente canceló por motivos personales',
        precio: servicios[3].precio || 35
      },
      {
        usuario: usuarios[1]._id,
        profesional: profesionales[1]._id,
        servicio: servicios[4]._id,
        centro: centros[1]._id,
        fecha: '2026-02-25',
        hora: '16:00',
        estado: 'pendiente',
        notas: '',
        precio: servicios[4].precio || 50
      }
    ];

    await Cita.insertMany(citasEjemplo);
    console.log(`📦 ${citasEjemplo.length} Citas insertadas en MongoDB Atlas`);

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
