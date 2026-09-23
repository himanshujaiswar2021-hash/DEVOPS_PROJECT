# Part A: System Design

## 1. Overall Microservice Architecture Diagram

The backend system is designed around a decoupled, event-aware **Microservices Architecture**. An **API Gateway** acts as the single entry point for clients, routing HTTP requests to five isolated backend services. Each service encapsulates its own business domain logic and maintains its own private database.

```mermaid
flowchart TD
    Client["Client Applications / Postman / Swagger UI"] -->|HTTP REST| Gateway["API Gateway (Port 3000)\nReverse Proxy, Swagger UI & Health Aggregator"]

    subgraph Microservices ["Decoupled Microservices Ecosystem"]
        Gateway -->|/api/users| UserService["User Service (Port 3001)\nAuth, Profiles & Addresses"]
        Gateway -->|/api/products| ProductService["Product Service (Port 3002)\nCatalog & Stock Inventory"]
        Gateway -->|/api/orders| OrderService["Order Service (Port 3003)\nOrder Lifecycle & Items"]
        Gateway -->|/api/payments| PaymentService["Payment Service (Port 3004)\nTransactions & Billing"]
        Gateway -->|/api/notifications| NotificationService["Notification Service (Port 3005)\nEmail & SMS Alerts"]
    end

    subgraph Databases ["Database-per-Service (Isolated Storage)"]
        UserService --> DB1[("users.db (SQLite)")]
        ProductService --> DB2[("products.db (SQLite)")]
        OrderService --> DB3[("orders.db (SQLite)")]
        PaymentService --> DB4[("payments.db (SQLite)")]
        NotificationService --> DB5[("notifications.db (SQLite)")]
    end

    %% Inter-service communication
    OrderService -.->|Verify & Reserve Stock| ProductService
    OrderService -.->|Trigger Order Alert| NotificationService
    PaymentService -.->|Update Status to CONFIRMED| OrderService
    PaymentService -.->|Trigger Payment Receipt| NotificationService
```

---

## 2. Identification of 5 Independent Microservices

| # | Microservice Name | Runtime Port | Primary Domain Responsibility | Private Database |
|---|---|---|---|---|
| 1 | **User Service** | `3001` | User registration, customer profiles, authentication, delivery address book | `data/users.db` |
| 2 | **Product Service** | `3002` | Product catalog, categories, SKU pricing, real-time stock reservation | `data/products.db` |
| 3 | **Order Service** | `3003` | Shopping cart conversion, order placement, status lifecycle, line items | `data/orders.db` |
| 4 | **Payment Service** | `3004` | Payment processing, multiple payment modes (UPI, Cards), transaction logs, refunds | `data/payments.db` |
| 5 | **Notification Service** | `3005` | Async communication alerts via Email, SMS, in-app notifications | `data/notifications.db` |

---

## 3. Detailed Responsibilities of Each Microservice

### 1. User Service
- Manages customer lifecycle: registration, profile modifications, deletion.
- Supports multi-address management (billing and shipping addresses) per user.
- Enforces unique email constraints and data validation.
- Exposes user lookup APIs to downstream order and billing services.

### 2. Product Service
- Maintains product catalog with names, descriptions, categories, prices, and SKUs.
- Manages category classifications.
- Provides atomic inventory reservation (`/reserve-stock`) when orders are initiated.
- Provides inventory restoration (`/restore-stock`) if orders are cancelled or aborted.

### 3. Order Service
- Orchestrates order placement by coordinating with the Product Service to verify pricing and lock inventory.
- Generates unique order numbers (`ORD-YYYY-XXXX`).
- Tracks order states: `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` (or `CANCELLED`).
- Automatically triggers dispatch of notifications to customers upon placement and status changes.

### 4. Payment Service
- Simulates real-world payment gateway transactions across various payment methods (`UPI`, `CREDIT_CARD`, `DEBIT_CARD`, `NET_BANKING`).
- Generates unique transaction IDs (`TXN-YYYY-XXXX`).
- On successful payment, automatically notifies the Order Service to transition the order state to `CONFIRMED`.
- Supports refund handling and cancellation tracking.

### 5. Notification Service
- Serves as the centralized event notification logger.
- Dispatches transactional emails, SMS, and in-app alerts for system events (e.g. order placed, payment successful, shipment dispatched).
- Manages notification read/unread status.

---

## 4. End-to-End API Flow Diagram

The sequence diagram below details how the microservices communicate during a complete customer purchase journey:

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer / Client
    participant GW as API Gateway (3000)
    participant PS as Product Service (3002)
    participant OS as Order Service (3003)
    participant PayS as Payment Service (3004)
    participant NS as Notification Service (3005)

    User->>GW: GET /api/products
    GW->>PS: Proxy GET /api/products
    PS-->>GW: Return Available Products & Stock
    GW-->>User: 200 OK (Product List)

    User->>GW: POST /api/orders (Create Order)
    GW->>OS: Proxy POST /api/orders
    Note over OS,PS: Step 1: Inter-Service Stock Check
    OS->>PS: POST /api/products/:id/reserve-stock
    PS-->>OS: 200 OK (Stock Reserved)
    OS->>OS: Save Order (Status: PENDING)
    OS-)NS: POST /api/notifications (Async Order Placed Alert)
    OS-->>GW: 201 Created (Order ID, Total Amount)
    GW-->>User: 201 Created

    User->>GW: POST /api/payments (Process Payment)
    GW->>PayS: Proxy POST /api/payments
    PayS->>PayS: Process Transaction & Generate TXN ID
    Note over PayS,OS: Step 2: Inter-Service Order Confirmation
    PayS->>OS: PUT /api/orders/:id/status (status: CONFIRMED)
    OS-->>PayS: 200 OK (Order Updated)
    PayS-)NS: POST /api/notifications (Async Payment Receipt)
    PayS-->>GW: 201 Created (Payment Confirmation)
    GW-->>User: 201 Created (Receipt & Confirmed Order)
```
