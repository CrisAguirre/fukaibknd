const mongoose = require('mongoose');

const cheesecakeSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  tipo: {
    type: String,
    enum: ['horneado', 'refrigerado'],
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  precio: {
    type: Number,
    required: true,
    min: 0,
  },
  imagen: {
    type: String,
    default: '',
  },
  decoracionesDisponibles: [{
    nombre: { type: String, required: true },
    precioExtra: { type: Number, default: 0 },
    emoji: { type: String, default: '' },
    modelo3d: { type: String, default: '' },
  }],
  disponible: {
    type: Boolean,
    default: true,
  },
  tiempoPreparacion: {
    type: Number, // minutes
    default: 45,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Cheesecake', cheesecakeSchema);
