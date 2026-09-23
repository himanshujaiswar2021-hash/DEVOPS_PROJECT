const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');
const { sendSuccess, sendError } = require('../shared/responseHandler');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize DB schema
db.initDb();

// Health Check
app.get('/health', (req, res) => {
  sendSuccess(res, { service: 'Notification Service', port: PORT, status: 'UP' }, 'Notification Service is healthy');
});

// GET /api/notifications - List all notifications
app.get('/api/notifications', (req, res) => {
  try {
    const notifications = db.getAllNotifications();
    sendSuccess(res, notifications, 'Notifications retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/notifications/user/:userId - Get notifications for user
app.get('/api/notifications/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return sendError(res, 'Invalid user ID format', 400);

    const notifications = db.getNotificationsByUserId(userId);
    sendSuccess(res, notifications, 'User notifications retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/notifications/:id - Single notification
app.get('/api/notifications/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid notification ID format', 400);

    const notif = db.getNotificationById(id);
    if (!notif) return sendError(res, `Notification not found with id ${id}`, 404);

    sendSuccess(res, notif, 'Notification retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/notifications - Send / record a notification
app.post('/api/notifications', (req, res) => {
  try {
    const { user_id, channel, subject, message } = req.body;
    if (!user_id || !subject || !message) {
      return sendError(res, 'Missing required fields: user_id, subject, message', 400);
    }

    const validChannels = ['EMAIL', 'SMS', 'IN_APP', 'PUSH'];
    const selectedChannel = channel && validChannels.includes(channel.toUpperCase()) ? channel.toUpperCase() : 'EMAIL';

    const notif = db.createNotification({
      user_id: parseInt(user_id, 10),
      channel: selectedChannel,
      subject,
      message,
      status: 'SENT'
    });

    console.log(`[Notification Service] Dispatched [${selectedChannel}] to User #${user_id}: ${subject}`);
    sendSuccess(res, notif, 'Notification dispatched successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid notification ID format', 400);

    const updated = db.markAsRead(id);
    if (!updated) return sendError(res, `Notification not found with id ${id}`, 404);

    sendSuccess(res, updated, 'Notification marked as READ', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// DELETE /api/notifications/:id - Delete notification
app.delete('/api/notifications/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid notification ID format', 400);

    const deleted = db.deleteNotification(id);
    if (!deleted) return sendError(res, `Notification not found with id ${id}`, 404);

    sendSuccess(res, deleted, 'Notification deleted successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

app.listen(PORT, () => {
  console.log(`[Notification Service] Running on port ${PORT}`);
});
