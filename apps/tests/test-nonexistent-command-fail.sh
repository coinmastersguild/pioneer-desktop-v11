#!/bin/bash

# Test that calls a non-existent command to demonstrate a failing test
# Returns 0 (success) if the command fails as expected, 1 (error) if it somehow succeeds

# Set the path to the CLI executable
CLI_PATH="./dist/cli.js"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.." || exit 1

# Check if the CLI executable exists
if [ ! -f "$CLI_PATH" ]; then
  echo "Error: CLI executable not found at $CLI_PATH"
  echo "Please build the CLI first with 'pnpm build'"
  exit 1
fi

# Run a non-existent command
echo "Testing non-existent command (should fail)..."
NON_EXISTENT_COMMAND="this-command-does-not-exist"
node "$CLI_PATH" $NON_EXISTENT_COMMAND &> /dev/null
EXIT_CODE=$?

# Check if the command failed as expected
if [ $EXIT_CODE -ne 0 ]; then
  echo "Success: Command '$NON_EXISTENT_COMMAND' failed as expected with exit code $EXIT_CODE"
  exit 0
else
  echo "Error: Command '$NON_EXISTENT_COMMAND' unexpectedly succeeded"
  exit 1
fi 