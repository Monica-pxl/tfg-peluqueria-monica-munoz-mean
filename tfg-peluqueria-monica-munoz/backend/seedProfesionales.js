const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Profesional = require('./models/profesional');
const Usuario = require('./models/usuario');
const Centro = require('./models/centro');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    // Leer datos del JSON
    const profesionalesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'profesionales.json'), 'utf8'));

    // Obtener usuarios profesionales de MongoDB ordenados por createdAt
    const usuarios = await Usuario.find({ rol: 'profesional' }).sort({ createdAt: 1 });
    const centros = await Centro.find({}).sort({ createdAt: 1 });

    if (usuarios.length === 0) {
      console.error("❌ No hay usuarios profesionales en la base de datos. Ejecuta seedUsuarios.js primero.");
      mongoose.disconnect();
      return;
    }

    if (centros.length === 0) {
      console.error("❌ No hay centros en la base de datos. Ejecuta seedCentros.js primero.");
      mongoose.disconnect();
      return;
    }

    // Limpiar colección
    await Profesional.deleteMany({});

    // Preparar profesionales mapeando usuarios y centros
    const profesionalesPreparados = profesionalesData.map((profesional, index) => {
      // Asignar usuario de forma secuencial
      const usuarioIndex = index % usuarios.length;
      // Asignar centro de forma cíclica
      const centroIndex = index % centros.length;

      return {
        nombre: profesional.nombre,
        apellidos: profesional.apellidos,
        usuario: usuarios[usuarioIndex]._id,
        centro: centros[centroIndex]._id
      };
    });

    await Profesional.insertMany(profesionalesPreparados);

    console.log(`📦 ${profesionalesPreparados.length} Profesionales insertados en MongoDB Atlas`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
