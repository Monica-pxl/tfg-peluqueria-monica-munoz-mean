const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Horario = require('./models/Horario');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    const horariosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'horarios.json'), 'utf8'));

    await Horario.deleteMany({});
    await Horario.insertMany(horariosData);

    console.log("📦 Horarios insertados en MongoDB Atlas");
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
