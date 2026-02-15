require('dotenv').config();
const mongoose = require('mongoose');
const ProfesionalServicio = require('./models/profesionalServicio');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

// Leer datos originales
const relacionesOriginales = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data_originales/serviciosyprofesionalesOriginal.json'), 'utf8')
);

// Cargar mapeos
const profesionalMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mapeo_profesionales.json'), 'utf8')
);
const servicioMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mapeo_servicios.json'), 'utf8')
);

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await ProfesionalServicio.deleteMany({});
    console.log("🧹 Colección profesionalservicios limpiada");

    let insertados = 0;

    for (const rel of relacionesOriginales) {
      const profesionalId = profesionalMap[rel.id_profesional];
      const servicioId = servicioMap[rel.id_servicio];

      if (!profesionalId || !servicioId) {
        console.warn(`⚠️ Relación omitida: profesional ${rel.id_profesional}, servicio ${rel.id_servicio}`);
        continue;
      }

      await ProfesionalServicio.create({
        profesional: profesionalId,
        servicio: servicioId
      });

      insertados++;
    }

    console.log(`📦 ${insertados} relaciones profesional-servicio insertadas`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
