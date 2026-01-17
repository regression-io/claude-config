#!/bin/bash
# Workstream Rule Injection Hook for Claude Code
#
# This hook injects the active workstream's rules into every Claude session.
#
# Installation:
#   1. Copy this file to ~/.claude/hooks/pre-prompt.sh (or add to existing)
#   2. Make it executable: chmod +x ~/.claude/hooks/pre-prompt.sh
#   3. Set active workstream: claude-config workstream use "My Workstream"
#
# The rules will be prepended to Claude's context automatically.

# Check if claude-config is available
if ! command -v claude-config &> /dev/null; then
    exit 0
fi

# Inject workstream rules silently
# The --silent flag suppresses "No active workstream" messages
claude-config workstream inject --silent
