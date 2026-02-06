const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Profesional = require('./models/Profesional');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    const profesionalesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'profesionales.json'), 'utf8'));

    await Profesional.deleteMany({});
    await Profesional.insertMany(profesionalesData);

    console.log("📦 Profesionales insertados en MongoDB Atlas");
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
