#!/usr/bin/env node

/**
 * Post-install script for claude-config
 * Sets up default configuration if not present
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const home = os.homedir();
const claudeDir = path.join(home, '.claude');
const configPath = path.join(claudeDir, 'config.json');

// Default configuration
const defaultConfig = {
  toolsDir: path.join(home, 'mcp-tools'),
  registryPath: path.join(claudeDir, 'registry.json'),
  ui: {
    port: 3333,
    openBrowser: true
  }
};

// Create ~/.claude if it doesn't exist
if (!fs.existsSync(claudeDir)) {
  fs.mkdirSync(claudeDir, { recursive: true });
  console.log('Created ~/.claude directory');
}

// Create config.json if it doesn't exist
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + '\n');
  console.log('Created ~/.claude/config.json with defaults');
  console.log(`  Tools directory: ${defaultConfig.toolsDir}`);
}

// Create default registry if it doesn't exist
const registryPath = path.join(claudeDir, 'registry.json');
if (!fs.existsSync(registryPath)) {
  const defaultRegistry = {
    mcpServers: {}
  };
  fs.writeFileSync(registryPath, JSON.stringify(defaultRegistry, null, 2) + '\n');
  console.log('Created ~/.claude/registry.json');
}

// Test and rebuild node-pty if needed (prebuilds may not match Node version)
function testNodePty() {
  const { execFileSync } = require('child_process');
  // Use subprocess to avoid require cache issues
  const testScript = `
    try {
      const pty = require('node-pty');
      const p = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : '/bin/sh', ['-c', 'exit 0']);
      p.kill();
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  `;
  try {
    execFileSync(process.execPath, ['-e', testScript], {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore'
    });
    return true;
  } catch (e) {
    return false;
  }
}

function rebuildNodePty() {
  const { execFileSync } = require('child_process');
  const nodePtyPath = path.join(__dirname, '..', 'node_modules', 'node-pty');

  if (!fs.existsSync(nodePtyPath)) {
    console.log('node-pty not installed, skipping rebuild check');
    return;
  }

  console.log('Testing node-pty compatibility...');

  if (testNodePty()) {
    console.log('node-pty working correctly');
    return;
  }

  console.log('node-pty prebuild incompatible with Node ' + process.version);
  console.log('Rebuilding from source (this may take a minute)...');

  try {
    // Use npm rebuild with build-from-source env var
    execFileSync('npm', ['rebuild', 'node-pty'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, npm_config_build_from_source: 'true' }
    });

    if (testNodePty()) {
      console.log('node-pty rebuilt successfully');
    } else {
      console.warn('Warning: node-pty rebuild may have failed. Terminal features may not work.');
      console.warn('Try: cd node_modules/node-pty && npm install --build-from-source');
    }
  } catch (e) {
    console.warn('Warning: Could not rebuild node-pty:', e.message);
    console.warn('Terminal features may not work. You may need build tools installed.');
  }
}

rebuildNodePty();

console.log('\nClaude Config installed successfully!');
console.log('Run "claude-config" to start the UI.\n');
