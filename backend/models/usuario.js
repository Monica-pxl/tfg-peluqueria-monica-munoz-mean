const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'profesional', 'administrador'], required: true },
  estado: { type: String, default: 'activo' },
  fecha_alta: { type: Date, required: true },
  puntos: {
    type: Number,
    default: function() {
      return this.rol === 'cliente' ? 0 : undefined;
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);
