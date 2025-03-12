#!/bin/bash

# Set script to exit on any error
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CLI path
CLI_PATH="${CLI_DIR}/dist/cli.js"

echo -e "${BLUE}Running tests from ${SCRIPT_DIR}${NC}"
echo -e "${BLUE}Using CLI from ${CLI_PATH}${NC}"

# Check if CLI exists
if [ ! -f "${CLI_PATH}" ]; then
    echo -e "${RED}Error: CLI not found at ${CLI_PATH}${NC}"
    echo -e "${RED}Did you run 'pnpm build' first?${NC}"
    exit 1
fi

# Test for basic MCP server command help
echo -e "\n${BLUE}Testing mcp-stdio command help:${NC}"
output=$(node "${CLI_PATH}" mcp-stdio --help)
if echo "$output" | grep -q "Run an MCP server with stdio transport"; then
    echo -e "${GREEN}✓ mcp-stdio command help test passed${NC}"
else
    echo -e "${RED}✗ mcp-stdio command help test failed${NC}"
    echo "$output"
    exit 1
fi

# Test for version command
echo -e "\n${BLUE}Testing version command:${NC}"
output=$(node "${CLI_PATH}" version)
if echo "$output" | grep -q "Pioneer CLI v"; then
    echo -e "${GREEN}✓ Version command test passed${NC}"
else
    echo -e "${RED}✗ Version command test failed${NC}"
    echo "$output"
    exit 1
fi

# All tests passed
echo -e "\n${GREEN}All tests passed!${NC}"
exit 0 