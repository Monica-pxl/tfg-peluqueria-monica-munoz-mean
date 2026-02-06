const mongoose = require('mongoose');

const horarioSchema = new mongoose.Schema({
  id_horario: { type: Number, required: true, unique: true },
  id_profesional: { type: Number, required: true },
  dias: { type: [String], required: true },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  festivo: { type: Boolean, default: false },
  fechas_festivas: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Horario', horarioSchema);
