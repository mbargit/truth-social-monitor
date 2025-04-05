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
    echo "Watchdog is now monitoring the script. You can safely exit this terminal."
    echo "To check logs: tail -f $SCRIPT_DIR/monitor.log"
    echo "To stop the script: kill $(cat $SCRIPT_DIR/monitor.pid)"
}

# Main script controller
while true; do
    # Check if the process is running
    if [ -f "$SCRIPT_DIR/monitor.pid" ]; then
        PID=$(cat "$SCRIPT_DIR/monitor.pid")
        if ps -p $PID > /dev/null; then
            echo "$(date) - Script is already running with PID: $PID" >> "$LOG_FILE"
            echo "Script is already running with PID: $PID"
            echo "Watchdog is now monitoring. You can safely exit this terminal."
            echo "To check logs: tail -f $SCRIPT_DIR/monitor.log"
            echo "To stop the script: kill $PID"
        else
            echo "$(date) - Script is not running (PID: $PID). Restarting..." >> "$LOG_FILE"
            echo "Script is not running. Restarting..."
            run_script
        fi
    else
        echo "$(date) - No PID file found. Starting script..." >> "$LOG_FILE"
        echo "No PID file found. Starting script..."
        run_script
    fi
    
    # First check is immediate, then background the watchdog process
    echo "Watchdog running in background. Press Ctrl+C to exit watchdog (script will continue running)."
    exec nohup "$0" > /dev/null 2>&1 &
    exit 0
done 