@echo off
title Fashion Microservices - Automated Test Suite
color 0E
cls
echo ========================================================
echo   Running 30 Automated Integration Tests across Services
echo ========================================================
echo.

cd /d "%~dp0\.."
node tests/run-all-tests.js

echo.
echo ========================================================
echo Test execution complete!
echo ========================================================
echo.
pause
