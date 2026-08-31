require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./src/config/db');
const setupWebSocket = require('./src/websocket/orderSocket');

// Import routes
const authRoutes = require('./src/routes/auth');
const orderRoutes = require('./src/routes/orders');
const cheesecakeRoutes = require('./src/routes/cheesecakes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Make io available in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cheesecakes', cheesecakeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: '深い Fukai Backend — Running',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// WebSocket
setupWebSocket(io);

// Connect to DB and start server
const PORT = process.env.PORT || 4000;

connectDB().then(async () => {
  // --- TEST SEEDER: Auto-create admin user ---
  try {
    const User = require('./src/models/User');
    const existingAdmin = await User.findOne({ email: 'admin@fukai.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        nombre: 'admin',
        email: 'admin@fukai.com',
        password: 'admin123',
        rol: 'admin'
      });
      await adminUser.save();
      console.log('Test admin user created (admin@fukai.com / admin123)');
    }
  } catch (err) {
    console.error('Failed to seed admin user:', err);
  }
  // -------------------------------------------

  server.listen(PORT, () => {
    console.log(`\n🍰 ══════════════════════════════════════════`);
    console.log(`   深い Fukai Backend`);
    console.log(`   Server running on port ${PORT}`);
    console.log(`   WebSocket ready`);
    console.log(`🍰 ══════════════════════════════════════════\n`);
  });
});
