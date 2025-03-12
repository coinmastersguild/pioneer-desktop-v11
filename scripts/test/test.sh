#!/bin/bash
set -e

# Script for running tests across all packages
# Can be called with specific package name as argument

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Include common utilities
source "${SCRIPT_DIR}/../common.sh"

cd "${REPO_ROOT}"

# If specific package is specified, test only that one
if [ "$1" != "" ]; then
    log_info "Testing specific package: $1"
    pnpm --filter "$1" test
    exit $?
fi

# Otherwise test everything in dependency order
log_info "Testing all packages..."

# Check if we have turbo available
if command -v turbo >/dev/null 2>&1; then
    log_info "Using Turborepo for tests"
    turbo test
else
    log_info "Running tests manually..."
    
    # Run CLI tests
    log_info "Running CLI tests..."
    cd "${REPO_ROOT}/apps/cli"
    if [ -f "./tests/run-tests.sh" ]; then
        ./tests/run-tests.sh
    else
        log_warning "CLI tests not found, skipping"
    fi
    
    # Add other package tests here as they become available
    # For example:
    # log_info "Running engine tests..."
    # cd "${REPO_ROOT}/packages/engine"
    # if [ -f "./tests/run-tests.sh" ]; then
    #     ./tests/run-tests.sh
    # else
    #     log_warning "Engine tests not found, skipping"
    # fi
fi

log_success "All tests completed successfully!" 