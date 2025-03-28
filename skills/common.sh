#!/bin/bash

# Common utility functions for all scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the root directory of the monorepo
# Usage: ensure_repo_root
ensure_repo_root() {
    if [ ! -f "package.json" ] || [ ! -f "turbo.json" ]; then
        log_error "This script must be run from the root of the monorepo"
        exit 1
    fi
}

# Find all packages in the monorepo
# Usage: packages=($(find_packages))
find_packages() {
    local packages=()
    
    # Check for workspaces in package.json
    if [ -f "package.json" ]; then
        # This is a simplistic approach - in a real script you'd want to parse JSON properly
        local workspace_globs=$(grep -o '"workspaces":\s*\[\s*"[^"]*"' package.json | grep -o '"[^"]*"' | tail -n +2 | sed 's/"//g')
        
        if [ -n "$workspace_globs" ]; then
            for glob in $workspace_globs; do
                # Replace * with the appropriate find pattern
                local pattern=${glob//\*/*/package.json}
                for pkg_json in $pattern; do
                    if [ -f "$pkg_json" ]; then
                        packages+=("$(dirname "$pkg_json")")
                    fi
                done
            done
        fi
    fi
    
    # If no packages found via workspaces, use a fallback approach
    if [ ${#packages[@]} -eq 0 ]; then
        # Look for package.json files in common locations
        for pkg_json in apps/*/package.json packages/*/package.json; do
            if [ -f "$pkg_json" ]; then
                packages+=("$(dirname "$pkg_json")")
            fi
        done
    fi
    
    # Output the packages
    for pkg in "${packages[@]}"; do
        echo "$pkg"
    done
}

# Make all scripts executable
make_executable() {
    log_info "Making all scripts executable..."
    find "$(dirname "${BASH_SOURCE[0]}")" -name "*.sh" -exec chmod +x {} \;
}

# Check if we're called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    make_executable
    log_success "All scripts are now executable"
fi 