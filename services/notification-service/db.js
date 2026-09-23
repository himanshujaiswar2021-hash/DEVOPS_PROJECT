const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'notifications.db');
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'SENT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO notifications (user_id, channel, subject, message, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(1, 'EMAIL', 'Welcome to E-Shop', 'Hello Rahul, your account has been registered successfully!', 'DELIVERED');
    insert.run(1, 'EMAIL', 'Order Confirmation: ORD-2026-1001', 'Thank you! Your order has been placed successfully.', 'DELIVERED');
    console.log('[Notification Service] Seed data initialized in notifications.db');
  }
}

function getAllNotifications() {
  return db.prepare('SELECT * FROM notifications ORDER BY id DESC').all();
}

function getNotificationById(id) {
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

function getNotificationsByUserId(userId) {
  return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC').all(userId);
}

function createNotification({ user_id, channel = 'EMAIL', subject, message, status = 'SENT' }) {
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, channel, subject, message, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(user_id, channel, subject, message, status);
  return getNotificationById(result.lastInsertRowid);
}

function markAsRead(id) {
  const existing = getNotificationById(id);
  if (!existing) return null;
  db.prepare('UPDATE notifications SET status = ? WHERE id = ?').run('READ', id);
  return getNotificationById(id);
}

function deleteNotification(id) {
  const existing = getNotificationById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  return existing;
}

module.exports = {
  initDb,
  getAllNotifications,
  getNotificationById,
  getNotificationsByUserId,
  createNotification,
  markAsRead,
  deleteNotification
};
