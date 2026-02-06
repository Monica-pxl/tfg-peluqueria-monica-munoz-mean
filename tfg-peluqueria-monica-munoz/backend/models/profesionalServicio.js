const mongoose = require('mongoose');

const profesionalServicioSchema = new mongoose.Schema({
  id_profesional: { type: Number, required: true },
  id_servicio: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ProfesionalServicio', profesionalServicioSchema);
