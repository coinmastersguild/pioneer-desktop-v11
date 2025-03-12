# Pioneer Desktop Development Rules

## Building with Turborepo

### Build Commands

- **Full Build**: To build all packages and applications in the monorepo:
  ```bash
  pnpm build
  ```

- **Build CLI Package**: To build the CLI package:
  ```bash
  cd apps && pnpm build
  ```

- **Build Engine Package**: To build the engine package:
  ```bash
  cd packages/pioneer-engine && pnpm build
  ```

- **Build Development Dependencies**: To build packages that are dependencies for local development:
  ```bash
  pnpm build-packages
  ```

### Pipeline Configuration

Our Turborepo pipeline is configured in `turbo.json` and follows these rules:
- The `build` task has dependencies on parent packages' build tasks
- Build outputs are stored in `dist/`, `dist-electron/`, and `dist-native/` directories
- Development mode (`dev`) is not cached and runs persistently
- Tests depend on packages being built first

## Starting and Stopping

### Starting the CLI as an MCP Server

To start the CLI with stdio-based MCP server in production mode:
```bash
cd apps && pnpm cli mcp-stdio
```

For development mode with live TypeScript compilation:
```bash
cd apps && pnpm dev:cli mcp-stdio
```

The MCP server supports these functions:
- `mcp__getPassword`: Securely prompts for a password
- `mcp__echo`: Echoes back a message for testing

### Stopping the Application

- For the MCP server, press `Ctrl+C` in the terminal where it's running

## Version Control Rules

### Version Bumping

- Every run should trigger a minor version bump
- Version control is managed in the root `package.json`
- Use the automated version bump command to increment the version:
  ```bash
  pnpm version-bump
  ```

### Publishing Packages

To publish packages after a version bump:
```bash
pnpm publish-packages
```

For a quick publish with automated version bumping:
```bash
pnpm quick-publish
``` 