#!/bin/bash

# ==============================================================================
# SMS Sender - Lightweight Production Deployment Script
# Architecture: Native Systemd (FastAPI) + Caddy (Reverse Proxy + SSL)
# ==============================================================================

set -e

# Configuration
APP_DIR="/opt/sms-sender"
REPO_URL="https://github.com/YOUR_GITHUB_USERNAME/sms-sender.git" # Replace with actual URL
SERVICE_NAME="sms-sender"
SERVICE_USER="www-data"

echo "========================================================"
echo " Starting SMS Sender Deployment"
echo "========================================================"

# 1. Require Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo bash deploy.sh)"
  exit 1
fi

# 2. System Updates & Dependencies
echo "[1/7] Installing System Dependencies..."
apt-get update
# Add Caddy repository
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update

apt-get install -y git python3 python3-venv python3-pip nodejs npm caddy ufw

# 3. Create 1GB Swap File (Prevents Out-Of-Memory during Next.js build on 1GB VPS)
echo "[2/7] Checking Swap File Initialization..."
if [ ! -f /swapfile ]; then
    echo "Creating 1GB swapfile..."
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
else
    echo "Swapfile already exists."
fi

# 4. Clone / Update Repository
echo "[3/7] Setting up Application Directory ($APP_DIR)..."
if [ ! -d "$APP_DIR" ]; then
    git clone $REPO_URL $APP_DIR
else
    cd $APP_DIR
    git pull
fi

cd $APP_DIR
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# 5. Environment Variables Setup
echo "[4/7] Configuring Environment Variables..."
if [ ! -f "$APP_DIR/.env" ]; then
    if [ -f "$APP_DIR/.env.example" ]; then
        cp $APP_DIR/.env.example $APP_DIR/.env
        chown $SERVICE_USER:$SERVICE_USER $APP_DIR/.env
        chmod 600 $APP_DIR/.env
        echo "================================================================"
        echo " WARNING: .env file created from .env.example."
        echo " Please edit $APP_DIR/.env with your production API keys,"
        echo " then run this script again."
        echo " Command: nano $APP_DIR/.env"
        echo "================================================================"
        exit 0
    else
        echo "Error: No .env or .env.example found. Systemd cannot start without environment variables."
        exit 1
    fi
fi

# 6. Backend Setup (Python Virtual Environment)
echo "[5/7] Setting up Python Backend..."
# Run as the service user to prevent root permission issues in the venv
sudo -u $SERVICE_USER bash -c "python3 -m venv .venv"
sudo -u $SERVICE_USER bash -c ".venv/bin/pip install -r requirements.txt"

# 7. Frontend Setup (Next.js Static Export)
echo "[6/7] Building Next.js Frontend..."
# Install pnpm globally using npm
npm install -g pnpm
cd frontend
sudo -u $SERVICE_USER bash -c "pnpm install"
sudo -u $SERVICE_USER bash -c "pnpm build"
cd ..

# 8. Configure Systemd Daemon
echo "[7/7] Configuring Systemd and Caddy..."

cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=SMS Sender FastAPI Backend
After=network.target

[Service]
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
# Load secrets securely into memory
EnvironmentFile=$APP_DIR/.env
Environment="PATH=$APP_DIR/.venv/bin"
# Run Uvicorn on localhost port 8000
ExecStart=$APP_DIR/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload and Enable Service
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}

# 9. Configure Caddy Reverse Proxy
echo "Configuring Caddy..."
# Prompt for domain name (default to localhost if empty for testing)
read -p "Enter your domain name (e.g., app.yourdomain.com) or IP Address: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

cat > /etc/caddy/Caddyfile << EOF
$DOMAIN {
    # Route all traffic to the native Python FastAPI server instance
    reverse_proxy 127.0.0.1:8000
}
EOF

systemctl enable caddy
systemctl restart caddy

# 10. Firewall Config (Optional but recommended)
echo "Configuring UFW Firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
# Don't prompt for confirmation
ufw --force enable

echo "========================================================"
echo " Deployment Complete! "
echo " Systemd Status: systemctl status $SERVICE_NAME"
echo " Logs: journalctl -u $SERVICE_NAME -f"
echo " Caddy Status: systemctl status caddy"
echo " Application should be live at: https://$DOMAIN"
echo "========================================================"
