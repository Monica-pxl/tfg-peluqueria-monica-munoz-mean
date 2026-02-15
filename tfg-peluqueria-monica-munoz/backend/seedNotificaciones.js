require('dotenv').config();
const mongoose = require('mongoose');
const Notificacion = require('./models/notificacion');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await Notificacion.deleteMany({});
    console.log("🧹 Colección notificaciones limpiada");

    // Por ahora no hay notificaciones iniciales, solo limpiamos la colección
    // Las notificaciones se crearán automáticamente cuando haya eventos

    console.log("📦 Colección notificaciones lista (sin datos iniciales)");
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
