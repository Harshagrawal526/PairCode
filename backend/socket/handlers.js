const Room = require('../models/Room');

// In-memory active rooms
const activeRooms = new Map();

const handleJoinRoom = (io, socket) => async (roomId) => {
  socket.join(roomId);

  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, {
      users: new Map(), // Map to store username
      usernames: new Set(), // Set to track unique usernames
      code: { html: '', css: '', js: '' }
    });
  }

  const activeRoom = activeRooms.get(roomId);

  // Check if user is authenticated
  if (socket.isAuthenticated && socket.user) {
    const username = socket.user.username;

    // Auto-set username for authenticated users
    activeRoom.users.set(socket.id, {
      username,
      isAuthenticated: true,
      userId: socket.user.id
    });
    activeRoom.usernames.add(username);

    console.log(`✅ Authenticated user ${username} (${socket.id}) joined room ${roomId}`);

    // Notify others that user joined chat
    socket.to(roomId).emit('user-joined-chat', { username });
  } else {
    // Guest user - username will be set manually later
    activeRoom.users.set(socket.id, {
      username: null,
      isAuthenticated: false,
      userId: null
    });

    console.log(`👤 Guest user ${socket.id} joined room ${roomId}`);
  }

  try {
    const dbRoom = await Room.findOne({ roomId });
    if (dbRoom) {
      activeRoom.code = dbRoom.code;
    }
  } catch (error) {
    console.error('Error loading room:', error);
  }

  socket.emit('load-code', activeRoom.code);

  // Send authenticated user info to client
  if (socket.isAuthenticated && socket.user) {
    socket.emit('authenticated-user', {
      username: socket.user.username,
      userId: socket.user.id
    });
  }

  io.to(roomId).emit('users-in-room', activeRoom.users.size);
};

const handleSetUsername = (io, socket) => ({ roomId, username }) => {
  if (activeRooms.has(roomId)) {
    const room = activeRooms.get(roomId);
    const user = room.users.get(socket.id);

    // Prevent authenticated users from changing their username
    if (socket.isAuthenticated && user && user.isAuthenticated) {
      socket.emit('username-error', {
        message: 'Authenticated users cannot change their username'
      });
      return;
    }

    // Check if username is already taken
    if (room.usernames.has(username)) {
      socket.emit('username-taken');
      return;
    }

    if (user && !user.isAuthenticated) {
      user.username = username;
      room.usernames.add(username);
      console.log(`User ${socket.id} set username to ${username} in room ${roomId}`);

      socket.emit('username-accepted');

      // Notify others that user joined chat
      socket.to(roomId).emit('user-joined-chat', { username });
    }
  }
};

const handleSendMessage = (io, socket) => ({ roomId, message }) => {
  if (activeRooms.has(roomId)) {
    const room = activeRooms.get(roomId);
    const user = room.users.get(socket.id);

    if (user && user.username) {
      const messageData = {
        username: user.username,
        message,
        timestamp: Date.now(),
        socketId: socket.id
      };

      // Send to all users including sender
      io.to(roomId).emit('chat-message', messageData);
      console.log(`Message from ${user.username} in room ${roomId}: ${message}`);
    }
  }
};

const handleLeaveRoom = (io, socket) => (roomId) => {
  handleUserLeave(io, socket.id, roomId);
};

const handleCodeChange = (io, socket) => async ({ roomId, language, code }) => {
  if (activeRooms.has(roomId)) {
    const activeRoom = activeRooms.get(roomId);
    activeRoom.code[language] = code;

    socket.to(roomId).emit('code-update', { language, code });

    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          code: activeRoom.code,
          lastModified: Date.now()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  }
};

const handleDisconnect = (io, socket) => () => {
  console.log('❌ User disconnected:', socket.id);

  activeRooms.forEach((room, roomId) => {
    if (room.users.has(socket.id)) {
      handleUserLeave(io, socket.id, roomId);
    }
  });
};

const handleUserLeave = (io, socketId, roomId) => {
  if (activeRooms.has(roomId)) {
    const room = activeRooms.get(roomId);
    const user = room.users.get(socketId);

    // Remove username from set and notify if user had set username
    if (user && user.username) {
      room.usernames.delete(user.username);
      io.to(roomId).emit('user-left-chat', { username: user.username });
    }

    room.users.delete(socketId);
    const usersInRoom = room.users.size;

    console.log(`User ${socketId} left room ${roomId}. Users remaining: ${usersInRoom}`);

    if (usersInRoom === 0) {
      activeRooms.delete(roomId);
      console.log(`Room ${roomId} removed from memory`);
    } else {
      io.to(roomId).emit('users-in-room', usersInRoom);
    }
  }
};

module.exports = {
  handleJoinRoom,
  handleLeaveRoom,
  handleCodeChange,
  handleDisconnect,
  handleSetUsername,
  handleSendMessage,
  activeRooms
};