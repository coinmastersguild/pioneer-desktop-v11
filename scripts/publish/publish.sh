#!/bin/bash
set -e

# Script for publishing packages in the monorepo
# Can be called with "dry-run" as argument to simulate publishing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Include common utilities
source "${SCRIPT_DIR}/../common.sh"

cd "${REPO_ROOT}"

# Check if this is a dry run
DRY_RUN=false
if [ "$1" == "dry-run" ]; then
    DRY_RUN=true
    log_info "Running in dry-run mode (no actual publishing)"
fi

# Function to publish a specific package
publish_package() {
    local package_path="$1"
    local package_name=$(node -e "console.log(require('./package.json').name)")
    
    log_info "Publishing package: ${package_name}"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "[DRY RUN] Would publish ${package_name}"
        pnpm publish --no-git-checks --dry-run
    else
        pnpm publish --no-git-checks
    fi
}

# Ensure we have built everything first
log_info "Building all packages before publishing..."
"${SCRIPT_DIR}/../build/build.sh"

# Check if we're using changesets
if [ -f "${REPO_ROOT}/.changeset/config.json" ]; then
    log_info "Using changesets for publishing"
    
    # Create version bumps using changesets
    if [ "$DRY_RUN" == "true" ]; then
        log_info "Skipping changeset version in dry-run mode"
    else
        log_info "Creating version bumps with changeset..."
        pnpm changeset version
    fi
    
    # Publish the packages
    if [ "$DRY_RUN" == "true" ]; then
        log_info "[DRY RUN] Would publish packages with changeset"
        CHANGESET_SKIP_CONFIRMATION=1 pnpm changeset publish --dry-run --no-git-tag
    else
        log_info "Publishing packages with changeset..."
        CHANGESET_SKIP_CONFIRMATION=1 pnpm changeset publish --no-git-tag
    fi
else
    # Manually publish each package in the correct order
    log_info "Manual publishing process (no changeset)..."
    
    # Go through each publishable package (add more as needed)
    PACKAGES=(
        "packages/engine"
        "apps/cli"
    )
    
    for pkg in "${PACKAGES[@]}"; do
        if [ -d "${REPO_ROOT}/${pkg}" ]; then
            cd "${REPO_ROOT}/${pkg}"
            publish_package "${pkg}"
        else
            log_warning "Package directory not found: ${pkg}"
        fi
    done
fi

log_success "Publishing process completed!" 