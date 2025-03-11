#!/bin/bash

# Test runner script that executes all test scripts in the tests directory
# Returns 0 if all tests pass, non-zero if any test fails

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR" || exit 1

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
  local test_script="$1"
  local test_name=$(basename "$test_script")
  
  echo -e "${YELLOW}Running test: $test_name${NC}"
  
  # Make the test script executable
  chmod +x "$test_script"
  
  # Run the test
  bash "$test_script"
  local exit_code=$?
  
  # Check result
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed: $test_name${NC}"
    ((PASSED_TESTS++))
  else
    echo -e "${RED}❌ Test failed: $test_name (exit code: $exit_code)${NC}"
    ((FAILED_TESTS++))
  fi
  
  # Separate tests with a line
  echo "----------------------------------------"
  
  return $exit_code
}

# Find and run all test scripts
for test_script in $(find . -name "test-*.sh" -type f | sort); do
  run_test "$test_script"
  ((TOTAL_TESTS++))
done

# Print summary
echo -e "${YELLOW}Test Summary:${NC}"
echo -e "  ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed: $FAILED_TESTS${NC}"
echo -e "  ${YELLOW}Total:  $TOTAL_TESTS${NC}"

# Return appropriate exit code
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi 