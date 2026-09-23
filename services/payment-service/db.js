const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'payments.db');
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM payments').get().count;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO payments (transaction_id, order_id, user_id, amount, currency, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run('TXN-2026-9901', 1, 1, 119999.00, 'INR', 'UPI', 'COMPLETED');
    console.log('[Payment Service] Seed data initialized in payments.db');
  }
}

function getAllPayments() {
  return db.prepare('SELECT * FROM payments ORDER BY id DESC').all();
}

function getPaymentById(id) {
  return db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
}

function getPaymentsByOrderId(orderId) {
  return db.prepare('SELECT * FROM payments WHERE order_id = ?').all(orderId);
}

function createPayment({ transaction_id, order_id, user_id, amount, currency = 'INR', payment_method, status = 'COMPLETED' }) {
  const stmt = db.prepare(`
    INSERT INTO payments (transaction_id, order_id, user_id, amount, currency, payment_method, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(transaction_id, order_id, user_id, amount, currency, payment_method, status);
  return getPaymentById(result.lastInsertRowid);
}

function updatePayment(id, updates) {
  const existing = getPaymentById(id);
  if (!existing) return null;

  const status = updates.status !== undefined ? updates.status : existing.status;
  const payment_method = updates.payment_method !== undefined ? updates.payment_method : existing.payment_method;

  db.prepare('UPDATE payments SET status = ?, payment_method = ? WHERE id = ?').run(status, payment_method, id);
  return getPaymentById(id);
}

function deletePayment(id) {
  const existing = getPaymentById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  return existing;
}

module.exports = {
  initDb,
  getAllPayments,
  getPaymentById,
  getPaymentsByOrderId,
  createPayment,
  updatePayment,
  deletePayment
};
