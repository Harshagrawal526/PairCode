const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const socketAuth = require('./middleware/socketAuth');

const {
  handleJoinRoom,
  handleLeaveRoom,
  handleCodeChange,
  handleDisconnect,
  handleSetUsername,
  handleSendMessage
} = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Apply socket authentication middleware
io.use(socketAuth);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'CodeCanvas Backend is running!',
    version: '3.0.0',
    status: 'healthy'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join-room', handleJoinRoom(io, socket));
  socket.on('leave-room', handleLeaveRoom(io, socket));
  socket.on('code-change', handleCodeChange(io, socket));
  socket.on('set-username', handleSetUsername(io, socket));
  socket.on('send-message', handleSendMessage(io, socket));
  socket.on('disconnect', handleDisconnect(io, socket));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});