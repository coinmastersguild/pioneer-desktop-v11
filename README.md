# Pioneer Monorepo

Pioneer is a desktop and CLI suite designed for efficient code review and management with local Git flow integration. This repository is organized as a monorepo using pnpm workspaces.

## Build System

This project now uses a Makefile-based build system for consistency and ease of use. The Makefile provides commands for building, testing, and publishing packages in the monorepo.

### Available Commands

- `make` or `make build` - Build all packages
- `make build-pkg PKG=package-name` - Build a specific package
- `make test` - Run tests for all packages
- `make test-pkg PKG=package-name` - Test a specific package
- `make publish` - Publish all packages
- `make publish-dry-run` - Simulate publishing (no actual publication)
- `make clean` - Remove build artifacts
- `make clean-all` - Deep clean (includes node_modules)
- `make install` - Install dependencies
- `make help` - Display help information

### Examples

```bash
# Build all packages
make build

# Build a specific package
make build-pkg PKG=@pioneer-platform/pioneer-cli-alpha

# Run tests
make test

# Publish packages
make publish
```

