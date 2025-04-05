#!/bin/bash

# Exit on error
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/tlsmonitor.service"
SYSTEMD_DIR="/etc/systemd/system"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

echo "Installing Truth Social Monitor service..."

# Copy service file to systemd directory
cp "$SERVICE_FILE" "$SYSTEMD_DIR/tlsmonitor.service"
chmod 644 "$SYSTEMD_DIR/tlsmonitor.service"

# Reload systemd to recognize the new service
systemctl daemon-reload

# Enable the service to start on boot
systemctl enable tlsmonitor.service

# Start the service
systemctl start tlsmonitor.service

echo "Service installed and started successfully!"
echo "You can check the status with: systemctl status tlsmonitor.service"
echo "View logs with: journalctl -u tlsmonitor.service -f" 