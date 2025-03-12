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

# Force manual testing for now until Turbo is properly configured
run_manual_tests=true

if [ "$run_manual_tests" = true ]; then
    log_info "Running tests manually..."
    
    # Run CLI tests
    log_info "Running CLI tests..."
    if [ -d "${REPO_ROOT}/apps/cli" ]; then
        cd "${REPO_ROOT}/apps/cli"
        
        # Run basic CLI tests
        if [ -f "./tests/run-tests.sh" ]; then
            log_info "Executing CLI basic tests..."
            ./tests/run-tests.sh
            if [ $? -ne 0 ]; then
                log_error "CLI basic tests failed"
                exit 1
            fi
        else
            log_warning "CLI basic tests not found, skipping"
        fi
        
        # Run the test-client
        if [ -f "./dist/test-client.js" ]; then
            log_info "Executing test-client..."
            node ./dist/test-client.js
            test_client_exit=$?
            if [ $test_client_exit -ne 0 ]; then
                log_error "test-client failed with exit code $test_client_exit"
                exit 1
            else
                log_success "test-client completed successfully"
            fi
        else
            log_warning "test-client.js not found in dist directory. Make sure the project is built correctly."
        fi
    else
        log_warning "CLI directory not found, skipping"
    fi
    
    # Add other package tests here as they become available
    # For example:
    # log_info "Running engine tests..."
    # if [ -d "${REPO_ROOT}/packages/engine" ]; then
    #     cd "${REPO_ROOT}/packages/engine"
    #     if [ -f "./tests/run-tests.sh" ]; then
    #         ./tests/run-tests.sh
    #         if [ $? -ne 0 ]; then
    #             log_error "Engine tests failed"
    #             exit 1
    #         fi
    #     else
    #         log_warning "Engine tests not found, skipping"
    #     fi
    # else
    #     log_warning "Engine directory not found, skipping"
    # fi
fi

log_success "All tests completed successfully!" 