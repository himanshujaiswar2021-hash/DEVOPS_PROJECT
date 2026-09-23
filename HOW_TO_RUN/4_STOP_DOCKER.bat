@echo off
title Fashion Microservices - Stop Docker
color 0C
cls
echo ========================================================
echo   Stopping and Removing Docker Containers
echo ========================================================
echo.

cd /d "%~dp0\.."
docker compose down

echo.
echo ========================================================
echo All Docker containers and networks stopped!
echo ========================================================
echo.
pause
