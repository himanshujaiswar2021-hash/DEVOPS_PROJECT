# Scalable Backend System using Microservices (SBSMA)

![CI Pipeline](https://github.com/your-username/microservices-project/actions/workflows/ci.yml/badge.svg)

An enterprise-grade, modular backend platform built with **Node.js**, **Express**, and **SQLite** following the **Microservices Architecture Pattern**.

This project implements all requirements of the **SBSMA (Scalable Backend System using Microservices Architecture)** project:
- **Part A**: System Design (Architecture Diagram, 5 Microservices, Responsibilities, API Flow Diagram)
- **Part B**: Database Design (Database-per-Service, Schemas, PK/FK definitions, ER Diagram)
- **Part C**: Development (5 Microservices on separate ports, complete CRUD operations)
- **Part D**: API Documentation (Unified Swagger UI, standardized responses, error codes)
- **Part E**: Testing (Automated Integration Test Suite & Postman Collection)

---

## 🚀 Quick Start Guide

### Option 1: Run with Docker Compose (Recommended for Production)

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.

```bash
# 1. Build and start all 6 microservices containers in detached mode
docker compose up --build -d

# 2. Check health of all running containers
docker compose ps

# 3. View live logs across all services
docker compose logs -f

# 4. Run automated test suite inside the cluster
docker compose exec api-gateway node tests/run-all-tests.js

# 5. Stop and tear down all containers and networks
docker compose down
```

### Option 2: Run with Single-Container Docker

```bash
# Build the all-in-one image
docker build -t microservices-app .

# Run the container mapping port 3000
docker run -p 3000:3000 --name microservices-app microservices-app
```

### Option 3: Run Locally with Node.js

Prerequisites: Node.js 22+ (for native `node:sqlite` support).

```bash
# 1. Install dependencies
npm install

# 2. Start all 5 microservices & API Gateway
npm start

# 3. Run automated integration test suite (in another terminal)
npm test
```

---

## 🌐 Application Endpoints

- **Fashion Customer Storefront**: [http://localhost:3000](http://localhost:3000)
- **Fashion Admin Management Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Interactive OpenAPI / Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **System Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 🛠️ Architecture Summary

| Service | Port | Database | Primary Responsibility |
|---|---|---|---|
| **API Gateway** | `3000` | None | Reverse Proxy routing, Swagger Docs, Fashion storefront & Admin portal |
| **User Service** | `3001` | `data/users.db` | Customer accounts, authentication, address book |
| **Product Service** | `3002` | `data/products.db` | Product catalog, categories, stock reservation & inventory |
| **Order Service** | `3003` | `data/orders.db` | Order lifecycle, order items, checkout orchestration |
| **Payment Service** | `3004` | `data/payments.db` | Payment processing, transaction records, refunds |
| **Notification Service** | `3005` | `data/notifications.db` | Email, SMS, in-app notification dispatch & tracking |

---

## 🤖 GitHub Actions CI/CD Pipeline

The repository includes an automated pipeline in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) that executes on every `push` and `pull_request`:

1. **`test-node`**: Boots services in Node 22, verifies `/health`, and runs the full 30-case integration test suite.
2. **`test-docker`**: Builds the Docker container, boots the multi-container stack via `docker compose`, verifies cluster health, runs tests against the live cluster, and performs teardown.

---

## 📚 Detailed Documentation Links

- [Part A: System Design](docs/Part_A_System_Design.md)
- [Part B: Database Design](docs/Part_B_Database_Design.md)
- [Part C: Development Guide](docs/Part_C_Development_Guide.md)
- [Part D: API Documentation](docs/Part_D_API_Documentation.md)
- [Part E: Testing Report](docs/Part_E_Testing_Report.md)
- [Consolidated Project Submission Report](docs/PROJECT_SUBMISSION_REPORT.md)
- [PDF Execution Steps Report](docs/Project_Execution_Steps_Report.pdf)
- [Postman Collection](postman/E-Commerce_Microservices.postman_collection.json)
- [Postman Environment](postman/E-Commerce_Microservices.postman_environment.json)
