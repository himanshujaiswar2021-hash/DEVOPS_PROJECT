const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');
const { sendSuccess, sendError } = require('../shared/responseHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize DB schema
db.initDb();

// Health Check
app.get('/health', (req, res) => {
  sendSuccess(res, { service: 'User Service', port: PORT, status: 'UP' }, 'User Service is healthy');
});

// GET /api/users - List all users
app.get('/api/users', (req, res) => {
  try {
    const users = db.getAllUsers();
    sendSuccess(res, users, 'Users retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/users/:id - Get single user by ID
app.get('/api/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 'Invalid user ID format', 400);
    }
    const user = db.getUserById(id);
    if (!user) {
      return sendError(res, `User not found with id ${id}`, 404);
    }
    sendSuccess(res, user, 'User retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/users - Create new user
app.post('/api/users', (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 'Missing required fields: name, email, password', 400);
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return sendError(res, `User with email ${email} already exists`, 409);
    }

    const newUser = db.createUser({ name, email, password, role, phone });
    sendSuccess(res, newUser, 'User created successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// PUT /api/users/:id - Update user details
app.put('/api/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    const updated = db.updateUser(id, req.body);
    if (!updated) {
      return sendError(res, `User not found with id ${id}`, 404);
    }
    sendSuccess(res, updated, 'User updated successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// DELETE /api/users/:id - Delete user
app.delete('/api/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    const deleted = db.deleteUser(id);
    if (!deleted) {
      return sendError(res, `User not found with id ${id}`, 404);
    }
    sendSuccess(res, deleted, 'User deleted successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/users/:id/addresses - Add user address
app.post('/api/users/:id/addresses', (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = db.getUserById(userId);
    if (!user) {
      return sendError(res, `User not found with id ${userId}`, 404);
    }

    const { street, city, state, zip_code, country } = req.body;
    if (!street || !city || !state || !zip_code) {
      return sendError(res, 'Missing required address fields: street, city, state, zip_code', 400);
    }

    const address = db.addAddress({ user_id: userId, street, city, state, zip_code, country });
    sendSuccess(res, address, 'Address added successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/users/:id/addresses - Get user addresses
app.get('/api/users/:id/addresses', (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const addresses = db.getAddressesByUserId(userId);
    sendSuccess(res, addresses, 'User addresses retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

app.listen(PORT, () => {
  console.log(`[User Service] Running on port ${PORT}`);
});
