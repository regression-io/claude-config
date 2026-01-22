/**
 * MCP Server Discovery Routes
 *
 * Connects to MCP servers and discovers their available tools.
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Cache for discovered tools (serverName -> { tools, timestamp })
const toolsCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Send a JSON-RPC message to an MCP server via stdio
 */
function sendMessage(proc, method, params = {}, id = 1) {
  const message = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  proc.stdin.write(JSON.stringify(message) + '\n');
}

/**
 * Parse JSON-RPC responses from stdout
 */
function parseResponses(data) {
  const responses = [];
  const lines = data.toString().split('\n').filter(l => l.trim());

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.jsonrpc === '2.0') {
        responses.push(parsed);
      }
    } catch (e) {
      // Skip non-JSON lines (could be server logs)
    }
  }

  return responses;
}

/**
 * Expand environment variables in a string
 */
function expandEnv(str, env = {}) {
  if (typeof str !== 'string') return str;

  // Combine process env with custom env
  const fullEnv = { ...process.env, ...env };

  return str.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, p1, p2) => {
    const varName = p1 || p2;
    return fullEnv[varName] || match;
  });
}

/**
 * Discover tools from a stdio-based MCP server
 */
async function discoverStdioTools(serverName, config) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout waiting for server response'));
    }, 10000); // 10 second timeout

    // Expand environment variables in command and args
    const command = expandEnv(config.command, config.env);
    const args = (config.args || []).map(arg => expandEnv(arg, config.env));

    // Prepare environment
    const env = { ...process.env };
    if (config.env) {
      for (const [key, value] of Object.entries(config.env)) {
        env[key] = expandEnv(value, config.env);
      }
    }

    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      cwd: config.cwd || os.homedir(),
      shell: process.platform === 'win32'
    });

    let stdout = '';
    let stderr = '';
    let initialized = false;
    let toolsReceived = false;

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      const responses = parseResponses(data);

      for (const response of responses) {
        if (response.id === 1 && !initialized) {
          // Initialize response received, now request tools
          initialized = true;
          sendMessage(proc, 'tools/list', {}, 2);
        } else if (response.id === 2 && !toolsReceived) {
          // Tools list response
          toolsReceived = true;
          clearTimeout(timeout);
          proc.kill();

          const tools = response.result?.tools || [];
          resolve(tools.map(t => ({
            name: t.name,
            description: t.description || '',
            inputSchema: t.inputSchema
          })));
        }
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn server: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (!toolsReceived) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}. stderr: ${stderr.slice(0, 200)}`));
      }
    });

    // Send initialize request
    sendMessage(proc, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'claude-config-ui',
        version: '1.0.0'
      }
    }, 1);
  });
}

/**
 * Discover tools from an SSE-based MCP server
 */
async function discoverSseTools(serverName, config) {
  // SSE servers are more complex - they require establishing an event stream
  // For now, return empty and note that SSE discovery is not yet supported
  return [];
}

/**
 * Get tools for a specific MCP server
 */
async function getServerTools(manager, serverName) {
  // Check cache first
  const cached = toolsCache.get(serverName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { serverName, tools: cached.tools, cached: true };
  }

  // Get registry
  const registry = manager.loadJson(manager.registryPath) || { mcpServers: {} };
  const config = registry.mcpServers?.[serverName];

  if (!config) {
    return { serverName, error: 'Server not found in registry' };
  }

  try {
    let tools;

    if (config.command) {
      // stdio server
      tools = await discoverStdioTools(serverName, config);
    } else if (config.url) {
      // SSE server
      tools = await discoverSseTools(serverName, config);
    } else {
      return { serverName, error: 'Unknown server type' };
    }

    // Cache the result
    toolsCache.set(serverName, { tools, timestamp: Date.now() });

    return { serverName, tools, cached: false };
  } catch (err) {
    return { serverName, error: err.message };
  }
}

/**
 * Get tools for all MCP servers
 */
async function getAllServerTools(manager) {
  const registry = manager.loadJson(manager.registryPath) || { mcpServers: {} };
  const serverNames = Object.keys(registry.mcpServers || {});

  const results = await Promise.all(
    serverNames.map(name => getServerTools(manager, name))
  );

  return results.reduce((acc, result) => {
    acc[result.serverName] = result.error
      ? { error: result.error }
      : { tools: result.tools, cached: result.cached };
    return acc;
  }, {});
}

/**
 * Clear the tools cache
 */
function clearCache(serverName = null) {
  if (serverName) {
    toolsCache.delete(serverName);
  } else {
    toolsCache.clear();
  }
  return { success: true };
}

module.exports = {
  getServerTools,
  getAllServerTools,
  clearCache
};
