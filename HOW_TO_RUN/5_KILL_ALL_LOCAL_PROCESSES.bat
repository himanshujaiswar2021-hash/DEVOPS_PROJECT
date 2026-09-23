@echo off
title Fashion Microservices - Reset / Clean Ports
color 0C
cls
echo ========================================================
echo   Cleaning and Freeing Local Ports (3000 to 3005)
echo ========================================================
echo.
echo Terminating any lingering Node processes...

taskkill /F /IM node.exe /T 2>nul

echo.
echo Done! All Node processes terminated. Ports are free.
echo You can now run "1_RUN_LOCALLY_NODE.bat" cleanly.
echo.
pause
