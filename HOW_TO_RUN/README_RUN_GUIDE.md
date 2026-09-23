# 🚀 How to Run the Fashion Microservices Project

Welcome! This folder contains everything you need to run, test, and manage the **Fashion Microservices Platform (SBSMA)**.

You have **two easy ways** to run this project:
1. **Method 1 (Easiest)**: Double-click the ready-to-use `.bat` files in this folder.
2. **Method 2 (Command Line)**: Run standard commands in Windows Command Prompt (`cmd`).

---

## 🖱️ Method 1: The One-Click Double-Click Method (Easiest)

Inside this `HOW_TO_RUN` folder, simply double-click any of the following files:

| File to Double-Click | What It Does |
| :--- | :--- |
| **`1_RUN_LOCALLY_NODE.bat`** | Starts all 5 microservices + API Gateway locally using Node.js. |
| **`2_RUN_WITH_DOCKER.bat`** | Builds and starts all 6 microservice containers using Docker Compose. |
| **`3_RUN_ALL_TESTS.bat`** | Executes all 30 automated integration tests and prints the passing report. |
| **`4_STOP_DOCKER.bat`** | Stops and removes all running Docker containers. |
| **`5_KILL_ALL_LOCAL_PROCESSES.bat`** | Closes any background Node processes if a port is stuck or already in use. |

---

## 💻 Method 2: Running from Command Prompt (`cmd`)

### Option A: Run Locally with Node.js

1. Open **Command Prompt (`cmd`)**.
2. Navigate to the project root directory:
   ```cmd
   cd /d "c:\microservic project"
   ```
3. Start all services together:
   ```cmd
   npm start
   ```
   *(or `node start-all.js`)*
4. To stop services: Press `Ctrl + C` in the CMD window.

---

### Option B: Run with Docker Compose

1. Open **Command Prompt (`cmd`)**.
2. Navigate to the project directory:
   ```cmd
   cd /d "c:\microservic project"
   ```
3. Build and launch all 6 containers:
   ```cmd
   docker compose up --build -d
   ```
4. Check running containers:
   ```cmd
   docker compose ps
   ```
5. View live logs:
   ```cmd
   docker compose logs -f
   ```
6. To stop containers:
   ```cmd
   docker compose down
   ```

---

## 🌐 URLs to Open in Your Browser

Once the services are running, open your web browser (Chrome, Edge, etc.) and visit:

| Page | URL | Description |
| :--- | :--- | :--- |
| 🛍️ **Fashion Customer Store** | [http://localhost:3000](http://localhost:3000) | Browse categories, live search, add products to cart, and checkout. Notice that **admin links are hidden**. |
| 👑 **Fashion Admin Portal** | [http://localhost:3000/admin](http://localhost:3000/admin) | Add new products, adjust prices, restock +50, manage orders, view users, payments, and notifications. Changes reflect immediately on the storefront! |
| 📖 **Swagger API Docs** | [http://localhost:3000/api-docs](http://localhost:3000/api-docs) | Interactive OpenAPI documentation to test all endpoints live. |
| ⚡ **System Health Status** | [http://localhost:3000/health](http://localhost:3000/health) | Real-time JSON health check aggregating all 5 microservices. |

---

## 🧪 How to Run Automated Tests

To verify that all CRUD operations and inter-service communications work:

- **If running locally**:
  Double-click `3_RUN_ALL_TESTS.bat` or run:
  ```cmd
  npm test
  ```
- **If running in Docker**:
  ```cmd
  docker compose exec api-gateway node tests/run-all-tests.js
  ```

You will see:
```text
====================================================
TEST RESULTS SUMMARY:
  Total Tests Run: 30
  Passed: 30
  Failed: 0
====================================================
ALL MICROSERVICES TESTS PASSED SUCCESSFULLY! 🎉
```

---

## ❓ Troubleshooting & FAQs

### Problem: "Port 3000 (or 3001-3005) is already in use"
**Solution**: Double-click **`5_KILL_ALL_LOCAL_PROCESSES.bat`** to terminate any background processes, then run `1_RUN_LOCALLY_NODE.bat` again.

### Problem: "Docker is not running"
**Solution**: Ensure **Docker Desktop** is opened and running before running `2_RUN_WITH_DOCKER.bat`. If you don't have Docker installed, simply use **`1_RUN_LOCALLY_NODE.bat`** (Node.js).
