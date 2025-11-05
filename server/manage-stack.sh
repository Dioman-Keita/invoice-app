#!/bin/bash

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

set -e

# ==============================
# 🧩 Docker installation check
# ==============================

timestamp() { date +"[%H:%M:%S]"; }

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ $(timestamp) Docker is not installed or not in PATH."
  echo "💡 Install it from: https://docs.docker.com/get-docker/"
  exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
  echo "❌ $(timestamp) Docker Compose not available."
  echo "💡 Install or update Docker Engine to include Compose."
  exit 1
fi

echo "✅ $(timestamp) Docker and Docker Compose detected."
echo

# ============================================
# 🚀 CMDT Stack Management (Docker Compose)
# ============================================

OS_NAME="$(uname)"
case "$OS_NAME" in
  Darwin) CURRENT_OS="macOS" ;;
  Linux) CURRENT_OS="Linux" ;;
  *) CURRENT_OS="Unknown" ;;
esac

echo "============================================"
echo "🚀 CMDT Stack Management (Docker Compose)"
echo "============================================"
echo "Detected OS: $CURRENT_OS"
echo

echo "1. 🔁 Restart without removal (just restart)"
echo "2. 🔄 Restart with container removal (docker compose down)"
echo "3. 💣 Safe reset (containers + CMDT volume only)"
echo "4. 🔥 Extreme clean (purge all unused Docker data)"
echo

read -p "Choose an option (1, 2, 3 or 4): " choice
echo

case "$choice" in
  1)
    echo "$(timestamp) 🔁 Restarting without removal..."
    docker compose restart
    echo "$(timestamp) ✅ Stack restarted with no data loss."
    ;;
  2)
    echo "$(timestamp) 🔄 Removing containers..."
    docker compose down
    docker compose up -d
    echo "$(timestamp) ✅ Stack relaunched. MySQL data preserved."
    ;;
  3)
    echo "$(timestamp) 💣 Safe reset (containers + CMDT volume only)..."
    docker compose down --remove-orphans
    docker volume rm final-mysql-data 2>/dev/null || true
    docker compose up -d
    echo "$(timestamp) ✅ Stack reset. CMDT data removed, images preserved."
    ;;
  4)
    echo "$(timestamp) 🔥 Extreme clean (purge all unused Docker data)..."
    docker system prune -af --volumes
    echo "$(timestamp) ✅ Docker environment completely cleaned."
    ;;
  *)
    echo "❌ Invalid option. Please restart and choose 1–4."
    ;;
esac
