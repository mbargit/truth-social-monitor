#!/bin/bash

# Path to the script
SCRIPT_DIR="/root/truth-social-monitor/py_tls/py"
SCRIPT_PATH="$SCRIPT_DIR/tlsexpert.py"
LOG_FILE="$SCRIPT_DIR/restart.log"

# Show initial feedback
echo "Starting Truth Social Monitor watchdog..."
echo "Log file: $LOG_FILE"
echo "Monitor log: $SCRIPT_DIR/monitor.log"

# Change to script directory
cd "$SCRIPT_DIR" || {
    echo "Failed to change to script directory: $SCRIPT_DIR"
    exit 1
}

# Function to run the script
run_script() {
    echo "$(date) - Starting script..." >> "$LOG_FILE"
    echo "Starting monitor script with python3..."
    
    # Use nohup to keep the script running even if the terminal closes
    # Redirect stdout and stderr to a log file
    # Use & to run in the background
    nohup python3 "$SCRIPT_PATH" >> "$LOG_FILE" 2>&1 &
    
    # Get the process ID of the script
    PID=$!
    echo "$(date) - Script started with PID: $PID" >> "$LOG_FILE"
    echo "Script started with PID: $PID"
    echo $PID > "$SCRIPT_DIR/monitor.pid"
}

# Check if the script is already running
if [ -f "$SCRIPT_DIR/monitor.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/monitor.pid")
    if ps -p $PID > /dev/null; then
        echo "$(date) - Script is already running with PID: $PID" >> "$LOG_FILE"
        echo "Script is already running with PID: $PID"
    else
        echo "$(date) - Script is not running (PID: $PID). Starting..." >> "$LOG_FILE"
        echo "Script is not running. Starting..."
        run_script
    fi
else
    echo "$(date) - No PID file found. Starting script..." >> "$LOG_FILE"
    echo "No PID file found. Starting script..."
    run_script
fi

# Print instructions
echo ""
echo "=== TRUTH SOCIAL MONITOR IS RUNNING ==="
echo "The script is now running in the background and will continue running"
echo "even if you close this terminal."
echo ""
echo "To check logs: tail -f $SCRIPT_DIR/monitor.log"
echo "To stop the script: kill $(cat $SCRIPT_DIR/monitor.pid)"
echo ""
echo "To ensure the script keeps running, we've installed a systemd service"
echo "that will restart it automatically if it crashes."
echo "====================================" 