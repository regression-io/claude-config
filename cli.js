#!/usr/bin/env node

/**
 * Claude Config CLI
 *
 * Configuration management tool for Claude Code
 * Manage MCPs, rules, commands, memory, and .claude folders
 */

const path = require('path');
const fs = require('fs');

const VERSION = '1.0.0';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'ui';

// Parse flags
const flags = {
  port: 3333,
  help: false,
  version: false,
  dir: process.cwd()
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--port' || arg === '-p') {
    const portArg = args[++i];
    if (!portArg || isNaN(parseInt(portArg))) {
      console.error('Error: --port requires a valid port number');
      process.exit(1);
    }
    flags.port = parseInt(portArg);
  } else if (arg.startsWith('--port=')) {
    const portVal = parseInt(arg.split('=')[1]);
    if (isNaN(portVal)) {
      console.error('Error: --port requires a valid port number');
      process.exit(1);
    }
    flags.port = portVal;
  } else if (arg === '--help' || arg === '-h') {
    flags.help = true;
  } else if (arg === '--version' || arg === '-v') {
    flags.version = true;
  } else if (arg === '--dir' || arg === '-d') {
    flags.dir = args[++i] || process.cwd();
  } else if (arg.startsWith('--dir=')) {
    flags.dir = arg.split('=')[1] || process.cwd();
  }
}

// Validate port range
if (flags.port < 1 || flags.port > 65535) {
  console.error('Error: Port must be between 1 and 65535');
  process.exit(1);
}

// Show version
if (flags.version) {
  console.log(`claude-config v${VERSION}`);
  process.exit(0);
}

// Show help
if (flags.help || command === 'help') {
  console.log(`
Claude Config v${VERSION}
Configuration management UI for Claude Code

Usage:
  claude-config [command] [options]

Commands:
  ui          Start the web UI (default)
  display     Show current configuration
  init        Initialize .claude folder in current directory
  help        Show this help message

Options:
  -p, --port <port>   Port for web UI (default: 3333)
  -d, --dir <path>    Project directory (default: current)
  -h, --help          Show help
  -v, --version       Show version

Examples:
  claude-config                    # Start UI on port 3333
  claude-config ui --port 8080     # Start UI on port 8080
  claude-config display            # Show current config
  claude-config init               # Initialize project

Documentation: https://github.com/regression-io/claude-config
`);
  process.exit(0);
}

// Validate directory exists
if (!fs.existsSync(flags.dir)) {
  console.error(`Error: Directory not found: ${flags.dir}`);
  process.exit(1);
}

if (!fs.statSync(flags.dir).isDirectory()) {
  console.error(`Error: Not a directory: ${flags.dir}`);
  process.exit(1);
}

// Resolve to absolute path
flags.dir = path.resolve(flags.dir);

// Load the config manager
let ClaudeConfigManager;
try {
  ClaudeConfigManager = require('./config-loader.js');
} catch (err) {
  console.error('Error: Failed to load config manager');
  console.error(err.message);
  process.exit(1);
}

// Execute command
switch (command) {
  case 'ui':
  case 'web':
  case 'server':
    startUI();
    break;

  case 'display':
  case 'show':
    displayConfig();
    break;

  case 'init':
    initProject();
    break;

  default:
    // Check if it's a directory path (run UI for that dir)
    if (fs.existsSync(command) && fs.statSync(command).isDirectory()) {
      flags.dir = path.resolve(command);
      startUI();
    } else {
      console.error(`Unknown command: ${command}`);
      console.log('Run "claude-config --help" for usage');
      process.exit(1);
    }
}

function startUI() {
  const serverPath = path.join(__dirname, 'ui', 'server.cjs');

  if (!fs.existsSync(serverPath)) {
    console.error('Error: UI server not found.');
    console.error('The package may not be installed correctly.');
    console.error(`Expected: ${serverPath}`);
    process.exit(1);
  }

  // Check if dist exists
  const distPath = path.join(__dirname, 'ui', 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('Error: UI build not found.');
    console.error('Run "npm run build" to build the UI first.');
    process.exit(1);
  }

  let ConfigUIServer;
  try {
    ConfigUIServer = require(serverPath);
  } catch (err) {
    console.error('Error: Failed to load UI server');
    console.error(err.message);

    // Check for common issues
    if (err.message.includes('node-pty')) {
      console.error('\nThe terminal feature requires node-pty which failed to load.');
      console.error('Try reinstalling: npm rebuild node-pty');
    }
    process.exit(1);
  }

  let manager;
  try {
    manager = new ClaudeConfigManager();
  } catch (err) {
    console.error('Error: Failed to initialize config manager');
    console.error(err.message);
    process.exit(1);
  }

  const server = new ConfigUIServer(flags.port, flags.dir, manager);

  // Handle server errors
  process.on('uncaughtException', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nError: Port ${flags.port} is already in use.`);
      console.error(`Try a different port: claude-config --port ${flags.port + 1}`);
      process.exit(1);
    } else if (err.code === 'EACCES') {
      console.error(`\nError: Permission denied for port ${flags.port}.`);
      console.error('Ports below 1024 require elevated privileges.');
      console.error('Try a port above 1024: claude-config --port 3333');
      process.exit(1);
    } else {
      console.error('\nUnexpected error:', err.message);
      process.exit(1);
    }
  });

  try {
    server.start();
  } catch (err) {
    console.error('Error: Failed to start server');
    console.error(err.message);
    process.exit(1);
  }
}

function displayConfig() {
  let manager;
  try {
    manager = new ClaudeConfigManager();
  } catch (err) {
    console.error('Error: Failed to load config manager');
    console.error(err.message);
    process.exit(1);
  }

  console.log('\n=== Claude Config ===\n');
  console.log(`Project: ${flags.dir}`);

  // Find all configs in hierarchy
  let configs;
  try {
    configs = manager.findAllConfigs(flags.dir);
  } catch (err) {
    console.error('Error reading configs:', err.message);
    process.exit(1);
  }

  if (configs.length === 0) {
    console.log('\nNo .claude configurations found.');
    console.log('Run "claude-config init" to initialize.\n');
    return;
  }

  console.log(`\nFound ${configs.length} config level(s):\n`);

  for (const config of configs) {
    const label = config.dir === process.env.HOME ? '~' : path.relative(flags.dir, config.dir) || '.';
    console.log(`  ${label}/`);
    console.log(`    Config: ${config.configPath}`);

    if (config.config && config.config.mcpServers) {
      const mcps = Object.keys(config.config.mcpServers);
      if (mcps.length > 0) {
        console.log(`    MCPs: ${mcps.join(', ')}`);
      }
    }
    console.log();
  }
}

function initProject() {
  const claudeDir = path.join(flags.dir, '.claude');

  if (fs.existsSync(claudeDir)) {
    console.log('.claude folder already exists at', claudeDir);
    console.log('Run "claude-config" to manage it.');
    return;
  }

  try {
    // Create .claude structure
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(path.join(claudeDir, 'rules'), { recursive: true });
    fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });

    // Create default mcps.json
    const mcpsJson = {
      mcpServers: {}
    };
    fs.writeFileSync(
      path.join(claudeDir, 'mcps.json'),
      JSON.stringify(mcpsJson, null, 2) + '\n'
    );

    // Create default settings.json
    const settingsJson = {};
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify(settingsJson, null, 2) + '\n'
    );

    console.log(`\nInitialized .claude folder in ${flags.dir}\n`);
    console.log('Created:');
    console.log('  .claude/');
    console.log('  .claude/mcps.json');
    console.log('  .claude/settings.json');
    console.log('  .claude/rules/');
    console.log('  .claude/commands/');
    console.log('\nRun "claude-config" to open the UI.');
  } catch (err) {
    console.error('Error initializing .claude folder:', err.message);
    process.exit(1);
  }
}
