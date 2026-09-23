/**
 * Automated Microservices Test Runner
 * Validates GET, POST, PUT, DELETE operations across all 5 microservices
 * and verifies inter-service communication and error handling.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let passed = 0;
let failed = 0;

async function runTest(testName, method, endpoint, body = null, expectedStatus = 200, validator = null) {
  process.stdout.write(`  [TEST] ${method} ${endpoint} - ${testName}... `);
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    let json = null;
    try {
      json = await res.json();
    } catch (_) {}

    const statusMatch = res.status === expectedStatus;
    const customValidation = validator ? validator(json, res) : true;

    if (statusMatch && customValidation) {
      console.log(`${colors.green}✓ PASS (HTTP ${res.status})${colors.reset}`);
      passed++;
      return json;
    } else {
      console.log(`${colors.red}✗ FAIL (Expected HTTP ${expectedStatus}, Got ${res.status})${colors.reset}`);
      if (json) {
        console.log(`    Response: ${JSON.stringify(json)}`);
      }
      failed++;
      return null;
    }
  } catch (err) {
    console.log(`${colors.red}✗ ERROR: ${err.message}${colors.reset}`);
    failed++;
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  SBSMA - E-COMMERCE MICROSERVICES TEST SUITE       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  console.log(`${colors.yellow}Target Base URL: ${BASE_URL}${colors.reset}\n`);

  // 0. Health Check
  console.log(`${colors.bold}[0] API Gateway Health Check${colors.reset}`);
  await runTest('Check Gateway & 5 Services Health', 'GET', '/health', null, 200, (data) => {
    return data && data.data && data.data.overallHealth === 'HEALTHY';
  });

  // 1. User Service
  console.log(`\n${colors.bold}[1] User Service Tests (Port 3001)${colors.reset}`);
  await runTest('GET All Users', 'GET', '/api/users', null, 200, data => Array.isArray(data.data));
  await runTest('GET User by ID', 'GET', '/api/users/1', null, 200, data => data.data.id === 1);
  
  const testUserEmail = `testuser_${Date.now()}@example.com`;
  const createdUser = await runTest('POST Create User', 'POST', '/api/users', {
    name: 'Vikram Malhotra',
    email: testUserEmail,
    password: 'password999',
    role: 'customer',
    phone: '+91-9876543999'
  }, 201, data => data.data.email === testUserEmail);

  let newUserId = createdUser ? createdUser.data.id : 3;

  await runTest('PUT Update User Name', 'PUT', `/api/users/${newUserId}`, {
    name: 'Vikram S. Malhotra'
  }, 200, data => data.data.name === 'Vikram S. Malhotra');

  await runTest('POST Add User Address', 'POST', `/api/users/${newUserId}/addresses`, {
    street: '88 Cyber City',
    city: 'Gurugram',
    state: 'Haryana',
    zip_code: '122002',
    country: 'India'
  }, 201);

  await runTest('GET User Addresses', 'GET', `/api/users/${newUserId}/addresses`, null, 200, data => data.data.length >= 1);
  await runTest('DELETE User', 'DELETE', `/api/users/${newUserId}`, null, 200);
  await runTest('GET Deleted User (Expect 404)', 'GET', `/api/users/${newUserId}`, null, 404);

  // 2. Product Service
  console.log(`\n${colors.bold}[2] Product Service Tests (Port 3002)${colors.reset}`);
  await runTest('GET All Products', 'GET', '/api/products', null, 200, data => Array.isArray(data.data));
  await runTest('GET Single Product', 'GET', '/api/products/1', null, 200, data => data.data.id === 1);
  await runTest('GET Categories', 'GET', '/api/products/categories', null, 200, data => Array.isArray(data.data));

  const testSku = `SKU-TEST-${Date.now()}`;
  const createdProduct = await runTest('POST Create Product', 'POST', '/api/products', {
    category_id: 1,
    name: 'Smart Fitness Tracker',
    description: 'Heart rate, sleep tracking and AMOLED display',
    price: 3499.00,
    stock_quantity: 50,
    sku: testSku
  }, 201, data => data.data.sku === testSku);

  const newProdId = createdProduct ? createdProduct.data.id : 2;

  await runTest('PUT Update Product Price', 'PUT', `/api/products/${newProdId}`, {
    price: 3299.00,
    stock_quantity: 45
  }, 200, data => data.data.price === 3299.00);

  await runTest('DELETE Product', 'DELETE', `/api/products/${newProdId}`, null, 200);
  await runTest('GET Deleted Product (Expect 404)', 'GET', `/api/products/${newProdId}`, null, 404);

  // 3. Order Service
  console.log(`\n${colors.bold}[3] Order Service Tests (Port 3003)${colors.reset}`);
  await runTest('GET All Orders', 'GET', '/api/orders', null, 200, data => Array.isArray(data.data));

  const createdOrder = await runTest('POST Create Order (Inter-service Stock Check)', 'POST', '/api/orders', {
    user_id: 1,
    shipping_address: '42 MG Road, Bengaluru, Karnataka, 560001',
    items: [
      { product_id: 1, quantity: 1 }
    ]
  }, 201, data => data.data.status === 'PENDING');

  const newOrderId = createdOrder ? createdOrder.data.id : 1;

  await runTest('GET Single Order Details', 'GET', `/api/orders/${newOrderId}`, null, 200, data => data.data.id === newOrderId);
  await runTest('PUT Update Order Status to SHIPPED', 'PUT', `/api/orders/${newOrderId}/status`, {
    status: 'SHIPPED'
  }, 200, data => data.data.status === 'SHIPPED');

  // 4. Payment Service
  console.log(`\n${colors.bold}[4] Payment Service Tests (Port 3004)${colors.reset}`);
  await runTest('GET All Payments', 'GET', '/api/payments', null, 200, data => Array.isArray(data.data));

  const createdPayment = await runTest('POST Process Payment (Confirms Order)', 'POST', '/api/payments', {
    order_id: newOrderId,
    user_id: 1,
    amount: 119999.00,
    currency: 'INR',
    payment_method: 'UPI'
  }, 201, data => data.data.status === 'COMPLETED');

  const newPaymentId = createdPayment ? createdPayment.data.id : 1;
  await runTest('GET Single Payment', 'GET', `/api/payments/${newPaymentId}`, null, 200);
  await runTest('PUT Update Payment Status', 'PUT', `/api/payments/${newPaymentId}`, {
    status: 'COMPLETED'
  }, 200);
  await runTest('DELETE Refund Payment', 'DELETE', `/api/payments/${newPaymentId}`, null, 200, data => data.data.status === 'REFUNDED');

  // 5. Notification Service
  console.log(`\n${colors.bold}[5] Notification Service Tests (Port 3005)${colors.reset}`);
  await runTest('GET All Notifications', 'GET', '/api/notifications', null, 200, data => Array.isArray(data.data));

  const createdNotif = await runTest('POST Dispatch Notification', 'POST', '/api/notifications', {
    user_id: 1,
    channel: 'EMAIL',
    subject: 'Summer Festival Sale',
    message: 'Exclusive 20% discount on all electronics for premium members.'
  }, 201);

  const newNotifId = createdNotif ? createdNotif.data.id : 1;
  await runTest('GET Single Notification', 'GET', `/api/notifications/${newNotifId}`, null, 200);
  await runTest('PUT Mark Notification Read', 'PUT', `/api/notifications/${newNotifId}/read`, null, 200, data => data.data.status === 'READ');
  await runTest('DELETE Delete Notification', 'DELETE', `/api/notifications/${newNotifId}`, null, 200);

  // Summary
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}TEST RESULTS SUMMARY:${colors.reset}`);
  console.log(`  Total Tests Run: ${passed + failed}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${failed > 0 ? colors.red : colors.green}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}ALL MICROSERVICES TESTS PASSED SUCCESSFULLY! 🎉${colors.reset}\n`);
    process.exit(0);
  }
}

run();
