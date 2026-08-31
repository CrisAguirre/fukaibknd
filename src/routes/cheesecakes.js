const express = require('express');
const Cheesecake = require('../models/Cheesecake');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/cheesecakes — List all available cheesecakes
router.get('/', async (req, res) => {
  try {
    const cheesecakes = await Cheesecake.find({ disponible: true });
    res.json({ cheesecakes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cheesecakes/:id
router.get('/:id', async (req, res) => {
  try {
    const cheesecake = await Cheesecake.findById(req.params.id);
    if (!cheesecake) {
      return res.status(404).json({ error: 'Cheesecake no encontrado.' });
    }
    res.json({ cheesecake });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cheesecakes/seed — Seed initial data (admin only)
router.post('/seed', auth, authorize('admin'), async (req, res) => {
  try {
    const count = await Cheesecake.countDocuments();
    if (count > 0) {
      return res.status(400).json({ error: 'Ya existen cheesecakes en la base de datos.' });
    }

    const seedData = [
      {
        nombre: 'Cheesecake Horneado Clásico',
        tipo: 'horneado',
        descripcion: 'Un cheesecake cremoso horneado a la perfección, con una base de galleta dorada y un interior suave que se derrite en cada bocado.',
        precio: 350,
        tiempoPreparacion: 60,
        decoracionesDisponibles: [
          { nombre: 'fresas', precioExtra: 25, emoji: '🍓' },
          { nombre: 'arandanos', precioExtra: 25, emoji: '🫐' },
          { nombre: 'chocolate', precioExtra: 30, emoji: '🍫' },
          { nombre: 'caramelo', precioExtra: 25, emoji: '🍯' },
          { nombre: 'mermelada', precioExtra: 20, emoji: '🍇' },
          { nombre: 'nueces', precioExtra: 30, emoji: '🥜' },
          { nombre: 'oreo', precioExtra: 25, emoji: '🍪' },
          { nombre: 'matcha', precioExtra: 35, emoji: '🍵' },
        ],
      },
      {
        nombre: 'Cheesecake Refrigerado Sedoso',
        tipo: 'refrigerado',
        descripcion: 'Un cheesecake no-bake ultra sedoso, con textura de mousse y un sabor delicado que captura la esencia de la simplicidad japonesa.',
        precio: 300,
        tiempoPreparacion: 45,
        decoracionesDisponibles: [
          { nombre: 'fresas', precioExtra: 25, emoji: '🍓' },
          { nombre: 'arandanos', precioExtra: 25, emoji: '🫐' },
          { nombre: 'chocolate', precioExtra: 30, emoji: '🍫' },
          { nombre: 'caramelo', precioExtra: 25, emoji: '🍯' },
          { nombre: 'mermelada', precioExtra: 20, emoji: '🍇' },
          { nombre: 'nueces', precioExtra: 30, emoji: '🥜' },
          { nombre: 'oreo', precioExtra: 25, emoji: '🍪' },
          { nombre: 'matcha', precioExtra: 35, emoji: '🍵' },
        ],
      },
    ];

    const cheesecakes = await Cheesecake.insertMany(seedData);
    res.status(201).json({
      message: `${cheesecakes.length} cheesecakes creados exitosamente.`,
      cheesecakes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
