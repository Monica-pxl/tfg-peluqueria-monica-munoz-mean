const mongoose = require('mongoose');

const profesionalSchema = new mongoose.Schema({
  id_profesional: { type: Number, required: true, unique: true },
  id_usuario: { type: Number, required: true },
  nombre: { type: String, required: true },
  apellidos: { type: String, required: true },
  id_centro: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Profesional', profesionalSchema);
