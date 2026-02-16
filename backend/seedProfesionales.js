require('dotenv').config();
const mongoose = require('mongoose');
const Profesional = require('./models/profesional');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

// Leer datos originales
const profesionalesOriginales = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data_originales/profesionalesOriginal.json'), 'utf8')
);

// Cargar mapeos
const usuarioMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mapeo_usuarios.json'), 'utf8')
);
const centroMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mapeo_centros.json'), 'utf8')
);

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await Profesional.deleteMany({});
    console.log("🧹 Colección profesionales limpiada");

    // Ordenar por id_profesional para mantener el orden original
    profesionalesOriginales.sort((a, b) => a.id_profesional - b.id_profesional);

    // Mapeo de id_profesional original → _id de MongoDB
    const profesionalMap = {};

    for (const p of profesionalesOriginales) {
      const profesional = await Profesional.create({
        nombre: p.nombre,
        apellidos: p.apellidos,
        usuario: usuarioMap[p.id_usuario],
        centro: centroMap[p.id_centro]
      });

      profesionalMap[p.id_profesional] = profesional._id.toString();
    }

    // Guardar mapeo para otros seeds
    fs.writeFileSync(
      path.join(__dirname, 'mapeo_profesionales.json'),
      JSON.stringify(profesionalMap, null, 2)
    );

    console.log(`📦 ${profesionalesOriginales.length} Profesionales insertados en MongoDB Atlas`);
    console.log("💾 Mapeo guardado en mapeo_profesionales.json");

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
