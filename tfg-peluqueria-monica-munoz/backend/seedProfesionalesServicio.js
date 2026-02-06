const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const ProfesionalServicio = require('./models/ProfesionalServicio');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    const relacionesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'profesional_servicio.json'), 'utf8'));

    await ProfesionalServicio.deleteMany({});
    await ProfesionalServicio.insertMany(relacionesData);

    console.log("📦 Relaciones Profesional-Servicio insertadas en MongoDB Atlas");
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
