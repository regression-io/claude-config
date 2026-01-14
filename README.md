# Claude Config

A configuration management UI for **Claude Code** that provides:

- **Web UI** for managing MCPs, rules, commands, and memory
- **File Explorer** for full .claude folder management at every hierarchy level
- **MCP Registry** with GitHub/npm search and smart import
- **Memory System** for preferences, corrections, patterns, and decisions
- **Settings** for tools directory and other preferences

## Installation

### Option 1: npm (recommended)

```bash
# Install globally
npm install -g claude-config

# Run the UI
claude-config
```

### Option 2: From GitHub

```bash
# Install from GitHub
npm install -g github:regression-io/claude-config

# Run the UI
claude-config
```

### Option 3: Local Development

```bash
# Clone the repo
git clone https://github.com/regression-io/claude-config.git
cd claude-config

# Install dependencies and build
npm install
npm run build

# Run
npm start
# or
node cli.js
```

## Usage

### Start the Web UI

```bash
# Default port 3333
claude-config

# Custom port
claude-config --port 8080

# For a specific project directory
claude-config /path/to/project
```

Then open http://localhost:3333 in your browser.

### CLI Commands

```bash
claude-config                    # Start web UI (default)
claude-config ui                 # Start web UI
claude-config ui --port 8080     # Custom port
claude-config display            # Show current configuration
claude-config init               # Initialize .claude folder
claude-config --help             # Show help
claude-config --version          # Show version
```

## Features

### File Explorer

Browse and edit all .claude folders in the hierarchy from home (~) to your project:

- `mcps.json` - MCP configurations with toggle controls
- `settings.json` - Claude Code settings
- `rules/*.md` - Project-specific rules
- `commands/*.md` - Custom commands
- `CLAUDE.md` - Project instructions

Create new .claude folders at any intermediate level.

### MCP Registry

Manage your MCP (Model Context Protocol) servers:

- View all registered MCPs
- Add/edit/delete MCP configurations
- Search GitHub and npm for new MCPs
- Smart import with Claude Code analysis
- Toggle MCPs on/off per configuration level

### Memory System

Persistent memory for Claude Code sessions:

**Global Memory** (`~/.claude/memory/`):
- `preferences.md` - User preferences (tools, style)
- `corrections.md` - Mistakes to avoid
- `facts.md` - Environment facts

**Project Memory** (`<project>/.claude/memory/`):
- `context.md` - Project overview
- `patterns.md` - Code patterns
- `decisions.md` - Architecture decisions
- `issues.md` - Known issues
- `history.md` - Session history

### Settings

Configure via UI or `~/.claude/config.json`:

```json
{
  "toolsDir": "~/mcp-tools",
  "registryPath": "~/.claude/registry.json",
  "ui": {
    "port": 3333,
    "openBrowser": true
  }
}
```

## Configuration Hierarchy

Claude Config supports hierarchical configuration. Settings merge from home to project:

```
~/.claude/mcps.json          (global - applies everywhere)
~/projects/.claude/mcps.json (workspace - applies to all projects here)
~/projects/my-app/.claude/   (project - specific to this project)
```

MCPs enabled at higher levels apply to all descendant projects.

## Project Structure

After initialization:

```
your-project/
├── .claude/
│   ├── mcps.json       # MCP configuration
│   ├── settings.json   # Claude Code settings
│   ├── rules/          # Project rules for Claude
│   │   └── *.md
│   ├── commands/       # Custom slash commands
│   │   └── *.md
│   └── memory/         # Project memory (if initialized)
│       ├── context.md
│       ├── patterns.md
│       ├── decisions.md
│       ├── issues.md
│       └── history.md
└── .mcp.json           # Generated - Claude Code reads this
```

## MCP Configuration Format

`.claude/mcps.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

Environment variables use `${VAR}` syntax and are loaded from `.claude/.env`.

## Requirements

- Node.js 18+
- npm or pnpm

## Development

```bash
# Install dependencies
npm install
cd ui && npm install

# Development mode (hot reload)
npm run ui:dev

# Build for production
npm run build

# Create npm package
npm pack
```

## License

MIT
