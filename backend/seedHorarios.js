require('dotenv').config();
const mongoose = require('mongoose');
const Horario = require('./models/horario');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

// Leer datos originales
const horariosOriginales = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data_originales/horariosOrignal.json'), 'utf8')
);

// Cargar mapeo de profesionales
const profesionalMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mapeo_profesionales.json'), 'utf8')
);

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await Horario.deleteMany({});
    console.log("🧹 Colección horarios limpiada");

    // Ordenar por id_horario para mantener el orden original
    horariosOriginales.sort((a, b) => a.id_horario - b.id_horario);

    let insertados = 0;

    for (const h of horariosOriginales) {
      const profesionalId = profesionalMap[h.id_profesional];

      if (!profesionalId) {
        console.warn(`⚠️ Horario omitido: profesional ${h.id_profesional} no encontrado`);
        continue;
      }

      await Horario.create({
        dias: h.dias,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        festivo: h.festivo || false,
        fechas_festivas: h.fechas_festivas || [],
        profesional: profesionalId
      });

      insertados++;
    }

    console.log(`📦 ${insertados} Horarios insertados en MongoDB Atlas`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });


