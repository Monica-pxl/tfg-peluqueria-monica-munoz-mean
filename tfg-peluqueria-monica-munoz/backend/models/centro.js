const mongoose = require('mongoose');

const centroSchema = new mongoose.Schema({
  id_centro: { type: Number, required: true, unique: true },
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String, required: true },
  email: { type: String, required: true },
  horario_apertura: { type: String, required: true },
  horario_cierre: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Centro', centroSchema);
