require('dotenv').config();
const mongoose = require('mongoose');
const Servicio = require('./models/servicio');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

// Leer datos originales
const serviciosOriginales = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data_originales/serviciosOriginal.json'), 'utf8')
);

// Cargar mapeo de centros
const centroMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mapeo_centros.json'), 'utf8')
);

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await Servicio.deleteMany({});
    console.log("🧹 Colección servicios limpiada");

    // Ordenar por id_servicio para mantener el orden original
    serviciosOriginales.sort((a, b) => a.id_servicio - b.id_servicio);

    // Mapeo de id_servicio original → _id de MongoDB
    const servicioMap = {};

    for (const s of serviciosOriginales) {
      const servicio = await Servicio.create({
        nombre: s.nombre,
        descripcion: s.descripcion,
        duracion: s.duracion,
        precio: s.precio,
        centro: centroMap[s.id_centro],
        imagen: s.imagen
      });

      servicioMap[s.id_servicio] = servicio._id.toString();
    }

    // Guardar mapeo para otros seeds
    fs.writeFileSync(
      path.join(__dirname, 'mapeo_servicios.json'),
      JSON.stringify(servicioMap, null, 2)
    );

    console.log(`📦 ${serviciosOriginales.length} Servicios insertados en MongoDB Atlas`);
    console.log("💾 Mapeo guardado en mapeo_servicios.json");

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });

