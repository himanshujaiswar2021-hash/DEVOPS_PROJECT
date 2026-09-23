# Part C: Microservices Development Guide

This document details the development of the 5 independent microservices and the API Gateway, showing port assignments, project structure, CRUD implementation details, and inter-service communication mechanisms.

---

## 1. Directory Structure

```
c:\microservic project\
├── package.json               # Root dependencies & orchestration scripts
├── start-all.js               # Concurrent microservices launcher
│
├── services/
│   ├── shared/
│   │   └── responseHandler.js # Standardized JSON format & HTTP error mapping
│   │
│   ├── user-service/          # Microservice 1 (Port 3001)
│   │   ├── db.js              # SQLite DB schema & queries
│   │   ├── server.js          # Express app & CRUD routes
│   │   └── data/users.db      # Isolated SQLite database
│   │
│   ├── product-service/       # Microservice 2 (Port 3002)
│   │   ├── db.js              # SQLite DB schema & queries
│   │   ├── server.js          # Express app & CRUD routes
│   │   └── data/products.db   # Isolated SQLite database
│   │
│   ├── order-service/         # Microservice 3 (Port 3003)
│   │   ├── db.js              # SQLite DB schema & queries
│   │   ├── server.js          # Express app & CRUD routes
│   │   └── data/orders.db     # Isolated SQLite database
│   │
│   ├── payment-service/       # Microservice 4 (Port 3004)
│   │   ├── db.js              # SQLite DB schema & queries
│   │   ├── server.js          # Express app & CRUD routes
│   │   └── data/payments.db   # Isolated SQLite database
│   │
│   ├── notification-service/  # Microservice 5 (Port 3005)
│   │   ├── db.js              # SQLite DB schema & queries
│   │   ├── server.js          # Express app & CRUD routes
│   │   └── data/notifications.db # Isolated SQLite database
│   │
│   └── api-gateway/           # API Gateway (Port 3000)
│       ├── server.js          # Reverse proxy router & health check
│       ├── swagger.json       # OpenAPI 3.0 specification
│       └── public/
│           └── index.html     # Live Web UI Dashboard & test console
│
├── postman/
│   ├── E-Commerce_Microservices.postman_collection.json
│   └── E-Commerce_Microservices.postman_environment.json
│
├── tests/
│   └── run-all-tests.js       # Automated integration test runner
│
└── docs/                      # Comprehensive assignment documentation
```

---

## 2. Port & Technology Allocation

| Service | Port | Database File | Technology | Responsibilities |
|---|---|---|---|---|
| **API Gateway** | `3000` | None | Express, `http-proxy-middleware`, `swagger-ui-express` | Reverse proxy, central Swagger UI, health check aggregator, web dashboard |
| **User Service** | `3001` | `data/users.db` | Node.js, Express, `node:sqlite` | Complete CRUD for user accounts and delivery addresses |
| **Product Service** | `3002` | `data/products.db` | Node.js, Express, `node:sqlite` | Complete CRUD for products, categories, and inventory stock reservation |
| **Order Service** | `3003` | `data/orders.db` | Node.js, Express, `node:sqlite` | Complete CRUD for orders and order line items; calls Product and Notification services |
| **Payment Service** | `3004` | `data/payments.db` | Node.js, Express, `node:sqlite` | Complete CRUD for payments; calls Order service on confirmation |
| **Notification Service** | `3005` | `data/notifications.db` | Node.js, Express, `node:sqlite` | Complete CRUD for event logs and alerts (Email, SMS) |

---

## 3. CRUD Operations Matrix per Microservice

All microservices implement full **CRUD (Create, Read, Update, Delete)** operations:

| Service | CREATE (`POST`) | READ (`GET`) | UPDATE (`PUT`) | DELETE (`DELETE`) |
|---|---|---|---|---|
| **User Service** | `POST /api/users`<br>`POST /api/users/:id/addresses` | `GET /api/users`<br>`GET /api/users/:id`<br>`GET /api/users/:id/addresses` | `PUT /api/users/:id` | `DELETE /api/users/:id` |
| **Product Service** | `POST /api/products`<br>`POST /api/products/categories` | `GET /api/products`<br>`GET /api/products/:id`<br>`GET /api/products/categories` | `PUT /api/products/:id`<br>`POST /api/products/:id/reserve-stock`<br>`POST /api/products/:id/restore-stock` | `DELETE /api/products/:id` |
| **Order Service** | `POST /api/orders` | `GET /api/orders`<br>`GET /api/orders/:id`<br>`GET /api/orders/user/:userId` | `PUT /api/orders/:id/status` | `DELETE /api/orders/:id` (cancels & restores stock) |
| **Payment Service** | `POST /api/payments` | `GET /api/payments`<br>`GET /api/payments/:id`<br>`GET /api/payments/order/:orderId` | `PUT /api/payments/:id` | `DELETE /api/payments/:id` (refunds) |
| **Notification Service** | `POST /api/notifications` | `GET /api/notifications`<br>`GET /api/notifications/:id`<br>`GET /api/notifications/user/:userId` | `PUT /api/notifications/:id/read` | `DELETE /api/notifications/:id` |

---

## 4. Inter-Service Communication Details

In microservices, business transactions often span across multiple services:

1. **Order Service → Product Service**:
   - During `POST /api/orders`, the Order Service calls `POST /api/products/:id/reserve-stock` via HTTP.
   - If stock is insufficient, the transaction fails and returns `400 Bad Request`.
   - When an order is cancelled via `DELETE /api/orders/:id`, the Order Service calls `POST /api/products/:id/restore-stock` to replenish inventory.

2. **Order Service → Notification Service**:
   - When an order is created, the Order Service fires an async HTTP `POST` to `/api/notifications` to dispatch an order confirmation email.

3. **Payment Service → Order Service**:
   - When a payment is processed via `POST /api/payments`, the Payment Service executes an HTTP `PUT` to `http://localhost:3003/api/orders/:id/status` with `status: "CONFIRMED"`.

4. **Payment Service → Notification Service**:
   - On payment receipt, a transactional SMS notification is sent through the Notification Service.

---

## 5. Running the Application

### Single Command Launch:
```bash
npm start
```
This runs `node start-all.js` which spins up all 5 microservices and the API Gateway concurrently with color-coded console logs.

### Access Points:
- **Web Dashboard**: [http://localhost:3000/](http://localhost:3000/)
- **Unified Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)
