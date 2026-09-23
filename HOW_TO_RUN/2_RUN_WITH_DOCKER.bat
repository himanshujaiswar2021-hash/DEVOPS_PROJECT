@echo off
title Fashion Microservices - Docker Runner
color 0A
cls
echo ========================================================
echo   FASHION STORE: Launching with Docker Compose
echo ========================================================
echo.
echo Building images and starting 6 microservice containers...
echo.

cd /d "%~dp0\.."
docker compose up --build -d

echo.
echo ========================================================
echo   Containers Status:
echo ========================================================
docker compose ps
echo.
echo Access URLs:
echo   - Customer Store:   http://localhost:3000
echo   - Admin Portal:     http://localhost:3000/admin
echo   - Swagger API Docs: http://localhost:3000/api-docs
echo   - Health Check:     http://localhost:3000/health
echo.
echo To view live logs: run "docker compose logs -f"
echo To stop containers: double-click "4_STOP_DOCKER.bat"
echo ========================================================
echo.
pause
