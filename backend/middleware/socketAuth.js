const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from socket handshake and attaches user data to socket
 * Allows unauthenticated connections (for guest users)
 */
const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        // If no token provided, allow connection as guest
        if (!token) {
            socket.user = null;
            socket.isAuthenticated = false;
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.id);

        if (!user) {
            // Invalid user, but allow connection as guest
            socket.user = null;
            socket.isAuthenticated = false;
            return next();
        }

        // Attach user data to socket
        socket.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email
        };
        socket.isAuthenticated = true;

        console.log(`✅ Authenticated socket connection: ${user.username} (${socket.id})`);
        next();
    } catch (error) {
        // Token invalid or expired, allow connection as guest
        console.log(`⚠️ Socket auth failed, allowing as guest: ${error.message}`);
        socket.user = null;
        socket.isAuthenticated = false;
        next();
    }
};

module.exports = socketAuth;
