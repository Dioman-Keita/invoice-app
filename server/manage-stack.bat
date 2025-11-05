@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title CMDT Stack Manager - Docker Tools

:: ==============================
:: 🧩 Docker installation check
:: ==============================

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not found in PATH.
    echo 💡 Install Docker Desktop: https://www.docker.com/get-started/
    pause
    exit /b
)

docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose not available.
    echo 💡 Update Docker Desktop to include integrated Compose.
    pause
    exit /b
)

echo ✅ Docker and Docker Compose detected.
echo.

:: ============================================
:: 🚀 CMDT Stack Management (Docker Compose)
:: ============================================

set "timestamp=[%time%]"
echo %timestamp% Detected OS: %OS%
echo ============================================
echo 🚀 CMDT Stack Management (Docker Compose)
echo ============================================
echo.

echo 1. 🔁 Restart without removal (just restart)
echo 2. 🔄 Restart with container removal (docker compose down)
echo 3. 💣 Safe reset (containers + CMDT volume only)
echo 4. 🔥 Extreme clean (purge all unused Docker data)
echo.

set /p choice="Choose an option (1, 2, 3 or 4): "
echo.

set "timestamp=[%time%]"

if "%choice%"=="1" (
    echo %timestamp% 🔁 Restarting without removal...
    docker compose restart
    if %errorlevel% neq 0 (
        echo ⚠️  Docker needs admin privileges or isn’t running. Try launching Docker Desktop.
    ) else (
        echo ✅ Stack restarted with no data loss.
    )
    goto end
)

if "%choice%"=="2" (
    echo %timestamp% 🔄 Removing containers...
    docker compose down
    docker compose up -d
    echo ✅ Stack relaunched. MySQL data preserved.
    goto end
)

if "%choice%"=="3" (
    echo %timestamp% 💣 Safe reset (containers + CMDT volume only)...
    docker compose down --remove-orphans
    docker volume rm final-mysql-data 2>nul
    docker compose up -d
    echo ✅ Stack reset. CMDT data removed, images preserved.
    goto end
)

if "%choice%"=="4" (
    echo %timestamp% 🔥 Extreme clean...
    docker system prune -af --volumes
    echo ✅ Docker environment completely cleaned.
    goto end
)

echo ❌ Invalid option. Please restart and choose 1–4.

:end
echo.
pause
