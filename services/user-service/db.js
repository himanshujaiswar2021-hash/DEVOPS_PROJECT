const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      country TEXT DEFAULT 'India',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed sample data if table is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const count = countStmt.get().count;

  if (count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('Rahul Sharma', 'rahul@example.com', 'pass1234', 'customer', '+91-9876543210');
    insertUser.run('Priya Patel', 'priya@example.com', 'pass5678', 'customer', '+91-9876543211');
    insertUser.run('Admin User', 'admin@example.com', 'adminpass', 'admin', '+91-9876543212');

    const insertAddress = db.prepare(`
      INSERT INTO addresses (user_id, street, city, state, zip_code, country)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertAddress.run(1, '42 MG Road', 'Bengaluru', 'Karnataka', '560001', 'India');
    insertAddress.run(2, '15 Park Street', 'Kolkata', 'West Bengal', '700016', 'India');
    console.log('[User Service] Seed data initialized in users.db');
  }
}

function getAllUsers() {
  return db.prepare('SELECT id, name, email, role, phone, created_at FROM users').all();
}

function getUserById(id) {
  const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(id);
  if (!user) return null;
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ?').all(id);
  return { ...user, addresses };
}

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function createUser({ name, email, password, role = 'customer', phone = null }) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, email, password, role, phone);
  return getUserById(result.lastInsertRowid);
}

function updateUser(id, { name, role, phone, password }) {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return null;

  const newName = name !== undefined ? name : existing.name;
  const newRole = role !== undefined ? role : existing.role;
  const newPhone = phone !== undefined ? phone : (existing.phone ?? null);
  const newPass = password !== undefined ? password : existing.password;

  const stmt = db.prepare(`
    UPDATE users SET name = ?, role = ?, phone = ?, password = ? WHERE id = ?
  `);
  stmt.run(newName, newRole, newPhone, newPass, id);
  return getUserById(id);
}

function deleteUser(id) {
  const existing = getUserById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return existing;
}

function addAddress({ user_id, street, city, state, zip_code, country = 'India' }) {
  const stmt = db.prepare(`
    INSERT INTO addresses (user_id, street, city, state, zip_code, country)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(user_id, street, city, state, zip_code, country);
  return db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
}

function getAddressesByUserId(userId) {
  return db.prepare('SELECT * FROM addresses WHERE user_id = ?').all(userId);
}

module.exports = {
  initDb,
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  addAddress,
  getAddressesByUserId
};
