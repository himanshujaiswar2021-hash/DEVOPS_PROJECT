const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');
const { sendSuccess, sendError } = require('../shared/responseHandler');

const app = express();
const PORT = process.env.PORT || 3003;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize DB schema
db.initDb();

// Health Check
app.get('/health', (req, res) => {
  sendSuccess(res, { service: 'Order Service', port: PORT, status: 'UP' }, 'Order Service is healthy');
});

// GET /api/orders - List all orders
app.get('/api/orders', (req, res) => {
  try {
    const orders = db.getAllOrders();
    sendSuccess(res, orders, 'Orders retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/orders/user/:userId - Get orders for user
app.get('/api/orders/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return sendError(res, 'Invalid user ID format', 400);

    const orders = db.getOrdersByUserId(userId);
    sendSuccess(res, orders, 'User orders retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/orders/:id - Single order details with items
app.get('/api/orders/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid order ID format', 400);

    const order = db.getOrderById(id);
    if (!order) return sendError(res, `Order not found with id ${id}`, 404);

    sendSuccess(res, order, 'Order retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/orders - Create new order (with Product Service inventory validation)
app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, items, shipping_address } = req.body;
    if (!user_id || !items || !Array.isArray(items) || items.length === 0 || !shipping_address) {
      return sendError(res, 'Missing required order fields: user_id, items (array), shipping_address', 400);
    }

    // Step 1: Validate items and reserve inventory with Product Service
    let calculatedTotal = 0;
    const processedItems = [];
    const reservedItems = [];

    for (const item of items) {
      const prodRes = await fetch(`${PRODUCT_SERVICE_URL}/api/products/${item.product_id}`);
      if (!prodRes.ok) {
        // Rollback reserved items
        for (const resItem of reservedItems) {
          await fetch(`${PRODUCT_SERVICE_URL}/api/products/${resItem.product_id}/restore-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: resItem.quantity })
          });
        }
        return sendError(res, `Product with id ${item.product_id} not found in catalog`, 404);
      }

      const prodData = await prodRes.json();
      const product = prodData.data;

      // Reserve stock
      const reserveRes = await fetch(`${PRODUCT_SERVICE_URL}/api/products/${item.product_id}/reserve-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity })
      });

      if (!reserveRes.ok) {
        const errorData = await reserveRes.json();
        // Rollback already reserved items
        for (const resItem of reservedItems) {
          await fetch(`${PRODUCT_SERVICE_URL}/api/products/${resItem.product_id}/restore-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: resItem.quantity })
          });
        }
        return sendError(res, errorData.message || `Insufficient stock for product: ${product.name}`, 400);
      }

      reservedItems.push({ product_id: item.product_id, quantity: item.quantity });
      const subtotal = product.price * item.quantity;
      calculatedTotal += subtotal;

      processedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal
      });
    }

    // Step 2: Create Order in database
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = db.createOrder({
      order_number: orderNumber,
      user_id,
      total_amount: calculatedTotal,
      status: 'PENDING',
      shipping_address,
      items: processedItems
    });

    // Step 3: Trigger async notification via Notification Service (non-blocking)
    try {
      fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          channel: 'EMAIL',
          subject: `Order Confirmation: ${orderNumber}`,
          message: `Thank you! Your order #${orderNumber} for total INR ${calculatedTotal} has been placed successfully.`
        })
      }).catch(e => console.warn('[Order Service] Notification dispatch error (ignored):', e.message));
    } catch (_) {}

    sendSuccess(res, newOrder, 'Order created successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// PUT /api/orders/:id/status - Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid order ID format', 400);

    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const updated = db.updateOrderStatus(id, status.toUpperCase());
    if (!updated) return sendError(res, `Order not found with id ${id}`, 404);

    // Notify user of status update
    try {
      fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: updated.user_id,
          channel: 'IN_APP',
          subject: `Order Update: ${updated.order_number}`,
          message: `Your order #${updated.order_number} status has changed to ${updated.status}.`
        })
      }).catch(e => console.warn('[Order Service] Notification dispatch error (ignored):', e.message));
    } catch (_) {}

    sendSuccess(res, updated, `Order status updated to ${status.toUpperCase()}`, 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// DELETE /api/orders/:id - Cancel and delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid order ID format', 400);

    const existing = db.getOrderById(id);
    if (!existing) return sendError(res, `Order not found with id ${id}`, 404);

    // Restore stock in Product Service for deleted order
    for (const item of existing.items) {
      try {
        await fetch(`${PRODUCT_SERVICE_URL}/api/products/${item.product_id}/restore-stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: item.quantity })
        });
      } catch (e) {
        console.warn(`[Order Service] Failed to restore stock for product ${item.product_id}:`, e.message);
      }
    }

    const deleted = db.deleteOrder(id);
    sendSuccess(res, deleted, 'Order cancelled and deleted successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

app.listen(PORT, () => {
  console.log(`[Order Service] Running on port ${PORT}`);
});
