# Claude Code Configuration - ZSH Shell Integration
# Add to ~/.zshrc:  source /path/to/claude-config.zsh

# =============================================================================
# CONFIGURATION
# =============================================================================

CLAUDE_CONFIG_LOADER="${CLAUDE_CONFIG_LOADER:-$HOME/.claude-config/config-loader.js}"
CLAUDE_CONFIG_AUTO_APPLY="${CLAUDE_CONFIG_AUTO_APPLY:-true}"
CLAUDE_CONFIG_VERBOSE="${CLAUDE_CONFIG_VERBOSE:-true}"
_CLAUDE_CONFIG_LAST_DIR=""

# =============================================================================
# MAIN COMMAND - Pass everything to Node
# =============================================================================

claude-config() {
  if [[ ! -f "$CLAUDE_CONFIG_LOADER" ]]; then
    echo "Error: config-loader.js not found at $CLAUDE_CONFIG_LOADER"
    return 1
  fi

  # Special case: auto on/off is shell-only
  if [[ "$1" == "auto" ]]; then
    case "$2" in
      on)  CLAUDE_CONFIG_AUTO_APPLY="true"; echo "Auto-apply enabled" ;;
      off) CLAUDE_CONFIG_AUTO_APPLY="false"; echo "Auto-apply disabled" ;;
      *)   echo "Auto-apply is: $CLAUDE_CONFIG_AUTO_APPLY" ;;
    esac
    return
  fi

  # Pass all other commands to Node
  node "$CLAUDE_CONFIG_LOADER" "$@"
}

# =============================================================================
# AUTO-APPLY HOOK
# =============================================================================

_claude_config_chpwd_hook() {
  [[ "$CLAUDE_CONFIG_AUTO_APPLY" != "true" ]] && return
  [[ "$PWD" == "$_CLAUDE_CONFIG_LAST_DIR" ]] && return

  local check_dir="$PWD"
  local found_config=""

  # Find nearest .claude/mcps.json
  while [[ "$check_dir" != "/" ]]; do
    if [[ -f "$check_dir/.claude/mcps.json" ]]; then
      found_config="$check_dir"
      break
    fi
    check_dir="$(dirname "$check_dir")"
  done

  if [[ -n "$found_config" && "$found_config" != "$_CLAUDE_CONFIG_LAST_DIR" ]]; then
    _CLAUDE_CONFIG_LAST_DIR="$found_config"

    # Check if .mcp.json needs updating
    local config_mtime=$(stat -f %m "$found_config/.claude/mcps.json" 2>/dev/null || stat -c %Y "$found_config/.claude/mcps.json" 2>/dev/null)
    local mcp_mtime=$(stat -f %m "$found_config/.mcp.json" 2>/dev/null || stat -c %Y "$found_config/.mcp.json" 2>/dev/null || echo "0")

    if [[ "$config_mtime" -gt "$mcp_mtime" ]] || [[ ! -f "$found_config/.mcp.json" ]]; then
      [[ "$CLAUDE_CONFIG_VERBOSE" == "true" ]] && echo "🔄 Applying Claude config..."
      (cd "$found_config" && node "$CLAUDE_CONFIG_LOADER" apply > /dev/null 2>&1)
      if [[ "$CLAUDE_CONFIG_VERBOSE" == "true" ]]; then
        local mcp_count=$(grep -c '"command"' "$found_config/.mcp.json" 2>/dev/null || echo "0")
        echo "✓ Loaded $mcp_count MCPs"
      fi
    fi
  fi
}

autoload -Uz add-zsh-hook
add-zsh-hook chpwd _claude_config_chpwd_hook

# Completions
_claude_config_completions() {
  local -a commands
  commands=(
    'init:Initialize project with template'
    'apply:Generate .mcp.json from config'
    'apply-template:Add template to existing project'
    'show:Show current project config'
    'list:List available MCPs'
    'templates:List available templates'
    'add:Add MCP(s) to project'
    'remove:Remove MCP(s) from project'
    'registry-add:Add MCP to global registry'
    'registry-remove:Remove MCP from registry'
    'update:Update from source directory'
    'version:Show version info'
    'auto:Toggle auto-apply on cd'
  )
  _describe 'command' commands
}
compdef _claude_config_completions claude-config

# Run on shell start
_claude_config_chpwd_hook
