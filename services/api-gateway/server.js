const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { exec } = require('child_process');
const { sendSuccess, sendError } = require('../shared/responseHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Load Swagger document
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));

app.use(cors());
app.use(morgan('dev'));

// Serve UI dashboard static files
app.use(express.static(path.join(__dirname, 'public')));

// Admin portal route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve unified Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: block }',
  customSiteTitle: 'Microservices API Documentation'
}));

// Route to download Postman Collection
app.get('/postman-collection', (req, res) => {
  const filePath = path.join(__dirname, '..', '..', 'postman', 'E-Commerce_Microservices.postman_collection.json');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'E-Commerce_Microservices.postman_collection.json');
  } else {
    sendError(res, 'Postman collection file not found', 404);
  }
});

// Route to run automated test suite and return results to UI
app.get('/api/run-tests', (req, res) => {
  const testScriptPath = path.join(__dirname, '..', '..', 'tests', 'run-all-tests.js');
  exec(`node "${testScriptPath}"`, { env: { ...process.env, BASE_URL: `http://localhost:${PORT}` } }, (error, stdout, stderr) => {
    res.json({
      success: !error,
      statusCode: error ? 500 : 200,
      output: stdout || stderr,
      timestamp: new Date().toISOString()
    });
  });
});

// Services Configuration
const SERVICES = [
  { name: 'User Service', port: 3001, route: '/api/users', target: process.env.USER_SERVICE_URL || 'http://localhost:3001' },
  { name: 'Product Service', port: 3002, route: '/api/products', target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002' },
  { name: 'Order Service', port: 3003, route: '/api/orders', target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003' },
  { name: 'Payment Service', port: 3004, route: '/api/payments', target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004' },
  { name: 'Notification Service', port: 3005, route: '/api/notifications', target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005' }
];

// Health Check Aggregator across all microservices
app.get('/health', async (req, res) => {
  const results = [];
  let allHealthy = true;

  for (const s of SERVICES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const resp = await fetch(`${s.target}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        results.push({ name: s.name, port: s.port, status: 'UP' });
      } else {
        results.push({ name: s.name, port: s.port, status: 'DOWN', statusCode: resp.status });
        allHealthy = false;
      }
    } catch (err) {
      results.push({ name: s.name, port: s.port, status: 'DOWN', error: err.message });
      allHealthy = false;
    }
  }

  sendSuccess(res, {
    gateway: 'UP',
    port: PORT,
    services: results,
    overallHealth: allHealthy ? 'HEALTHY' : 'DEGRADED'
  }, 'Gateway health status', 200);
});

// Configure Reverse Proxy Routing for each Microservice
SERVICES.forEach(service => {
  app.use(
    createProxyMiddleware({
      target: service.target,
      changeOrigin: true,
      pathFilter: service.route,
      on: {
        error: (err, req, res) => {
          console.error(`[API Gateway] Error proxying to ${service.name}:`, err.message);
          res.status(503).json({
            success: false,
            statusCode: 503,
            error: 'Service Unavailable',
            message: `Unable to reach ${service.name} on port ${service.port}. Ensure the service is running.`,
            timestamp: new Date().toISOString()
          });
        }
      }
    })
  );
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on http://localhost:${PORT}`);
  console.log(`[API Gateway] Swagger UI available at http://localhost:${PORT}/api-docs`);
});
