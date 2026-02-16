require('dotenv').config();
const mongoose = require('mongoose');
const Cita = require('./models/cita');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await Cita.deleteMany({});
    console.log("🧹 Colección citas limpiada");

    // Por ahora no hay citas iniciales, solo limpiamos la colección
    // Las citas se crearán cuando los clientes reserven

    console.log("📦 Colección citas lista (sin datos iniciales)");
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });


