#!/bin/bash

# Start the Aider service and Next.js app together
echo "Starting Aider services..."
echo "============================"

# Set the current directory to the project root
cd "$(dirname "$0")"

# Function to create a new tmux session and run a command
create_tmux_session() {
  local session_name=$1
  local command=$2
  
  # Check if the session already exists
  if tmux has-session -t "$session_name" 2>/dev/null; then
    echo "Session $session_name already exists. Killing it."
    tmux kill-session -t "$session_name"
  fi
  
  # Create a new session and run the command
  tmux new-session -d -s "$session_name" "$command"
  echo "Started $session_name in tmux session"
}

# First, check if tmux is installed
if ! command -v tmux &> /dev/null; then
  echo "tmux is not installed. Please install it to run both services."
  exit 1
fi

# Start the Aider service
create_tmux_session "aider-service" "cd apps/aider-service && npm run dev"
echo "Aider service starting at http://localhost:3100"

# Start the Next.js app
create_tmux_session "aider-web-client" "cd apps/aider-web-client && npm run dev"
echo "Next.js app starting at http://localhost:3000"

echo ""
echo "Both services are running in tmux sessions."
echo "Main web interface: http://localhost:3100/app"
echo "API documentation: http://localhost:3100/docs"
echo ""
echo "To attach to the sessions:"
echo "  tmux attach-session -t aider-service"
echo "  tmux attach-session -t aider-web-client"
echo ""
echo "To stop the services:"
echo "  tmux kill-session -t aider-service"
echo "  tmux kill-session -t aider-web-client" 