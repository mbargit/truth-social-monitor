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

# Stop any existing service
if systemctl is-active --quiet tlsmonitor.service; then
  echo "Stopping existing service..."
  systemctl stop tlsmonitor.service
fi

# Kill any existing python script instances
pkill -f "python3 .*tlsexpert\.py" || true

# Copy service file to systemd directory
echo "Installing service file..."
cp "$SERVICE_FILE" "$SYSTEMD_DIR/tlsmonitor.service"
chmod 644 "$SYSTEMD_DIR/tlsmonitor.service"

# Reload systemd to recognize the new service
echo "Reloading systemd..."
systemctl daemon-reload

# Enable the service to start on boot
echo "Enabling service..."
systemctl enable tlsmonitor.service

# Start the service
echo "Starting service..."
systemctl start tlsmonitor.service

echo "Service status:"
systemctl status tlsmonitor.service --no-pager

echo ""
echo "=== TRUTH SOCIAL MONITOR IS NOW RUNNING ==="
echo "The script is now running as a system service and will restart"
echo "automatically if it crashes or if the system reboots."
echo ""
echo "To check status: systemctl status tlsmonitor.service"
echo "To check logs: journalctl -u tlsmonitor.service -f"
echo "To stop the service: systemctl stop tlsmonitor.service"
echo "To disable the service: systemctl disable tlsmonitor.service"
echo "=====================================" 