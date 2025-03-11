# Pioneer Engine

Core engine package shared between Pioneer Desktop and Pioneer CLI applications, providing consistent functionality across all Pioneer tools.

## Features

- **Database Management**: SQLite database operations with better-sqlite3
- **Version Control**: Engine version tracking and reporting
- **Configuration**: Shared configuration management
- **Pluggable Design**: Accepts either database path or SQLite instance

## Usage

### Basic Initialization

```typescript
import { PioneerEngine } from 'pioneer-engine';

// Initialize with database path
const engine = new PioneerEngine({
  dbPath: '/path/to/database.sqlite'
});

// Or initialize with existing SQLite instance
import Database from 'better-sqlite3';
const db = new Database('/path/to/database.sqlite');
const engine = new PioneerEngine({
  sqliteInstance: db
});
```

### Database Operations

```typescript
// Get a setting
const value = await engine.getSetting('settingName');

// Set a setting
await engine.setSetting('settingName', 'settingValue');

// Get all settings
const settings = await engine.getAllSettings();
```

### Version Information

```typescript
// Get engine version
const version = engine.getVersion();
console.log(`Engine version: ${version}`);
```

## Architecture

### Core Components

```
src/
├── index.ts              # Main entry point
├── PioneerEngine.ts      # Core engine implementation
└── types/                # TypeScript type definitions
```

### Design Principles

The Pioneer Engine follows these key design principles:

1. **Minimal Dependencies**: Keep the engine's dependencies minimal
2. **Shared Core Logic**: Implement core logic once and share across applications
3. **Flexible Initialization**: Support multiple initialization methods
4. **Error Handling**: Comprehensive error handling for all operations

## API Reference

### Constructor

```typescript
constructor(options: { dbPath?: string; sqliteInstance?: Database })
```

Initialize the Pioneer Engine with either a database path or a SQLite instance.

### Methods

**Database Operations**

```typescript
getSetting(key: string): Promise<any>
setSetting(key: string, value: any): Promise<void>
getAllSettings(): Promise<Record<string, any>>
```

**Version Management**

```typescript
getVersion(): string
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build the engine
pnpm --filter pioneer-engine build
```

### Testing

```bash
# Run all tests
pnpm --filter pioneer-engine test
```

## Integration

### With Pioneer Desktop

Pioneer Desktop uses the engine for persistent storage and core functionality:

```typescript
// In apps/pioneer-desktop/electron/core/better-sqlite3.ts
import { PioneerEngine } from 'pioneer-engine';

export function initializeDatabase() {
  const engine = new PioneerEngine({
    dbPath: getDatabasePath()
  });
  // Additional configuration
  return engine;
}
```

### With Pioneer CLI

Pioneer CLI uses the engine for commands and database operations:

```typescript
// In apps/pioneer-cli/src/index.ts
import { PioneerEngine } from 'pioneer-engine';

export class PioneerCLI {
  private engine: PioneerEngine;
  
  constructor(options = {}) {
    this.engine = new PioneerEngine(options);
  }
  
  // CLI methods that use the engine
}
```

## Extending

To extend the engine with new functionality:

1. Add new methods to the PioneerEngine class
2. Update typings to reflect new capabilities
3. Implement the functionality
4. Add tests for the new features
5. Update both Desktop and CLI to use the new functionality 