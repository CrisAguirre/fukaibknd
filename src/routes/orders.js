const express = require('express');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — Create order (client)
router.post('/', auth, async (req, res) => {
  try {
    const { cocinero, cheesecake, envio, notas } = req.body;

    const precio = Order.calcularPrecio(cheesecake);

    const order = new Order({
      usuario: req.user._id,
      cocinero,
      cheesecake,
      envio: envio || {},
      notas: notas || '',
      precio,
      estado: 'pending',
    });

    order.timestamps_pasos = { pending: new Date() };
    await order.save();

    // Populate user info
    await order.populate('usuario', 'nombre email');

    // Emit via WebSocket (will be set up in server.js)
    const io = req.app.get('io');
    if (io) {
      io.emit('order:new', {
        orderId: order._id,
        usuario: order.usuario.nombre,
        cocinero: order.cocinero,
      });
    }

    res.status(201).json({
      message: '¡Pedido creado! Tu cocinero se está preparando...',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders — List orders (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // Clients only see their own orders
    if (req.user.rol === 'cliente') {
      query.usuario = req.user._id;
    }

    const orders = await Order.find(query)
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id — Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('usuario', 'nombre email');

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    // Clients can only see their own orders
    if (req.user.rol === 'cliente' && order.usuario._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No tienes acceso a este pedido.' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/status — Update order step (admin/cooker)
router.patch('/:id/status', auth, authorize('admin', 'cocinero', 'repartidor'), async (req, res) => {
  try {
    const { estado } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    if (!Order.ORDER_STEPS.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido: ${estado}` });
    }

    order.estado = estado;
    await order.save();

    await order.populate('usuario', 'nombre email');

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order._id}`).emit('order:statusUpdate', {
        orderId: order._id,
        estado: order.estado,
        pasoActual: order.pasoActual,
        label: Order.getStepLabel(order.estado),
        timestamp: new Date(),
      });

      // Also emit to admin room
      io.to('admin').emit('order:statusUpdate', {
        orderId: order._id,
        estado: order.estado,
        pasoActual: order.pasoActual,
        usuario: order.usuario.nombre,
      });
    }

    res.json({
      message: `Pedido actualizado: ${Order.getStepLabel(estado)}`,
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/advance — Advance to next step
router.patch('/:id/advance', auth, authorize('admin', 'cocinero'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const currentIndex = Order.ORDER_STEPS.indexOf(order.estado);
    const nextStep = Order.ORDER_STEPS[currentIndex + 1];

    if (!nextStep || nextStep === 'cancelled') {
      return res.status(400).json({ error: 'No se puede avanzar más este pedido.' });
    }

    order.estado = nextStep;
    await order.save();
    await order.populate('usuario', 'nombre email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order._id}`).emit('order:statusUpdate', {
        orderId: order._id,
        estado: order.estado,
        pasoActual: order.pasoActual,
        label: Order.getStepLabel(order.estado),
        timestamp: new Date(),
      });

      io.to('admin').emit('order:statusUpdate', {
        orderId: order._id,
        estado: order.estado,
        pasoActual: order.pasoActual,
        usuario: order.usuario.nombre,
      });
    }

    res.json({
      message: `¡Avanzado a: ${Order.getStepLabel(nextStep)}!`,
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/shipping — Update shipping info
router.patch('/:id/shipping', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    if (req.user.rol === 'cliente' && order.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No tienes acceso a este pedido.' });
    }

    order.envio = { ...order.envio, ...req.body.envio };
    await order.save();

    res.json({ message: 'Datos de envío actualizados.', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
