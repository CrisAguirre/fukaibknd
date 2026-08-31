const mongoose = require('mongoose');

const ORDER_STEPS = [
  'pending',       // Pedido creado, esperando
  'awakening',     // Paso 1: Despertar del cocinero
  'kitchen',       // Paso 2: Revelación de la cocina
  'preparing',     // Paso 3: Preparación / mezcla
  'baking',        // Paso 4: Horneado
  'decorating',    // Paso 5: Decoración
  'packaging',     // Paso 6: Embalaje
  'shipping',      // Paso 7: Envío
  'delivered',     // Entregado
  'cancelled',     // Cancelado
];

const orderSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cocinero: {
    type: String,
    enum: ['capibara', 'kitty', 'aguacate'],
    required: [true, 'Debes seleccionar un cocinero'],
  },
  cheesecake: {
    tipo: {
      type: String,
      enum: ['horneado', 'refrigerado'],
      required: true,
    },
    decoraciones: [{
      type: String,
      enum: ['fresas', 'arandanos', 'chocolate', 'caramelo', 'mermelada', 'nueces', 'oreo', 'matcha'],
    }],
    mensaje: {
      type: String,
      maxlength: 100,
      default: '',
    },
  },
  estado: {
    type: String,
    enum: ORDER_STEPS,
    default: 'pending',
  },
  pasoActual: {
    type: Number,
    default: 0,
    min: 0,
    max: 9,
  },
  timestamps_pasos: {
    pending:    { type: Date },
    awakening:  { type: Date },
    kitchen:    { type: Date },
    preparing:  { type: Date },
    baking:     { type: Date },
    decorating: { type: Date },
    packaging:  { type: Date },
    shipping:   { type: Date },
    delivered:  { type: Date },
  },
  envio: {
    nombre:       { type: String, default: '' },
    direccion:    { type: String, default: '' },
    ciudad:       { type: String, default: '' },
    codigoPostal: { type: String, default: '' },
    telefono:     { type: String, default: '' },
    referencia:   { type: String, default: '' },
  },
  precio: {
    type: Number,
    default: 0,
  },
  notas: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Middleware to update step timestamps
orderSchema.pre('save', function(next) {
  if (this.isModified('estado')) {
    this.timestamps_pasos[this.estado] = new Date();

    const stepIndex = ORDER_STEPS.indexOf(this.estado);
    if (stepIndex >= 0) {
      this.pasoActual = stepIndex;
    }
  }
  next();
});

// Static: get step label in Spanish
orderSchema.statics.getStepLabel = function(step) {
  const labels = {
    pending:    'Pendiente',
    awakening:  '¡Despertando al cocinero!',
    kitchen:    'Revelando la cocina',
    preparing:  'Preparando ingredientes',
    baking:     'Horneando con amor',
    decorating: '¡Decorando tu cheesecake!',
    packaging:  'Empacando con cariño',
    shipping:   '¡En camino!',
    delivered:  '¡Entregado! 🎉',
    cancelled:  'Cancelado',
  };
  return labels[step] || step;
};

orderSchema.statics.ORDER_STEPS = ORDER_STEPS;

module.exports = mongoose.model('Order', orderSchema);
