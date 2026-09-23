# Part D: API Documentation

This document specifies the standard Request/Response envelope, error codes, and endpoint catalog for all 5 microservices as exposed through the API Gateway (`http://localhost:3000`).

---

## 1. Standard Request, Response Format & Error Codes

### Standard Success Response Format (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "timestamp": "2026-09-20T13:10:00.000Z"
}
```

### Standard Error Response Format (`400`, `404`, `409`, `500`)
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Resource with specified ID was not found",
  "details": null,
  "timestamp": "2026-09-20T13:10:00.000Z"
}
```

### Standard HTTP Status Codes Used
| HTTP Status Code | Meaning | Used When |
|---|---|---|
| **`200 OK`** | Request Succeeded | Read (`GET`), Update (`PUT`), Delete (`DELETE`) |
| **`201 Created`** | Resource Created | Successful Create (`POST`) |
| **`400 Bad Request`** | Client Validation Error | Missing required fields, invalid JSON, insufficient stock |
| **`404 Not Found`** | Resource Missing | Entity ID does not exist in database |
| **`409 Conflict`** | Resource Conflict | Duplicate email address or unique field |
| **`500 Internal Error`** | Server Error | Unhandled backend exception or SQL syntax issue |
| **`503 Unavailable`** | Service Down | API Gateway unable to route to downstream microservice |

---

## 2. Comprehensive Endpoints Catalog

### 1. User Service APIs (`/api/users`)

| Name | Method | URL | Request Body | Success Status | Response Body Sample |
|---|---|---|---|---|---|
| **List Users** | `GET` | `/api/users` | *None* | `200 OK` | `[ { "id": 1, "name": "Rahul Sharma", "email": "rahul@example.com" } ]` |
| **Get User by ID** | `GET` | `/api/users/:id` | *None* | `200 OK` | `{ "id": 1, "name": "Rahul", "addresses": [ ... ] }` |
| **Create User** | `POST` | `/api/users` | `{ "name": "Rohan", "email": "rohan@test.com", "password": "pass", "phone": "+91-9988..." }` | `201 Created` | `{ "id": 3, "name": "Rohan", "email": "rohan@test.com" }` |
| **Update User** | `PUT` | `/api/users/:id` | `{ "name": "Rohan M.", "phone": "+91-7788..." }` | `200 OK` | `{ "id": 3, "name": "Rohan M." }` |
| **Delete User** | `DELETE` | `/api/users/:id` | *None* | `200 OK` | `{ "id": 3, "message": "User deleted" }` |
| **Add Address** | `POST` | `/api/users/:id/addresses` | `{ "street": "100 MG Rd", "city": "Bengaluru", "state": "KA", "zip_code": "560001" }` | `201 Created` | `{ "id": 2, "user_id": 1, "city": "Bengaluru" }` |
| **Get Addresses** | `GET` | `/api/users/:id/addresses` | *None* | `200 OK` | `[ { "id": 1, "street": "42 MG Road", ... } ]` |

---

### 2. Product Service APIs (`/api/products`)

| Name | Method | URL | Request Body | Success Status | Response Body Sample |
|---|---|---|---|---|---|
| **List Products** | `GET` | `/api/products` | *Query params: ?search=...&category_id=...* | `200 OK` | `[ { "id": 1, "name": "Apple iPhone 15 Pro", "price": 119999 } ]` |
| **Get Product by ID** | `GET` | `/api/products/:id` | *None* | `200 OK` | `{ "id": 1, "name": "Apple iPhone 15 Pro", "stock_quantity": 25 }` |
| **Create Product** | `POST` | `/api/products` | `{ "category_id": 1, "name": "Logitech Mouse", "price": 8995, "stock_quantity": 40, "sku": "SKU-M1" }` | `201 Created` | `{ "id": 6, "name": "Logitech Mouse", "price": 8995 }` |
| **Update Product** | `PUT` | `/api/products/:id` | `{ "price": 8495, "stock_quantity": 50 }` | `200 OK` | `{ "id": 6, "price": 8495 }` |
| **Delete Product** | `DELETE` | `/api/products/:id` | *None* | `200 OK` | `{ "id": 6, "name": "Logitech Mouse" }` |
| **Reserve Stock** | `POST` | `/api/products/:id/reserve-stock` | `{ "quantity": 1 }` | `200 OK` | `{ "id": 1, "stock_quantity": 24 }` |
| **Restore Stock** | `POST` | `/api/products/:id/restore-stock` | `{ "quantity": 1 }` | `200 OK` | `{ "id": 1, "stock_quantity": 25 }` |
| **List Categories** | `GET` | `/api/products/categories` | *None* | `200 OK` | `[ { "id": 1, "name": "Electronics" } ]` |

---

### 3. Order Service APIs (`/api/orders`)

| Name | Method | URL | Request Body | Success Status | Response Body Sample |
|---|---|---|---|---|---|
| **List Orders** | `GET` | `/api/orders` | *None* | `200 OK` | `[ { "id": 1, "order_number": "ORD-2026-1001", "total_amount": 119999 } ]` |
| **Get Order by ID** | `GET` | `/api/orders/:id` | *None* | `200 OK` | `{ "id": 1, "status": "CONFIRMED", "items": [ ... ] }` |
| **Create Order** | `POST` | `/api/orders` | `{ "user_id": 1, "shipping_address": "42 MG Rd", "items": [{ "product_id": 1, "quantity": 1 }] }` | `201 Created` | `{ "id": 2, "order_number": "ORD-2026-1002", "status": "PENDING", "total_amount": 119999 }` |
| **Update Status** | `PUT` | `/api/orders/:id/status` | `{ "status": "SHIPPED" }` | `200 OK` | `{ "id": 2, "status": "SHIPPED" }` |
| **Cancel Order** | `DELETE` | `/api/orders/:id` | *None* | `200 OK` | `{ "id": 2, "status": "CANCELLED" }` |
| **User Orders** | `GET` | `/api/orders/user/:userId` | *None* | `200 OK` | `[ { "id": 1, "order_number": "ORD-2026-1001" } ]` |

---

### 4. Payment Service APIs (`/api/payments`)

| Name | Method | URL | Request Body | Success Status | Response Body Sample |
|---|---|---|---|---|---|
| **List Payments** | `GET` | `/api/payments` | *None* | `200 OK` | `[ { "id": 1, "transaction_id": "TXN-9901", "amount": 119999, "status": "COMPLETED" } ]` |
| **Get Payment by ID**| `GET` | `/api/payments/:id` | *None* | `200 OK` | `{ "id": 1, "transaction_id": "TXN-9901", "status": "COMPLETED" }` |
| **Process Payment** | `POST` | `/api/payments` | `{ "order_id": 1, "user_id": 1, "amount": 119999, "payment_method": "UPI" }` | `201 Created` | `{ "id": 2, "transaction_id": "TXN-2026-1002", "status": "COMPLETED" }` |
| **Update Payment** | `PUT` | `/api/payments/:id` | `{ "status": "COMPLETED" }` | `200 OK` | `{ "id": 2, "status": "COMPLETED" }` |
| **Refund Payment** | `DELETE` | `/api/payments/:id` | *None* | `200 OK` | `{ "id": 2, "status": "REFUNDED" }` |

---

### 5. Notification Service APIs (`/api/notifications`)

| Name | Method | URL | Request Body | Success Status | Response Body Sample |
|---|---|---|---|---|---|
| **List Notifications** | `GET` | `/api/notifications` | *None* | `200 OK` | `[ { "id": 1, "subject": "Welcome", "status": "DELIVERED" } ]` |
| **Get by ID** | `GET` | `/api/notifications/:id` | *None* | `200 OK` | `{ "id": 1, "message": "...", "status": "DELIVERED" }` |
| **Send Notification** | `POST` | `/api/notifications` | `{ "user_id": 1, "channel": "EMAIL", "subject": "Hello", "message": "Test alert" }` | `201 Created` | `{ "id": 3, "subject": "Hello", "status": "SENT" }` |
| **Mark as Read** | `PUT` | `/api/notifications/:id/read`| *None* | `200 OK` | `{ "id": 1, "status": "READ" }` |
| **Delete Notification** | `DELETE` | `/api/notifications/:id` | *None* | `200 OK` | `{ "id": 1, "message": "Deleted" }` |

---

## 3. Swagger UI & Postman Usage

- **Interactive Swagger Documentation**: Open `http://localhost:3000/api-docs` in your browser. All endpoints can be tested with the "Try it out" button.
- **Postman Collection**: Import `postman/E-Commerce_Microservices.postman_collection.json` and `postman/E-Commerce_Microservices.postman_environment.json` directly into Postman.
