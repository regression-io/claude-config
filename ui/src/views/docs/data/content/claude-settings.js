export const claudeSettingsContent = {
  'permissions': {
    title: 'Permissions',
    content: `
## Permissions

Control what Claude Code can do automatically.

### Permission Levels

- **Allow** - Tools that run without asking
- **Ask** - Tools that require confirmation
- **Deny** - Tools that are blocked

### Pattern Syntax

\`\`\`
Tool(pattern)
\`\`\`

Examples:
- \`Bash(npm run build)\` - Specific command
- \`Bash(npm:*)\` - Prefix match (npm anything)
- \`Read(**)\` - All file reads
- \`Edit(src/**)\` - Edit files in src/
- \`mcp__github__*\` - All GitHub MCP tools

### Managing Permissions

In the **Claude Code** settings view:
1. Navigate to the Permissions tab
2. Add patterns to Allow, Ask, or Deny lists
3. Click Save to apply

### Best Practices

- Start restrictive, allow more as needed
- Use specific patterns over wildcards
- Review deny list for security-sensitive operations
    `
  },
  'model-selection': {
    title: 'Model Selection',
    content: `
## Model Selection

Choose which Claude model to use.

### Available Models

- **Claude Sonnet 4** - Fast, capable, good for most tasks
- **Claude Opus 4** - Most capable, best for complex tasks
- **Claude Haiku** - Fastest, good for simple tasks

### Setting the Model

In **Claude Code** settings, use the Model dropdown to select your preferred model.

### Per-Task Model

Some tasks may benefit from different models:
- Use Haiku for quick edits
- Use Opus for complex refactoring
- Use Sonnet as a balanced default
    `
  },
  'behavior': {
    title: 'Behavior Settings',
    content: `
## Behavior Settings

Configure how Claude Code behaves.

### Available Settings

- **Auto-accept edits** - Automatically accept file changes
- **Verbose mode** - Show more detailed output
- **Enable MCPs** - Toggle MCP servers on/off

### Configuration

These settings are stored in \`~/.claude/settings.json\` and can be edited in the Claude Code settings view.
    `
  },
  'hooks': {
    title: 'Hooks',
    content: `
## Hooks

Hooks allow you to run custom commands at specific points.

### Available Hooks

- **preToolUse** - Before a tool is used
- **postToolUse** - After a tool is used
- **notification** - When Claude sends a notification

### Configuration

\`\`\`json
{
  "hooks": {
    "postToolUse": "echo 'Tool used'"
  }
}
\`\`\`

### Use Cases

- Run linters after file edits
- Log tool usage
- Custom notifications
    `
  },
};
