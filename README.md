# Pioneer Monorepo

Pioneer is a desktop and CLI suite designed for efficient code review and management with local Git flow integration. This repository is organized as a monorepo using pnpm workspaces.

## Project Structure

```
pioneer-desktop-v10/
├── apps/
│   ├── pioneer-desktop/      # Electron desktop application with Git diff viewer
│   └── pioneer-cli/          # Command line interface for Pioneer
├── packages/
│   └── pioneer-engine/       # Core engine shared between desktop and CLI
├── scripts/                  # Utility scripts for Git operations and PR management
└── local-prs/                # Directory for storing local PR patches
```

## Key Features

- **Side-by-side Git Diff Viewer** - JetBrains-style diff comparison UI
- **Local PR Workflow** - Create, review, and merge PRs without remote Git repositories
- **Integrated Database** - Persistent storage using better-sqlite3
- **Shared Core Engine** - Common functionality between desktop and CLI
- **LLM Integration** - Designed to work with Cursor and LLMs via MCP (Model Control Protocol)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pioneer-desktop-v10.git
cd pioneer-desktop-v10

# Install dependencies
pnpm install
```

### Development

```bash
# Start development for all packages
pnpm dev

# Start development for a specific package
pnpm --filter pioneer-desktop dev
pnpm --filter pioneer-cli dev
```

### Building

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter pioneer-desktop build
```

## Git Diff Viewer & PR Review Workflow

One of the standout features is the integrated Git diff viewer with a local PR review system:

1. **Create PRs Locally**:
   ```bash
   pnpm pr:create current
   ```

2. **Review in the Desktop App**:
   - Side-by-side diff view
   - Syntax highlighting
   - Line-by-line review
   - Visual indicators for additions/deletions

3. **Approve or Request Changes**:
   - Provide feedback within the app
   - Mark PR status as APPROVED or CHANGES_REQUESTED

4. **Merge Approved PRs**:
   ```bash
   pnpm pr:merge branch-name
   ```

This workflow is ideal for:
- Teams working with LLMs to generate code
- Fast iteration cycles without GitHub overhead
- Code review sessions with quick feedback loops

## Cursor Integration

Pioneer is designed to work seamlessly with the Cursor editor via MCP (Model Control Protocol), allowing:
- Rapid iteration on code changes
- Direct communication between the LLM in Cursor and the Pioneer app
- Streamlined feedback and correction cycles

## Git Flow

This project follows a custom Git Flow process adapted for local development:

- **Feature Branches**: `feature-*` branched from `develop`
- **Hotfixes**: `hotfix-*` branched from `master`
- **Releases**: `release-*` branched from `develop`

See [Git Flow Rules](/.cursor/rules/git-flow.md) for detailed guidelines.

## License

MIT

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
