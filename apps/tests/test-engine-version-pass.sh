#!/bin/bash

# Test that checks if the engine-version command returns a version number
# Returns 0 (success) if the command returns a version, otherwise returns non-zero

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

# Run the engine-version command
echo "Testing engine-version command..."
VERSION_OUTPUT=$(node "$CLI_PATH" engine-version)
EXIT_CODE=$?

# Check if the command succeeded
if [ $EXIT_CODE -ne 0 ]; then
  echo "Error: engine-version command failed with exit code $EXIT_CODE"
  exit $EXIT_CODE
fi

# Check if the output contains a version number
if [[ "$VERSION_OUTPUT" =~ "Pioneer Engine version: "([0-9]+\.[0-9]+\.[0-9]+) ]]; then
  VERSION=${BASH_REMATCH[1]}
  echo "Success: Engine version is $VERSION"
  exit 0
else
  echo "Error: Could not find a valid version number in output:"
  echo "$VERSION_OUTPUT"
  exit 1
fi 