const mongoose = require('mongoose');
const ProfesionalServicio = require('./models/profesionalServicio');
const Profesional = require('./models/profesional');
const Servicio = require('./models/servicio');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    // Obtener profesionales y servicios de MongoDB
    const profesionales = await Profesional.find({}).sort({ createdAt: 1 });
    const servicios = await Servicio.find({}).sort({ createdAt: 1 });

    if (profesionales.length === 0) {
      console.error("❌ No hay profesionales en la base de datos. Ejecuta seedProfesionales.js primero.");
      mongoose.disconnect();
      return;
    }

    if (servicios.length === 0) {
      console.error("❌ No hay servicios en la base de datos. Ejecuta seedServicios.js primero.");
      mongoose.disconnect();
      return;
    }

    // Limpiar colección
    await ProfesionalServicio.deleteMany({});

    // Crear relaciones: cada profesional tiene 2-3 servicios asignados de forma equilibrada
    const relacionesPreparadas = [];

    profesionales.forEach((profesional, profIndex) => {
      // Cada profesional tendrá entre 1 y 3 servicios
      const numServicios = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numServicios; i++) {
        // Asignar servicios de forma distribuida
        const servicioIndex = (profIndex * 2 + i) % servicios.length;

        relacionesPreparadas.push({
          profesional: profesional._id,
          servicio: servicios[servicioIndex]._id
        });
      }
    });

    // Eliminar duplicados (misma combinación profesional-servicio)
    const relacionesUnicas = relacionesPreparadas.filter((rel, index, self) =>
      index === self.findIndex((r) => (
        r.profesional.toString() === rel.profesional.toString() &&
        r.servicio.toString() === rel.servicio.toString()
      ))
    );

    await ProfesionalServicio.insertMany(relacionesUnicas);

    console.log(`📦 ${relacionesUnicas.length} Relaciones Profesional-Servicio insertadas en MongoDB Atlas`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
