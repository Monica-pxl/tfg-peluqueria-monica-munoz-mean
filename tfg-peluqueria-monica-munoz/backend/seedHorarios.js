const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Horario = require('./models/horario');
const Profesional = require('./models/profesional');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    // Leer datos del JSON
    const horariosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'horarios.json'), 'utf8'));

    // Obtener profesionales de MongoDB ordenados por createdAt
    const profesionales = await Profesional.find({}).sort({ createdAt: 1 });

    if (profesionales.length === 0) {
      console.error("❌ No hay profesionales en la base de datos. Ejecuta seedProfesionales.js primero.");
      mongoose.disconnect();
      return;
    }

    // Limpiar colección
    await Horario.deleteMany({});

    // Preparar horarios mapeando profesionales
    const horariosPreparados = horariosData.map((horario, index) => {
      // Asignar profesional de forma secuencial
      const profesionalIndex = index % profesionales.length;

      return {
        dias: horario.dias,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        festivo: horario.festivo || false,
        fechas_festivas: horario.fechas_festivas || [],
        profesional: profesionales[profesionalIndex]._id
      };
    });

    await Horario.insertMany(horariosPreparados);

    console.log(`📦 ${horariosPreparados.length} Horarios insertados en MongoDB Atlas`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
