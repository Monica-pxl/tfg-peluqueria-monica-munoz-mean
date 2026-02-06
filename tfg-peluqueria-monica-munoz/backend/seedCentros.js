const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Centro = require('./models/Centro');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    const centrosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'centros.json'), 'utf8'));

    await Centro.deleteMany({});
    await Centro.insertMany(centrosData);

    console.log("📦 Centros insertados en MongoDB Atlas");
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
