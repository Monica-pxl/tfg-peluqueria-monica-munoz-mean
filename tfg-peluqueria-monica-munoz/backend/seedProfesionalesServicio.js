const mongoose = require('mongoose');
const ProfesionalServicio = require('./models/profesionalServicio');
const Profesional = require('./models/profesional');
const Servicio = require('./models/servicio');
const relaciones = require('./data/serviciosyprofesionales.json');

const uri= "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await ProfesionalServicio.deleteMany({});
    console.log("🧹 Colección profesionalservicios limpiada");

    const profesionales = await Profesional.find({}).sort({ createdAt: 1 });
    const servicios = await Servicio.find({}).sort({ createdAt: 1 });

    for (const rel of relaciones) {
      const profesional = profesionales[rel.id_profesional - 1];
      const servicio = servicios[rel.id_servicio - 1];

      if (!profesional || !servicio) {
        console.warn(`⚠️ Relación omitida: profesional ${rel.id_profesional}, servicio ${rel.id_servicio}`);
        continue;
      }

      await ProfesionalServicio.create({
        profesional: profesional._id,
        servicio: servicio._id
      });
    }

    console.log("🎉 Seed profesional_servicio ejecutado correctamente");
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
