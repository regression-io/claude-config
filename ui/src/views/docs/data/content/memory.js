export const memoryContent = {
  'memory-overview': {
    title: 'Memory Overview',
    content: `
## Memory System

The memory system allows Claude to retain knowledge across sessions.

### Types of Memory

1. **Global Memory** (\`~/.claude/memory/\`)
   - Preferences - Your personal preferences
   - Corrections - Mistakes to avoid
   - Facts - Facts about your environment

2. **Project Memory** (\`project/.claude/memory/\`)
   - Context - Project overview
   - Patterns - Code patterns
   - Decisions - Architecture decisions
   - Issues - Known issues
   - History - Session history

### How It Works

Memory files are markdown documents that Claude reads at the start of each session, providing context and learned knowledge.
    `
  },
  'global-memory': {
    title: 'Global Memory',
    content: `
## Global Memory

Global memory applies to all your Claude interactions.

### Location

\`~/.claude/memory/\`

### Files

- **preferences.md** - Your coding preferences, tool choices, style preferences
- **corrections.md** - Things Claude got wrong that it should remember
- **facts.md** - Facts about your environment, setup, tools

### Example: preferences.md

\`\`\`markdown
# Preferences

## Code Style
- Use 2 spaces for indentation
- Prefer functional programming patterns
- Always add TypeScript types

## Tools
- Use pnpm instead of npm
- Prefer Vite over webpack
\`\`\`
    `
  },
  'project-memory': {
    title: 'Project Memory',
    content: `
## Project Memory

Project memory is specific to a single project.

### Location

\`project/.claude/memory/\`

### Files

- **context.md** - Project overview, tech stack, architecture
- **patterns.md** - Code patterns specific to this project
- **decisions.md** - Architectural decisions and rationale
- **issues.md** - Known issues and workarounds
- **history.md** - Log of work done in sessions

### Initializing Project Memory

In the Memory view, click "Initialize" to create memory files from templates.

### Example: context.md

\`\`\`markdown
# Project Context

## Overview
E-commerce platform built with Next.js and Prisma.

## Tech Stack
- Frontend: Next.js 14, React 18, Tailwind CSS
- Backend: Next.js API routes, Prisma ORM
- Database: PostgreSQL
- Auth: NextAuth.js

## Key Directories
- /app - Next.js app router pages
- /components - React components
- /lib - Utilities and helpers
\`\`\`
    `
  },
  'memory-entries': {
    title: 'Memory Entry Types',
    content: `
## Memory Entry Types

### Preference

User preferences for tools, style, and workflow.

\`\`\`markdown
## [Category]
- Preference description
- Another preference
\`\`\`

### Correction

Something Claude got wrong that should be remembered.

\`\`\`markdown
## [Topic]
- **Wrong**: What Claude did wrong
- **Right**: What to do instead
\`\`\`

### Pattern

A code pattern specific to the project.

\`\`\`markdown
## Pattern Name
Description of when to use this pattern.

\\\`\\\`\\\`typescript
// Code example
\\\`\\\`\\\`
\`\`\`

### Decision

An architectural decision with context.

\`\`\`markdown
## Decision Title
**Context**: Why this decision was needed
**Decision**: What was decided
**Rationale**: Why this was chosen
\`\`\`

### Issue

A known issue with workaround.

\`\`\`markdown
## Issue Title
**Problem**: Description of the issue
**Workaround**: How to work around it
\`\`\`
    `
  },
};
