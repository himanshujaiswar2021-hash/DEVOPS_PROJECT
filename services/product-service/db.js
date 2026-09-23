const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'products.db');
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      sku TEXT UNIQUE NOT NULL,
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  try {
    db.exec('ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT "";');
  } catch (_) {}

  // Seed categories
  const categoriesList = [
    { name: 'Women Ethnic', desc: 'Sarees, Kurtis, Kurta Sets & Lehengas' },
    { name: 'Women Western', desc: 'Dresses, Tops, Jeans & Jumpsuits' },
    { name: 'Men Fashion', desc: 'Shirts, T-shirts, Trousers & Ethnic Wear' },
    { name: 'Electronics', desc: 'Smartwatches, Earbuds, Accessories & Gadgets' },
    { name: 'Home & Kitchen', desc: 'Cookware, Kitchen Tools, Bedsheets & Curtains' },
    { name: 'Footwear & Bags', desc: 'Sneakers, Flats, Handbags & Backpacks' },
    { name: 'Beauty & Health', desc: 'Skincare, Haircare, Makeup & Wellness' }
  ];

  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  for (const c of categoriesList) {
    insertCat.run(c.name, c.desc);
  }

  // Check product count - seed rich Meesho catalog if less than 8 items exist
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

  if (count < 8) {
    const insertProd = db.prepare(`
      INSERT OR IGNORE INTO products (category_id, name, description, price, stock_quantity, sku, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const seedItems = [
      [1, 'Designer Georgette Embroidered Anarkali Kurti', 'Soft breathable georgette with intricate foil print and gota patti work. Includes matching dupatta.', 499.00, 150, 'SKU-KURTI-01', '👗'],
      [1, 'Kanjeevaram Jacquard Woven Soft Silk Saree', 'Rich woven zari border with contrast designer pallu. Perfect for festive ceremonies.', 799.00, 80, 'SKU-SAREE-02', '🥻'],
      [1, 'Cotton Chikankari Straight Kurta Set with Pants', 'Handcrafted floral embroidery with premium summer cotton fabric.', 649.00, 120, 'SKU-KURTA-03', '👘'],
      [2, 'Floral Print High-Waist Flared A-Line Maxi Dress', 'Chic summer casual maxi dress with smocked waist and flutter sleeves.', 449.00, 95, 'SKU-DRESS-04', '👗'],
      [2, 'Women Regular Fit High-Rise Denim Jeans', 'Stretchable comfortable cotton denim with 5-pocket styling.', 599.00, 110, 'SKU-JEANS-05', '👖'],
      [3, 'Men Slim Fit Casual Checked 100% Cotton Shirt', 'Premium breathable cotton fabric suitable for office and weekend casual wear.', 389.00, 140, 'SKU-SHIRT-06', '👔'],
      [3, 'Men Solid Round Neck Breathable Cotton T-Shirts (Pack of 3)', 'Bio-washed combed cotton t-shirts in Black, Navy Blue, and Heather Grey.', 499.00, 200, 'SKU-TSHIRT-07', '👕'],
      [4, 'Noise ColorFit Pulse 2 Max 1.85" Bluetooth Smartwatch', '1.85" TFT LCD, 550 Nits brightness, Bluetooth calling, 100 sports modes, 10-day battery.', 1299.00, 75, 'SKU-NOISE-08', '⌚'],
      [4, 'boAt Airdopes 141 Bluetooth TWS Earbuds (42H Playtime)', 'ENx noise cancelling mic, ASAP fast charge (5 mins = 75 mins playtime), IPX4 water resistance.', 999.00, 130, 'SKU-BOAT-09', '🎧'],
      [4, 'Apple iPhone 15 Pro (128GB Titanium)', 'Aerospace-grade titanium design, A17 Pro chip, 48MP main camera with 3x optical zoom.', 119999.00, 25, 'SKU-IPHONE15P', '📱'],
      [5, 'Non-Stick Granite Induction Base Cookware Set (3 Pcs)', 'Includes Dosa Tawa, Frying Pan, and Kadhai with tempered glass lid. 100% PFOA free.', 899.00, 60, 'SKU-COOK-10', '🍳'],
      [5, 'Stainless Steel Insulated Hot & Cold Thermos Flask 1L', 'Double-wall vacuum insulation keeps liquids hot or cold for up to 24 hours.', 349.00, 180, 'SKU-FLASK-11', '🍶'],
      [6, 'Men Lightweight Breathable Mesh Running Shoes', 'Shock absorbing EVA sole, memory foam insole, slip-resistant sports sneakers.', 499.00, 100, 'SKU-SHOES-12', '👟'],
      [6, 'Women Trendy Quilted Crossbody Shoulder Handbag', 'Premium PU leather with gold-tone hardware, multiple compartments and adjustable strap.', 379.00, 160, 'SKU-BAG-13', '👜'],
      [7, 'Natural Vitamin C Glow Face Serum (30ml)', 'Infused with Ferulic Acid and Hyaluronic Acid for brightening and dark spot reduction.', 249.00, 250, 'SKU-SERUM-14', '✨'],
      [4, 'Dell XPS 15 InfinityEdge Laptop (16GB RAM, 1TB SSD)', '15.6" FHD+ display, Intel Core i9-13900H, NVIDIA GeForce RTX 4070.', 154999.00, 15, 'SKU-DELLXPS15', '💻']
    ];

    for (const item of seedItems) {
      insertProd.run(item[0], item[1], item[2], item[3], item[4], item[5], item[6]);
    }
    console.log('[Product Service] Extended Meesho-style catalog initialized in products.db');
  }
}

function getAllProducts(search = '', categoryId = null) {
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (categoryId) {
    query += ` AND p.category_id = ?`;
    params.push(categoryId);
  }
  query += ` ORDER BY p.id ASC`;

  return db.prepare(query).all(...params);
}

function getProductById(id) {
  return db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ?
  `).get(id);
}

function createProduct({ category_id, name, description, price, stock_quantity, sku, image_url = '' }) {
  const stmt = db.prepare(`
    INSERT INTO products (category_id, name, description, price, stock_quantity, sku, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(category_id || null, name, description, price, stock_quantity || 0, sku, image_url || '');
  return getProductById(result.lastInsertRowid);
}

function updateProduct(id, updates) {
  const existing = getProductById(id);
  if (!existing) return null;

  const category_id = updates.category_id !== undefined ? updates.category_id : existing.category_id;
  const name = updates.name !== undefined ? updates.name : existing.name;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const price = updates.price !== undefined ? updates.price : existing.price;
  const stock_quantity = updates.stock_quantity !== undefined ? updates.stock_quantity : existing.stock_quantity;
  const sku = updates.sku !== undefined ? updates.sku : existing.sku;
  const image_url = updates.image_url !== undefined ? updates.image_url : (existing.image_url || '');

  const stmt = db.prepare(`
    UPDATE products 
    SET category_id = ?, name = ?, description = ?, price = ?, stock_quantity = ?, sku = ?, image_url = ?
    WHERE id = ?
  `);
  stmt.run(category_id ?? null, name, description ?? null, price, stock_quantity, sku, image_url, id);
  return getProductById(id);
}

function deleteProduct(id) {
  const existing = getProductById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return existing;
}

function reserveStock(id, quantity) {
  const product = getProductById(id);
  if (!product) return { success: false, reason: 'Product not found' };
  if (product.stock_quantity < quantity) {
    return { success: false, reason: `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${quantity}` };
  }

  db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?').run(quantity, id);
  return { success: true, product: getProductById(id) };
}

function restoreStock(id, quantity) {
  const product = getProductById(id);
  if (!product) return { success: false, reason: 'Product not found' };
  db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?').run(quantity, id);
  return { success: true, product: getProductById(id) };
}

function getAllCategories() {
  return db.prepare('SELECT * FROM categories').all();
}

function createCategory({ name, description }) {
  const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  const result = stmt.run(name, description);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
}

module.exports = {
  initDb,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reserveStock,
  restoreStock,
  getAllCategories,
  createCategory
};
