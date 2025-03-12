# Pioneer Desktop Setup Issues

## Current Setup Issues

1. **Workspace Configuration**:
   - The CLI package (`apps/`) depends on the engine package (`packages/pioneer-engine`) using workspace syntax, but the workspace configuration doesn't seem to be working correctly.
   - The CLI package can't find the engine package in the workspace.

2. **Missing Dependencies**:
   - The engine package has missing dependencies:
     - `sqlite-vec`
     - `@coinmasters/types`
     - `@pioneer-platform/pioneer-coins`

3. **Build Process**:
   - The build process is failing due to the missing dependencies.

## Solutions

### 1. Fix Workspace Configuration

Make sure the monorepo is properly configured with pnpm workspaces. Check the root package.json to ensure it has the correct workspaces configuration:

```json
{
  "workspaces": [
    "apps",
    "packages/*"
  ]
}
```

### 2. Add Missing Dependencies

The missing dependencies need to be installed:

```bash
cd packages/pioneer-engine
pnpm add sqlite-vec @coinmasters/types @pioneer-platform/pioneer-coins
```

If these are private packages, they might need to be built locally or access to their repositories might be needed.

### 3. Fix Package Names

Make sure the package names in the workspaces match exactly what's being referenced:

- The engine package in `packages/pioneer-engine` should be named `@pioneer-platform/pioneer-engine`
- The CLI package in `apps` should be named `@pioneer-platform/pioneer-cli`

### 4. Running the CLI

Once the dependencies are fixed, the CLI can be run using:

```bash
cd apps
pnpm cli
```

Or in development mode:

```bash
cd apps
pnpm dev:cli
```

## Local MCP Server Setup

To run the CLI as a local MCP server, these issues need to be resolved first. Once resolved, the documentation in `rules.md` can be followed to start and use the MCP server. 