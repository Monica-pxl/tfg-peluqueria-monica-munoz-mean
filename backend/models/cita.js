const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  profesional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesional',
    required: true
  },
  servicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  },
  centro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Centro',
    required: true
  },
  // Campos históricos para mantener la información incluso si se eliminan las referencias
  usuarioNombre: {
    type: String
  },
  usuarioEmail: {
    type: String
  },
  profesionalNombre: {
    type: String
  },
  profesionalApellidos: {
    type: String
  },
  servicioNombre: {
    type: String
  },
  centroNombre: {
    type: String
  },
  fecha: {
    type: String,  // formato: YYYY-MM-DD
    required: true
  },
  hora: {
    type: String,  // formato: HH:MM
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'realizada', 'cancelada'],
    default: 'pendiente'
  },
  precio: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Índice compuesto para evitar duplicados
citaSchema.index({ profesional: 1, fecha: 1, hora: 1 }, { unique: true });

module.exports = mongoose.model('Cita', citaSchema);
