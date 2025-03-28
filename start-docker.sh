#!/bin/bash

# Exit on error
set -e

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Copy .env file if it doesn't exist
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file from template${NC}"
  cp .env.example .env 2>/dev/null || echo -e "${YELLOW}No .env.example found, creating empty .env${NC}" && touch .env
fi

# Ensure we have an OpenAI API key in the .env file
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=$" .env || grep -q "OPENAI_API_KEY=\"\"" .env; then
  echo -e "${YELLOW}Please enter your OpenAI API key:${NC}"
  read -r apikey
  if grep -q "OPENAI_API_KEY=" .env; then
    # Replace existing empty key
    sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=${apikey}/" .env
  else
    # Add new key
    echo "OPENAI_API_KEY=${apikey}" >> .env
  fi
  echo -e "${GREEN}OpenAI API key added to .env file${NC}"
fi

# Kill any processes running on port 3100
echo -e "${YELLOW}Killing any processes running on port 3100...${NC}"
kill -9 $(lsof -ti:3100) 2>/dev/null || true

# Stop any running Docker containers for Aider service
echo -e "${GREEN}Stopping any running Aider service containers...${NC}"
cd apps/aider-service
docker-compose down || true

# Start the Aider service using Docker
echo -e "${GREEN}Starting Aider service with Docker on port 3100...${NC}"
docker-compose up -d --build

# Wait for the service to be ready
echo -e "${YELLOW}Waiting for Aider service to start...${NC}"
sleep 5

# Show status
echo -e "${GREEN}Aider service is running at http://localhost:3100${NC}"
echo -e "${YELLOW}Starting web client locally in new terminal...${NC}"

# Start the web client in a new terminal window
cd ../../
osascript -e "tell app \"Terminal\" to do script \"cd \\\"$(pwd)/apps/aider-web-client\\\" && npm run dev\""

# Print instructions
echo -e "${GREEN}=== Instructions ===${NC}"
echo -e "${GREEN}1. Aider service is running at:${NC} http://localhost:3100"
echo -e "${GREEN}2. Web client should be running at:${NC} http://localhost:3000 (or next available port)"
echo -e "${GREEN}3. To view Aider service logs, run:${NC} docker-compose -f apps/aider-service/docker-compose.yml logs -f"
echo -e "${GREEN}4. To stop all containers:${NC} docker-compose -f apps/aider-service/docker-compose.yml down" 