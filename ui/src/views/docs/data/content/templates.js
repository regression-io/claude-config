export const templatesContent = {
  'using-templates': {
    title: 'Using Templates',
    content: `
## Using Templates

Templates provide pre-configured rules and settings for different project types.

### Applying Templates

**Via UI:**
1. Go to **Templates** in the sidebar
2. Select a template
3. Click "Apply to Project"

**Via CLI:**
\`\`\`bash
claude-config init --template fastapi
claude-config apply-template react-ts
\`\`\`

### What Templates Include

- Rules for the technology/framework
- Best practices
- Common patterns
- Style guidelines
    `
  },
  'available-templates': {
    title: 'Available Templates',
    content: `
## Available Templates

### Languages

- **python** - Python general
- **typescript** - TypeScript general
- **javascript** - JavaScript general

### Frameworks

- **fastapi** - Python FastAPI
- **react-ts** - React with TypeScript
- **react-js** - React with JavaScript
- **python-cli** - Python CLI apps
- **mcp-python** - MCP server in Python

### Composites

- **fastapi-react-ts** - Full-stack FastAPI + React TypeScript
- **fastapi-react-js** - Full-stack FastAPI + React JavaScript

### Universal

- **universal** - Common rules for any project
    `
  },
  'custom-templates': {
    title: 'Custom Templates',
    content: `
## Custom Templates

### Creating Custom Templates

Templates are stored in the templates directory. To create a custom template:

1. Create a directory in \`~/.claude-config/templates/\`
2. Add a \`template.json\` manifest
3. Add rules in a \`rules/\` subdirectory

### Template Structure

\`\`\`
my-template/
├── template.json
└── rules/
    ├── style.md
    └── patterns.md
\`\`\`

### template.json

\`\`\`json
{
  "name": "My Template",
  "description": "Custom template for my projects",
  "category": "custom"
}
\`\`\`
    `
  },
};
