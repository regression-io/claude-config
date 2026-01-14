#!/usr/bin/env node

/**
 * Claude Config CLI
 *
 * Configuration management for Claude Code
 * CLI-first with optional Web UI
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const command = args[0] || '';

// UI command needs special handling (starts web server with better error handling)
if (command === 'ui' || command === 'web' || command === 'server') {
  startUI();
} else {
  // Pass everything to config-loader.js
  const loaderPath = path.join(__dirname, 'config-loader.js');
  const child = spawn('node', [loaderPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });
}

function startUI() {
  // Parse UI-specific flags
  const flags = {
    port: 3333,
    dir: process.cwd()
  };

  for (let i = 1; i < args.length; i++) {
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
    } else if (arg === '--dir' || arg === '-d') {
      flags.dir = args[++i] || process.cwd();
    } else if (arg.startsWith('--dir=')) {
      flags.dir = arg.split('=')[1] || process.cwd();
    } else if (!arg.startsWith('-') && fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
      flags.dir = arg;
    }
  }

  // Validate port range
  if (flags.port < 1 || flags.port > 65535) {
    console.error('Error: Port must be between 1 and 65535');
    process.exit(1);
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

  flags.dir = path.resolve(flags.dir);

  // Load dependencies
  const serverPath = path.join(__dirname, 'ui', 'server.cjs');

  if (!fs.existsSync(serverPath)) {
    console.error('Error: UI server not found.');
    console.error('The package may not be installed correctly.');
    process.exit(1);
  }

  const distPath = path.join(__dirname, 'ui', 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('Error: UI build not found.');
    console.error('Run "npm run build" to build the UI first.');
    process.exit(1);
  }

  let ConfigUIServer, ClaudeConfigManager;
  try {
    ConfigUIServer = require(serverPath);
    ClaudeConfigManager = require('./config-loader.js');
  } catch (err) {
    console.error('Error: Failed to load dependencies');
    console.error(err.message);
    if (err.message.includes('node-pty')) {
      console.error('\nThe terminal feature requires node-pty which failed to load.');
      console.error('Try reinstalling: npm rebuild node-pty');
    }
    process.exit(1);
  }

  // Handle server errors
  process.on('uncaughtException', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nError: Port ${flags.port} is already in use.`);
      console.error(`Try a different port: claude-config ui --port ${flags.port + 1}`);
      process.exit(1);
    } else if (err.code === 'EACCES') {
      console.error(`\nError: Permission denied for port ${flags.port}.`);
      console.error('Ports below 1024 require elevated privileges.');
      process.exit(1);
    } else {
      console.error('\nUnexpected error:', err.message);
      process.exit(1);
    }
  });

  try {
    const manager = new ClaudeConfigManager();
    const server = new ConfigUIServer(flags.port, flags.dir, manager);
    server.start();
  } catch (err) {
    console.error('Error: Failed to start server');
    console.error(err.message);
    process.exit(1);
  }
}
