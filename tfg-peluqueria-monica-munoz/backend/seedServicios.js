const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Servicio = require('./models/Servicio');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    const serviciosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'servicios.json'), 'utf8'));

    await Servicio.deleteMany({}); // limpia la colección antes de insertar
    await Servicio.insertMany(serviciosData);

    console.log("📦 Servicios insertados en MongoDB Atlas");
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
