const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');
const { sendSuccess, sendError } = require('../shared/responseHandler');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize DB schema
db.initDb();

// Health Check
app.get('/health', (req, res) => {
  sendSuccess(res, { service: 'Product Service', port: PORT, status: 'UP' }, 'Product Service is healthy');
});

// GET /api/products/categories - List categories
app.get('/api/products/categories', (req, res) => {
  try {
    const categories = db.getAllCategories();
    sendSuccess(res, categories, 'Categories retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/products/categories - Create category
app.post('/api/products/categories', (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return sendError(res, 'Category name is required', 400);
    }
    const cat = db.createCategory({ name, description });
    sendSuccess(res, cat, 'Category created successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/products - List products (supports query params: search, category_id)
app.get('/api/products', (req, res) => {
  try {
    const { search, category_id } = req.query;
    const catId = category_id ? parseInt(category_id, 10) : null;
    const products = db.getAllProducts(search, catId);
    sendSuccess(res, products, 'Products retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// GET /api/products/:id - Single product
app.get('/api/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid product ID format', 400);

    const product = db.getProductById(id);
    if (!product) return sendError(res, `Product not found with id ${id}`, 404);

    sendSuccess(res, product, 'Product retrieved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/products - Create product
app.post('/api/products', (req, res) => {
  try {
    const { category_id, name, description, price, stock_quantity, sku, image_url } = req.body;
    if (!name || price === undefined || !sku) {
      return sendError(res, 'Missing required fields: name, price, sku', 400);
    }

    const newProd = db.createProduct({ category_id, name, description, price: parseFloat(price), stock_quantity: parseInt(stock_quantity || 0, 10), sku, image_url });
    sendSuccess(res, newProd, 'Product created successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// PUT /api/products/:id - Update product
app.put('/api/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid product ID format', 400);

    const updated = db.updateProduct(id, req.body);
    if (!updated) return sendError(res, `Product not found with id ${id}`, 404);

    sendSuccess(res, updated, 'Product updated successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// DELETE /api/products/:id - Delete product
app.delete('/api/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return sendError(res, 'Invalid product ID format', 400);

    const deleted = db.deleteProduct(id);
    if (!deleted) return sendError(res, `Product not found with id ${id}`, 404);

    sendSuccess(res, deleted, 'Product deleted successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/products/:id/reserve-stock - Inter-service API to check & reserve inventory
app.post('/api/products/:id/reserve-stock', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return sendError(res, 'Valid positive quantity is required', 400);
    }

    const result = db.reserveStock(id, parseInt(quantity, 10));
    if (!result.success) {
      return sendError(res, result.reason, 400);
    }

    sendSuccess(res, result.product, 'Inventory reserved successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// POST /api/products/:id/restore-stock - Inter-service API to restore inventory on cancel
app.post('/api/products/:id/restore-stock', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return sendError(res, 'Valid positive quantity is required', 400);
    }

    const result = db.restoreStock(id, parseInt(quantity, 10));
    if (!result.success) {
      return sendError(res, result.reason, 400);
    }

    sendSuccess(res, result.product, 'Inventory restored successfully', 200);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

app.listen(PORT, () => {
  console.log(`[Product Service] Running on port ${PORT}`);
});
