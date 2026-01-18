export const workstreamsContent = {
  'workstreams-overview': {
    title: 'Workstreams Overview',
    content: `
## Workstreams

Workstreams are **context sets** for multi-project workflows. They group related projects and inject context rules into every Claude session.

### Why Workstreams?

When working on complex features that span multiple repos (e.g., REST API + UI + shared library), you need Claude to understand the broader context. Workstreams solve this by:

1. **Grouping related projects together**
2. **Defining rules specific to that workflow**
3. **Automatically injecting those rules into every Claude session**

### Example Use Cases

- **Feature Development**: Group API, frontend, and shared libraries for a feature
- **Bug Investigation**: Group related services to trace issues across boundaries
- **Refactoring**: Group all affected repos during large-scale changes
- **Onboarding**: Create workstreams for different parts of your codebase

### Workstream Structure

Each workstream has:
- **Name** - Descriptive name (e.g., "User Auth", "Payment Flow")
- **Projects** - List of project directories included
- **Rules** - Context and guidelines specific to this workflow
- **Active Status** - Only one workstream can be active at a time
    `
  },
  'creating-workstreams': {
    title: 'Creating Workstreams',
    content: `
## Creating Workstreams

### Via UI

1. Go to **Workstreams** in the sidebar
2. Click **Create Workstream** button
3. Enter a name and optional description
4. Add projects using the project picker
5. Write rules for Claude to follow
6. Click **Create**

### Via CLI

\`\`\`bash
# Create a workstream
claude-config workstream create "User Auth"

# Add projects to it
claude-config workstream add-project "User Auth" ~/projects/api
claude-config workstream add-project "User Auth" ~/projects/ui
claude-config workstream add-project "User Auth" ~/projects/shared

# Activate it
claude-config workstream use "User Auth"
\`\`\`

### Managing Workstreams

**List all workstreams:**
\`\`\`bash
claude-config workstream
\`\`\`

**Show active workstream:**
\`\`\`bash
claude-config workstream active
\`\`\`

**Delete a workstream:**
\`\`\`bash
claude-config workstream delete "User Auth"
\`\`\`

### Editing Rules

In the UI, click a workstream to expand it and edit rules. Rules are markdown text that gets injected into Claude sessions:

\`\`\`markdown
Focus on user authentication flow.
- Use JWT tokens for auth
- React Query for state management
- PostgreSQL for persistence
- Follow REST conventions
\`\`\`
    `
  },
  'workstream-hooks': {
    title: 'Workstream Hook Integration',
    content: `
## Hook Integration

For workstream rules to be automatically injected into Claude sessions, you need to install a pre-prompt hook.

### One-Click Install (Recommended)

1. Open Web UI → **Workstreams**
2. Click **Install Hook Automatically**
3. Done! A green "Hook Installed" badge will appear

### Manual Installation

Add to \`~/.claude/hooks/pre-prompt.sh\`:

\`\`\`bash
#!/bin/bash
claude-config workstream inject --silent
\`\`\`

Make it executable:
\`\`\`bash
chmod +x ~/.claude/hooks/pre-prompt.sh
\`\`\`

### How It Works

1. When you start a Claude session, the pre-prompt hook runs
2. It checks for an active workstream
3. If found, it outputs the workstream's rules
4. These rules are prepended to your Claude session context

### Testing the Hook

\`\`\`bash
# See what would be injected
claude-config workstream inject

# Silent mode (no output if no workstream)
claude-config workstream inject --silent
\`\`\`

### Auto-Detection

Claude-config can also detect which workstream to use based on your current directory:

\`\`\`bash
claude-config workstream detect /path/to/project
\`\`\`
    `
  },
  'activity-tracking': {
    title: 'Activity Tracking',
    content: `
## Activity Tracking

Activity tracking observes which files and projects you work with during Claude sessions, enabling intelligent workstream suggestions.

### How It Works

1. A post-response hook logs file paths accessed during Claude sessions
2. Co-activity patterns are detected (projects frequently worked on together)
3. Workstream suggestions appear in the UI based on these patterns

### Setting Up Activity Tracking

Add to \`~/.claude/hooks/post-response.sh\`:

\`\`\`bash
#!/bin/bash
source /path/to/claude-config/hooks/activity-track.sh
\`\`\`

Or use the one-click install in the Workstreams view.

### Activity Insights Panel

In the **Workstreams** view, the Activity Insights panel shows:
- **Sessions tracked** - Number of Claude sessions logged
- **Files tracked** - Total file accesses recorded
- **Active projects** - Projects with recent activity
- **Top projects** - Most frequently accessed projects

### Workstream Suggestions

Based on co-activity patterns, claude-config suggests workstreams:

- **Co-activity score** - Percentage showing how often projects are worked on together
- **Create button** - Opens pre-filled dialog (tweak projects as needed)
- **Dismiss button** - Hide suggestions you don't want (persists to localStorage)

### Privacy

- Activity data is stored locally in \`~/.claude-config/activity.json\`
- Only file paths are logged (not file contents)
- You can delete the activity file at any time
- Activity tracking is read-only and never modifies your code
    `
  },
  'smart-sync': {
    title: 'Smart Sync',
    content: `
## Smart Sync

Smart Sync intelligently suggests workstream switches based on your current coding activity.

### How It Works

1. **Detection**: Monitors which projects you're actively working in
2. **Matching**: Compares activity against configured workstreams
3. **Nudging**: Shows non-blocking toast notifications when a switch might help
4. **Learning**: Remembers your choices to reduce future prompts

### Toast Notifications

When Smart Sync detects you might benefit from switching workstreams:

- **Switch nudge**: "Working on api, ui. Switch to 'User Auth'?" [Yes] [No] [Always] [Never]
- **Add project nudge**: "New project detected. Add to workstream?" [Yes] [No]

### Auto-Switch

When confidence is high (80%+ by default), Smart Sync can automatically switch workstreams without prompting.

### Settings

In the **Workstreams** view, find the Smart Sync settings panel:

- **Enable/Disable** - Toggle Smart Sync on or off
- **Threshold slider** - Adjust auto-switch confidence threshold (0-100%)

### Bulletproof Design

Smart Sync is designed to never block your workflow:

- All nudges are dismissible
- Fails silently if anything goes wrong
- Rate-limited (max one nudge per 5 minutes)
- Defaults to last-used workstream if detection fails
- Learns from your choices to reduce prompts over time

### User Choices

- **Yes** - Switch to suggested workstream
- **No** - Dismiss this nudge
- **Always** - Remember to always switch for this project-workstream pair
- **Never** - Never suggest this workstream for these projects again

Preferences are stored in \`~/.claude-config/smart-sync.json\`.
    `
  },
};
