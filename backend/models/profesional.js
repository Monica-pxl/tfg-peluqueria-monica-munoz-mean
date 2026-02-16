const mongoose = require('mongoose');

const profesionalSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  centro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Centro',
    required: true
  },
  nombre: { type: String, required: true },
  apellidos: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Profesional', profesionalSchema);

