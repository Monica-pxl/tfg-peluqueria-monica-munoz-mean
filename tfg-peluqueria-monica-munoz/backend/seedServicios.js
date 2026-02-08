const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Servicio = require('./models/servicio');
const Centro = require('./models/centro');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    // Leer datos del JSON
    const serviciosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'servicios.json'), 'utf8'));

    // Obtener todos los centros de MongoDB ordenados por su orden de creación
    const centros = await Centro.find({}).sort({ createdAt: 1 });

    if (centros.length === 0) {
      console.error("❌ No hay centros en la base de datos. Ejecuta seedCentros.js primero.");
      mongoose.disconnect();
      return;
    }

    // Limpiar colección
    await Servicio.deleteMany({});

    // Preparar servicios mapeando cada servicio a un centro de forma cíclica
    const serviciosPreparados = serviciosData.map((servicio, index) => {
      // Asignar centros de forma cíclica (1->centro[0], 2->centro[1], ..., 13->centro[0], etc.)
      const centroIndex = index % centros.length;

      return {
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        duracion: servicio.duracion,
        precio: servicio.precio,
        imagen: servicio.imagen,
        centro: centros[centroIndex]._id // Referencia al _id del centro
      };
    });

    await Servicio.insertMany(serviciosPreparados);

    console.log(`📦 ${serviciosPreparados.length} Servicios insertados en MongoDB Atlas`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });

