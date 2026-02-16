const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  duracion: { type: Number },
  precio: { type: Number },
  centro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Centro',
    required: true
  },
  imagen: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Servicio', servicioSchema);
