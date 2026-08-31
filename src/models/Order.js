const mongoose = require('mongoose');

const ORDER_STEPS = [
  'pending',       // Pedido creado, esperando pago
  'awakening',     // Paso 1: Despertar del cocinero
  'mold',          // Paso 2: Preparar molde y base de galleta
  'mixing',        // Paso 3: Mezclar ingredientes
  'pouring',       // Paso 4: Verter mezcla en el molde
  'baking',        // Paso 5: Hornear
  'cooling',       // Paso 6: Enfriar y refrigerar
  'decorating',    // Paso 7: Decorar
  'packaging',     // Paso 8: Empacar
  'shipping',      // Paso 9: Despachar
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
    enum: ['kitty', 'kato', 'chiwi'],
    required: [true, 'Debes seleccionar un cocinero'],
  },
  cheesecake: {
    tipo: {
      type: String,
      enum: ['horneado', 'refrigerado'],
      required: true,
    },
    relleno: {
      type: String,
      enum: ['limon', 'clasica'],
      required: true,
    },
    base_galleta: {
      type: String,
      enum: ['oreo', 'vainilla', null],
      default: null,
    },
    dorado: {
      type: String,
      enum: ['medio', 'dorado'],
      required: true,
    },
    decorado: {
      type: String,
      enum: ['frutos_rojos', 'arequite', 'chantilli_oreo', 'bocadillo', 'sin_decorar'],
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
    max: 11,
  },
  timestamps_pasos: {
    pending:    { type: Date },
    awakening:  { type: Date },
    mold:       { type: Date },
    mixing:     { type: Date },
    pouring:    { type: Date },
    baking:     { type: Date },
    cooling:    { type: Date },
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

// Price calculation static method
orderSchema.statics.calcularPrecio = function({ tipo, relleno, base_galleta, dorado, decorado }) {
  let precio = tipo === 'horneado' ? 350 : 300;

  // Relleno
  if (relleno === 'limon') precio += 25;

  // Base de galleta
  if (base_galleta === 'oreo') precio += 25;
  else if (base_galleta === 'vainilla') precio += 15;

  // Dorado
  if (dorado === 'dorado') precio += 30;

  // Decorado
  const preciosDecorado = {
    frutos_rojos: 35,
    arequite: 40,
    chantilli_oreo: 45,
    bocadillo: 30,
    sin_decorar: 0,
  };
  precio += preciosDecorado[decorado] || 0;

  return precio;
};

// Static: get step label in Spanish
orderSchema.statics.getStepLabel = function(step) {
  const labels = {
    pending:    'Pendiente',
    awakening:  '¡Despertando al cocinero!',
    mold:       'Preparar molde',
    mixing:     'Mezclar ingredientes',
    pouring:    'Verter en el molde',
    baking:     'Horneando',
    cooling:    'Enfriar y refrigerar',
    decorating: 'Decorando',
    packaging:  'Empacando con cariño',
    shipping:   '¡En camino!',
    delivered:  '¡Entregado! 🎉',
    cancelled:  'Cancelado',
  };
  return labels[step] || step;
};

orderSchema.statics.ORDER_STEPS = ORDER_STEPS;

module.exports = mongoose.model('Order', orderSchema);