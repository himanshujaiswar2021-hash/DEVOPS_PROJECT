const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');
const { sendSuccess, sendError } = require('../shared/responseHandler');

const app = express();
const PORT = process.env.PORT || 3004;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize DB schema
db.initDb();

// Health Check
app.get('/health', (req, res) => {
  sendSuccess(res, { service: 'Payment Service', port: PORT, status: 'UP' }, 'Payment Service is healthy');
});

// GET /api/payments - List all payments
app.get('/api/payments', (req, res) => {
  try {
    const payments = db.getAllPayments();
    sendSuccess(res, payments, 'Payments retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/payments/order/:orderId - List payments for order
app.get('/api/payments/order/:orderId', (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    if (isNaN(orderId)) return sendError(res, 'Invalid order ID format', 400);

    const payments = db.getPaymentsByOrderId(orderId);
    sendSuccess(res, payments, 'Order payments retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/payments/:id - Single payment
app.get('/api/payments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid payment ID format', 400);

    const payment = db.getPaymentById(id);
    if (!payment) return sendError(res, `Payment not found with id ${id}`, 404);

    sendSuccess(res, payment, 'Payment retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/payments - Process payment for an order
app.post('/api/payments', async (req, res) => {
  try {
    const { order_id, user_id, amount, payment_method, currency = 'INR' } = req.body;
    if (!order_id || !user_id || !amount || !payment_method) {
      return sendError(res, 'Missing required fields: order_id, user_id, amount, payment_method', 400);
    }

    const validMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH_ON_DELIVERY'];
    if (!validMethods.includes(payment_method.toUpperCase())) {
      return sendError(res, `Invalid payment method. Must be one of: ${validMethods.join(', ')}`, 400);
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment = db.createPayment({
      transaction_id: transactionId,
      order_id: parseInt(order_id, 10),
      user_id: parseInt(user_id, 10),
      amount: parseFloat(amount),
      currency,
      payment_method: payment_method.toUpperCase(),
      status: 'COMPLETED'
    });

    // Inter-service call: Update Order Service status to 'CONFIRMED'
    try {
      await fetch(`${ORDER_SERVICE_URL}/api/orders/${order_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' })
      });
    } catch (e) {
      console.warn('[Payment Service] Failed to notify Order Service of payment:', e.message);
    }

    // Inter-service call: Send payment receipt notification via Notification Service
    try {
      fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          channel: 'SMS',
          subject: 'Payment Successful',
          message: `Payment of ${currency} ${amount} received for Order #${order_id}. Ref: ${transactionId}`
        })
      }).catch(e => console.warn('[Payment Service] Notification dispatch error (ignored):', e.message));
    } catch (_) {}

    sendSuccess(res, newPayment, 'Payment processed successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// PUT /api/payments/:id - Update payment status
app.put('/api/payments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid payment ID format', 400);

    const updated = db.updatePayment(id, req.body);
    if (!updated) return sendError(res, `Payment not found with id ${id}`, 404);

    sendSuccess(res, updated, 'Payment updated successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// DELETE /api/payments/:id - Refund / Cancel payment
app.delete('/api/payments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid payment ID format', 400);

    const existing = db.getPaymentById(id);
    if (!existing) return sendError(res, `Payment not found with id ${id}`, 404);

    // Mark as refunded instead of outright drop, or return deleted
    const refunded = db.updatePayment(id, { status: 'REFUNDED' });
    sendSuccess(res, refunded, 'Payment marked as REFUNDED and cancelled', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

app.listen(PORT, () => {
  console.log(`[Payment Service] Running on port ${PORT}`);
});
