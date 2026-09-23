@echo off
title Fashion Microservices - Local Runner
color 0B
cls
echo ========================================================
echo   FASHION STORE: Scalable Backend Microservices (SBSMA)
echo ========================================================
echo.
echo Starting all 5 microservices + API Gateway...
echo.
echo   [API Gateway]          http://localhost:3000
echo   [Admin Portal]         http://localhost:3000/admin
echo   [Swagger API Docs]     http://localhost:3000/api-docs
echo   [User Service]         http://localhost:3001
echo   [Product Service]      http://localhost:3002
echo   [Order Service]        http://localhost:3003
echo   [Payment Service]      http://localhost:3004
echo   [Notification Service] http://localhost:3005
echo.
echo Press Ctrl + C to stop the services at any time.
echo ========================================================
echo.

cd /d "%~dp0\.."
node start-all.js
pause
