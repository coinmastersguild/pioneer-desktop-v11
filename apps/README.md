# Pioneer CLI

Command-line interface for Pioneer, providing Git workflow management and integration with the Pioneer Desktop app.

## Features

- **Local PR Management**: Create, review, and merge PRs without GitHub
- **Git Operations**: Managed Git operations with timeout protection
- **Database Operations**: Access and manage SQLite database
- **Engine Integration**: Uses the shared pioneer-engine for core functionality

## Commands

### PR Management

```bash
# Create a PR from the current branch to develop
pnpm pr:create current

# Create a PR from a specific branch to develop
pnpm pr:create feature-branch-name

# Create a PR to a specific target branch
pnpm pr:create feature-branch-name target-branch

# Review a PR
pnpm pr:review PR-file.patch

# Merge an approved PR
pnpm pr:merge branch-name
```

### Git Operations

```bash
# All git commands are wrapped with timeout protection
pnpm git status
pnpm git pull
pnpm git push

# Create branches following git flow
pnpm git:feature my-feature    # Creates feature-my-feature from develop
pnpm git:hotfix critical-fix   # Creates hotfix-critical-fix from master
pnpm git:release 1.0.0         # Creates release-1.0.0 from develop
```

## Architecture

The CLI is built on the following components:

- **Commander.js**: Command parsing and execution
- **Pioneer Engine**: Shared core functionality
- **Better SQLite3**: Database operations
- **Git Wrapper**: Timeout-protected Git operations

## Implementation Details

### Command Structure

Commands are organized in the following structure:

```
src/
├── cli.ts           # Main CLI entry point
├── index.ts         # Library exports
└── commands/        # CLI command implementations
```

### Integration with Desktop App

The CLI creates patch files that can be loaded and reviewed in the Pioneer Desktop application:

1. The CLI creates patch files in the `local-prs/` directory
2. Patch files include metadata and the Git diff content
3. The Desktop app loads these files for review
4. The CLI can then apply or merge the reviewed patches

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm --filter pioneer-cli build
```

### Testing

The CLI includes a test suite to verify functionality:

```bash
# Run all tests
pnpm --filter pioneer-cli test

# Run specific test
pnpm --filter pioneer-cli test-engine-version
```

### Adding New Commands

To add a new command:

1. Create a new file in `src/commands/`
2. Register the command in `src/cli.ts`
3. Implement the command logic
4. Add tests in the `tests/` directory

Example:

```typescript
// src/commands/myCommand.ts
export function registerMyCommand(program: Command) {
  program
    .command('my-command')
    .description('Description of the command')
    .action(async () => {
      // Command implementation
    });
}

// Add to src/cli.ts
import { registerMyCommand } from './commands/myCommand';
// ...
registerMyCommand(program);
```

## Extending

### Adding Engine Features

The CLI uses the shared pioneer-engine package. To extend functionality:

1. Add new features to the pioneer-engine package
2. Update the CLI to use the new engine features
3. Add corresponding commands to expose the functionality 