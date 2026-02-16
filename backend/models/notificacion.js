const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  leida: {
    type: Boolean,
    default: false
  },
  tipo: {
    type: String,
    enum: ['info', 'exito', 'advertencia', 'error'],
    default: 'info'
  }
}, { timestamps: true });

// Índice para optimizar consultas por usuario
notificacionSchema.index({ usuario: 1, createdAt: -1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);
