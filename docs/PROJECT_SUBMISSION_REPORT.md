# Scalable Backend System using Microservices (SBSMA)
**Project Submission Report (SBSMA)**

---

## Executive Summary

This project implements a complete, decoupled, scalable backend architecture for a real-world **E-Commerce Platform** using **Microservices Architecture**. The system fulfills all requirements specified across Parts A, B, C, D, and E:

- **Part A: System Design**: Comprehensive microservice architecture diagram, domain boundaries for 5 independent services, responsibility matrix, and inter-service API flow diagrams.
- **Part B: Database Design**: Dedicated, isolated database-per-service pattern (SQLite3) for each service with complete table attributes, primary keys, and foreign keys.
- **Part C: Development**: 5 independent microservices running on isolated ports (`3001` to `3005`) and an API Gateway (`3000`) supporting complete CRUD operations (`GET`, `POST`, `PUT`, `DELETE`).
- **Part D: API Documentation**: Unified Swagger UI documentation (`http://localhost:3000/api-docs`), standardized JSON request/response envelope, and HTTP error code taxonomy.
- **Part E: Testing**: Postman Collection (v2.1) & Environment configuration plus an automated integration test suite validating all CRUD operations and inter-service workflows.

---

## Part A: System Design

### 1. Overall Microservices Architecture
The system consists of 5 domain services fronted by a reverse-proxy API Gateway:

```
                  ┌────────────────────────────────────────┐
                  │    Client / Postman / Swagger UI       │
                  └───────────────────┬────────────────────┘
                                      │ HTTP REST
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       API Gateway (Port 3000)          │
                  │  - Reverse Proxy Routing               │
                  │  - Unified Swagger UI (/api-docs)      │
                  │  - Health Aggregator (/health)         │
                  │  - Live Interactive UI Dashboard (/)   │
                  └───────────────────┬────────────────────┘
                                      │
         ┌───────────────┬────────────┼────────────┬───────────────┐
         │ :3001         │ :3002      │ :3003      │ :3004         │ :3005
         ▼               ▼            ▼            ▼               ▼
┌─────────────────┐ ┌──────────────┐ ┌───────────┐ ┌─────────────┐ ┌────────────────────┐
│  User Service   │ │Product Serv. │ │Order Serv.│ │Payment Serv.│ │Notification Serv.  │
│  - User Auth    │ │- Catalog     │ │- Orders   │ │- Transact.  │ │- Email / SMS       │
│  - Profiles     │ │- Stock Resrv.│ │- Checkout │ │- Refunds    │ │- Delivery alerts   │
└────────┬────────┘ └──────┬───────┘ └─────┬─────┘ └──────┬──────┘ └─────────┬──────────┘
         │                 │               │              │                  │
         ▼                 ▼               ▼              ▼                  ▼
    [users.db]       [products.db]    [orders.db]   [payments.db]    [notifications.db]
```

### 2. Microservice Responsibilities
1. **User Service (Port 3001)**: Manages customer records, authentication credentials, and address books.
2. **Product Service (Port 3002)**: Manages catalog products, categories, SKU inventory, and atomic stock reservation/restoration.
3. **Order Service (Port 3003)**: Manages customer purchase orders, order line items, order status lifecycle, and stock checks with Product Service.
4. **Payment Service (Port 3004)**: Simulates payment processing via various channels (UPI, Cards), generates transaction IDs, updates order state to `CONFIRMED`, and handles refunds.
5. **Notification Service (Port 3005)**: Asynchronously records and sends transactional emails and SMS for order and payment milestones.

---

## Part B: Database Design (Database-per-Service)

Each service has its own private SQLite database file:

1. **`users.db`**:
   - `users`: `id` (PK), `name`, `email` (UNIQUE), `password`, `role`, `phone`, `created_at`
   - `addresses`: `id` (PK), `user_id` (FK -> users.id), `street`, `city`, `state`, `zip_code`, `country`
2. **`products.db`**:
   - `categories`: `id` (PK), `name` (UNIQUE), `description`
   - `products`: `id` (PK), `category_id` (FK -> categories.id), `name`, `description`, `price`, `stock_quantity`, `sku` (UNIQUE), `created_at`
3. **`orders.db`**:
   - `orders`: `id` (PK), `order_number` (UNIQUE), `user_id`, `total_amount`, `status`, `shipping_address`, `created_at`
   - `order_items`: `id` (PK), `order_id` (FK -> orders.id), `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`
4. **`payments.db`**:
   - `payments`: `id` (PK), `transaction_id` (UNIQUE), `order_id`, `user_id`, `amount`, `currency`, `payment_method`, `status`, `created_at`
5. **`notifications.db`**:
   - `notifications`: `id` (PK), `user_id`, `channel`, `subject`, `message`, `status`, `created_at`

---

## Part C: Development

- **Framework**: Node.js & Express.js
- **Database Engine**: SQLite (`node:sqlite` standard library)
- **Architecture**: REST API over HTTP with JSON payloads
- **Reverse Proxy**: `http-proxy-middleware` routing all `/api/*` routes through Port 3000
- **Unified Orchestration**: Single command `npm start` executes `node start-all.js` to run all 6 processes concurrently.

---

## Part D: API Documentation & Format

### Unified Request/Response Standard
```json
// Success Response (HTTP 200/201)
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-09-20T13:15:00.000Z"
}

// Error Response (HTTP 400/404/409/500)
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Item not found with id 99",
  "details": null,
  "timestamp": "2026-09-20T13:15:00.000Z"
}
```

### Swagger UI
Interactive OpenAPI 3.0 specification served directly at `http://localhost:3000/api-docs`.

---

## Part E: Testing

### Automated Test Suite
Run `npm test` to execute sequential integration tests covering:
- Health check across all services
- `POST`, `GET`, `PUT`, `DELETE` on User Service
- `POST`, `GET`, `PUT`, `DELETE` on Product Service (including inventory check)
- `POST`, `GET`, `PUT`, `DELETE` on Order Service (including multi-service rollback)
- `POST`, `GET`, `PUT`, `DELETE` on Payment Service (including auto-confirmation of order)
- `POST`, `GET`, `PUT`, `DELETE` on Notification Service

### Postman Files
- `postman/E-Commerce_Microservices.postman_collection.json`
- `postman/E-Commerce_Microservices.postman_environment.json`
