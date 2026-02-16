const mongoose = require('mongoose');

const profesionalServicioSchema = new mongoose.Schema({
  profesional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesional',
    required: true
  },
  servicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  }
}, { timestamps: true, collection: 'profesionalservicios' });

profesionalServicioSchema.index(
  { profesional: 1, servicio: 1 },
  { unique: true }
);

module.exports = mongoose.model('ProfesionalServicio', profesionalServicioSchema);

