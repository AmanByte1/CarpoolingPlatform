const jwt = require('jsonwebtoken');
const Trip = require('../models/Trip');
const Message = require('../models/Message');

function initSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No auth token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    // join a room dedicated to a specific trip, for live tracking + chat
    socket.on('trip:join', (tripId) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on('trip:leave', (tripId) => {
      socket.leave(`trip:${tripId}`);
    });

    // driver streams live GPS location
    socket.on('trip:location', async ({ tripId, lat, lng }) => {
      try {
        const trip = await Trip.findById(tripId);
        if (!trip || String(trip.driver) !== String(socket.userId)) return;
        trip.currentLocation = { lat, lng, updatedAt: new Date() };
        trip.status = 'in_progress';
        trip.trackHistory.push({ lat, lng });
        await trip.save();
        io.to(`trip:${tripId}`).emit('trip:location', { tripId, lat, lng, updatedAt: trip.currentLocation.updatedAt });
      } catch (err) {
        // silently ignore malformed updates
      }
    });

    // in-trip chat
    socket.on('chat:send', async ({ tripId, text }) => {
      try {
        if (!text || !text.trim()) return;
        const trip = await Trip.findById(tripId);
        if (!trip) return;
        const isParticipant =
          String(trip.driver) === String(socket.userId) ||
          trip.passengers.some((p) => String(p.user) === String(socket.userId));
        if (!isParticipant) return;

        const message = await Message.create({ trip: tripId, sender: socket.userId, text: text.trim() });
        const populated = await message.populate('sender', 'name avatarColor');
        io.to(`trip:${tripId}`).emit('chat:message', populated);
      } catch (err) {
        // ignore
      }
    });

    socket.on('call:signal', ({ tripId, signal }) => {
      socket.to(`trip:${tripId}`).emit('call:signal', { from: socket.userId, signal });
    });

    // Mutual "find where the other person is" — any participant (driver or
    // passenger) can share their live position, independent of trip status.
    // Useful before the trip officially starts, to coordinate pickup.
    socket.on('presence:share', async ({ tripId, lat, lng }) => {
      try {
        const trip = await Trip.findById(tripId);
        if (!trip) return;
        const isParticipant =
          String(trip.driver) === String(socket.userId) ||
          trip.passengers.some((p) => String(p.user) === String(socket.userId));
        if (!isParticipant) return;

        const updatedAt = new Date();
        const existing = trip.liveShares.find((s) => String(s.user) === String(socket.userId));
        if (existing) {
          existing.lat = lat;
          existing.lng = lng;
          existing.updatedAt = updatedAt;
        } else {
          trip.liveShares.push({ user: socket.userId, lat, lng, updatedAt });
        }
        await trip.save();

        io.to(`trip:${tripId}`).emit('presence:update', { tripId, userId: socket.userId, lat, lng, updatedAt });
      } catch (err) {
        // ignore malformed updates
      }
    });

    socket.on('presence:stop', async ({ tripId }) => {
      try {
        const trip = await Trip.findById(tripId);
        if (!trip) return;
        trip.liveShares = trip.liveShares.filter((s) => String(s.user) !== String(socket.userId));
        await trip.save();
        io.to(`trip:${tripId}`).emit('presence:stopped', { tripId, userId: socket.userId });
      } catch (err) {
        // ignore
      }
    });
  });
}

module.exports = initSocket;
