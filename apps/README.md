# Pioneer CLI - MCP Server for Cursor

A simplified command-line interface that implements the Model Context Protocol (MCP) for integration with Cursor IDE.

## Features

- Implements a clean and simplified MCP server over standard input/output
- Provides the essential tools required by Cursor:
  - `getPassword`: Returns a password
  - `echo`: Echoes back a message
- Designed for reliability and ease of debugging

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/your-org/pioneer-desktop-v11.git
cd pioneer-desktop-v11/apps

# Install dependencies and build
pnpm install
pnpm build
```

### Global Installation

```bash
# Install globally from the current directory
npm install -g .

# Or from npm registry
npm install -g @pioneer-platform/pioneer-cli
```

## Usage

### Running the MCP Server

```bash
# Using the CLI directly
node dist/cli.js mcp-stdio

# Or if installed globally
pioneer mcp-stdio
```

### Configuring in Cursor

In Cursor's settings, set the MCP command to:

```
/usr/bin/env node /path/to/pioneer-desktop-v11/apps/dist/cli.js mcp-stdio
```

Replace `/path/to/pioneer-desktop-v11` with the actual path to your installation.

## Development

```bash
# Watch mode during development
pnpm dev

# Running tests
pnpm test

# Building
pnpm build
```

## Debugging

The MCP server logs to `~/mcp-server-debug.log` for easier debugging. Enable more verbose logging with:

```bash
DEBUG=true pioneer mcp-stdio
```

## License

MIT 