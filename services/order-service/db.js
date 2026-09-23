const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'orders.db');
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'PENDING',
      shipping_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Seed sample order if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (count === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, user_id, total_amount, status, shipping_address)
      VALUES (?, ?, ?, ?, ?)
    `);
    const orderRes = insertOrder.run('ORD-2026-1001', 1, 119999.00, 'CONFIRMED', '42 MG Road, Bengaluru, Karnataka, 560001');

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertItem.run(orderRes.lastInsertRowid, 1, 'Apple iPhone 15 Pro', 1, 119999.00, 119999.00);

    console.log('[Order Service] Seed data initialized in orders.db');
  }
}

function getAllOrders() {
  const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  return orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });
}

function getOrderById(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return { ...order, items };
}

function getOrdersByUserId(userId) {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(userId);
  return orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });
}

function createOrder({ order_number, user_id, total_amount, status = 'PENDING', shipping_address, items }) {
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, user_id, total_amount, status, shipping_address)
    VALUES (?, ?, ?, ?, ?)
  `);
  const orderRes = insertOrder.run(order_number, user_id, total_amount, status, shipping_address);
  const orderId = orderRes.lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal);
  }

  return getOrderById(orderId);
}

function updateOrderStatus(id, status) {
  const existing = getOrderById(id);
  if (!existing) return null;

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return getOrderById(id);
}

function deleteOrder(id) {
  const existing = getOrderById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return existing;
}

module.exports = {
  initDb,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
