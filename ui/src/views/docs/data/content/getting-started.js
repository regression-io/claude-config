export const gettingStartedContent = {
  'installation': {
    title: 'Installation',
    content: `
## Installation

Install claude-config globally via npm:

\`\`\`bash
npm install -g @regression-io/claude-config
\`\`\`

Or install from GitHub directly:

\`\`\`bash
npm install -g github:regression-io/claude-config
\`\`\`

### Requirements

- **Node.js 18+** is required
- Works on macOS, Linux, and Windows (with some limitations)

### Verify Installation

After installation, verify it's working:

\`\`\`bash
claude-config --version
\`\`\`

This should display the version number and installation paths.
    `
  },
  'quick-start': {
    title: 'Quick Start',
    content: `
## Quick Start

### 1. Start the UI

\`\`\`bash
claude-config ui
\`\`\`

This starts the web UI as a background daemon on port 3333.

### 2. Open in Browser

Navigate to **http://localhost:3333**

### 3. Add a Project

Click "Add Project" in the header or go to All Projects view to register your project directories.

### 4. Initialize Configuration

For each project, you can:
- Create a \`.claude\` folder with configuration
- Add rules (guidelines for Claude)
- Add commands (reusable prompts)
- Configure MCPs (Model Context Protocol servers)

### 5. Apply Templates

Use pre-built templates to quickly set up rules for your project type:
- **fastapi** - Python FastAPI projects
- **react-ts** - React with TypeScript
- **python-cli** - Python CLI tools
- And more...

### 6. Install as App (Optional)

Claude Config is a PWA (Progressive Web App). Install it to your taskbar:

**Chrome/Edge:** Click the install icon in the address bar
**Safari:** Share → Add to Dock

### 7. Theme

Use the theme toggle in the header to switch between:
- **Light** - Light mode
- **Dark** - Dark mode
- **Auto** - Follow system preference
    `
  },
  'updating': {
    title: 'Updating',
    content: `
## Updating

### Automatic Update Detection

The UI automatically checks npm for new versions. When an update is available, you'll see a notification in the Preferences page.

### Manual Update

\`\`\`bash
npm update -g @regression-io/claude-config
\`\`\`

Or for a clean reinstall:

\`\`\`bash
npm uninstall -g @regression-io/claude-config
npm install -g @regression-io/claude-config
\`\`\`

### After Updating

If you have the UI running as a daemon, restart it:

\`\`\`bash
claude-config ui stop
claude-config ui
\`\`\`
    `
  },
};
