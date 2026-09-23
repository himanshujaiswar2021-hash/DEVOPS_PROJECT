@echo off
title SBSMA - E-Commerce Microservices Platform
color 0B
echo ========================================================
echo   SBSMA: Scalable Backend System using Microservices
echo ========================================================
echo.
echo Starting all microservices and API Gateway...
echo.
cd /d "c:\microservic project"
node start-all.js
pause
