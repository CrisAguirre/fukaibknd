const setupWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client subscribes to order updates
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`👁️ Socket ${socket.id} watching order ${orderId}`);
    });

    // Client unsubscribes
    socket.on('order:unsubscribe', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`👋 Socket ${socket.id} stopped watching order ${orderId}`);
    });

    // Admin joins admin room
    socket.on('admin:join', () => {
      socket.join('admin');
      console.log(`🔑 Socket ${socket.id} joined admin room`);
    });

    // Cooker joins cooker room
    socket.on('cooker:join', () => {
      socket.join('cooker');
      console.log(`👨‍🍳 Socket ${socket.id} joined cooker room`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupWebSocket;
