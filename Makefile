# Pioneer Monorepo Makefile

# Set the shell to bash
SHELL := /bin/bash

# Default target
.PHONY: all
all: build

# Make scripts executable
.PHONY: init-scripts
init-scripts:
	@mkdir -p scripts/build scripts/test scripts/publish
	@chmod +x scripts/*.sh scripts/*/*.sh 2>/dev/null || true

# Build all packages
.PHONY: build
build: init-scripts
	@scripts/build/build.sh

# Build a specific package
# Usage: make build-pkg PKG=@pioneer-platform/pioneer-cli-alpha
.PHONY: build-pkg
build-pkg: init-scripts
	@scripts/build/build.sh $(PKG)

# Run all tests
.PHONY: test
test: build
	@scripts/test/test.sh

# Test a specific package
# Usage: make test-pkg PKG=@pioneer-platform/pioneer-cli-alpha
.PHONY: test-pkg
test-pkg: init-scripts
	@scripts/test/test.sh $(PKG)

# Publish all packages
.PHONY: publish
publish: build test
	@scripts/publish/publish.sh

# Dry run publish (no actual publishing)
.PHONY: publish-dry-run
publish-dry-run: build test
	@scripts/publish/publish.sh dry-run

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@find . -name "dist" -type d -exec rm -rf {} +
	@find . -name "dist-electron" -type d -exec rm -rf {} +
	@find . -name "dist-native" -type d -exec rm -rf {} +
	@echo "Clean completed!"

# Deep clean (includes node_modules)
.PHONY: clean-all
clean-all: clean
	@echo "Deep cleaning (removing node_modules)..."
	@find . -name "node_modules" -type d -exec rm -rf {} +
	@echo "Deep clean completed!"

# Install dependencies
.PHONY: install
install:
	@echo "Installing dependencies..."
	@pnpm install
	@echo "Dependencies installed!"

# Display help information
.PHONY: help
help:
	@echo "Pioneer Monorepo Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  make               Build all packages (default)"
	@echo "  make build         Build all packages"
	@echo "  make build-pkg     Build a specific package (PKG=package-name)"
	@echo "  make test          Run all tests"
	@echo "  make test-pkg      Test a specific package (PKG=package-name)"
	@echo "  make publish       Publish all packages"
	@echo "  make publish-dry-run  Simulate publishing (no actual publish)"
	@echo "  make clean         Remove build artifacts"
	@echo "  make clean-all     Deep clean (includes node_modules)"
	@echo "  make install       Install dependencies"
	@echo "  make help          Display this help message"
	@echo ""
	@echo "Example usage:"
	@echo "  make build-pkg PKG=@pioneer-platform/pioneer-cli-alpha" 