const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: 2,
    maxlength: 60,
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: 6,
    select: false,
  },
  rol: {
    type: String,
    enum: ['cliente', 'cocinero', 'repartidor', 'admin'],
    default: 'cliente',
  },
  avatar: {
    type: String,
    default: '',
  },
  direccion: {
    calle: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    codigoPostal: { type: String, default: '' },
    referencia: { type: String, default: '' },
  },
  telefono: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
