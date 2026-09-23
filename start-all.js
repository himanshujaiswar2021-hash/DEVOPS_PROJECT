const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'User Service', script: 'services/user-service/server.js', port: 3001, color: '\x1b[34m' },
  { name: 'Product Service', script: 'services/product-service/server.js', port: 3002, color: '\x1b[32m' },
  { name: 'Order Service', script: 'services/order-service/server.js', port: 3003, color: '\x1b[35m' },
  { name: 'Payment Service', script: 'services/payment-service/server.js', port: 3004, color: '\x1b[33m' },
  { name: 'Notification Service', script: 'services/notification-service/server.js', port: 3005, color: '\x1b[36m' },
  { name: 'API Gateway', script: 'services/api-gateway/server.js', port: 3000, color: '\x1b[37m' }
];

const processes = [];
const resetColor = '\x1b[0m';

console.log('====================================================');
console.log('  STARTING ALL E-COMMERCE MICROSERVICES & GATEWAY   ');
console.log('====================================================\n');

services.forEach(service => {
  const fullPath = path.join(__dirname, service.script);
  const proc = spawn('node', [fullPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  });

  proc.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`${service.color}[${service.name}]${resetColor} ${line}`);
    });
  });

  proc.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.error(`${service.color}[${service.name} ERR]${resetColor} ${line}`);
    });
  });

  proc.on('close', code => {
    console.log(`${service.color}[${service.name}]${resetColor} Exited with code ${code}`);
  });

  processes.push(proc);
});

// Clean shutdown handler
function shutdown() {
  console.log('\nGracefully shutting down all microservices...');
  processes.forEach(p => {
    try {
      p.kill();
    } catch (_) {}
  });
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
