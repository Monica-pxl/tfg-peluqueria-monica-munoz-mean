require('dotenv').config();
const mongoose = require('mongoose');
const Centro = require('./models/centro');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

// Leer datos originales
const centrosOriginales = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data_originales/centrosOriginal.json'), 'utf8')
);

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await Centro.deleteMany({});
    console.log("🧹 Colección centros limpiada");

    // Ordenar por id_centro para mantener el orden original
    centrosOriginales.sort((a, b) => a.id_centro - b.id_centro);

    // Mapeo de id_centro original → _id de MongoDB
    const centroMap = {};

    for (const c of centrosOriginales) {
      const centro = await Centro.create({
        nombre: c.nombre,
        direccion: c.direccion,
        telefono: c.telefono,
        email: c.email,
        horario_apertura: c.horario_apertura,
        horario_cierre: c.horario_cierre
      });

      centroMap[c.id_centro] = centro._id.toString();
    }

    // Guardar mapeo para otros seeds
    fs.writeFileSync(
      path.join(__dirname, 'mapeo_centros.json'),
      JSON.stringify(centroMap, null, 2)
    );

    console.log(`📦 ${centrosOriginales.length} Centros insertados en MongoDB Atlas`);
    console.log("💾 Mapeo guardado en mapeo_centros.json");

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
