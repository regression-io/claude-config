/**
 * MCP Registry management commands
 */

const { loadJson, saveJson } = require('./utils');

/**
 * Add MCP to global registry
 */
function registryAdd(registryPath, name, configJson) {
  if (!name || !configJson) {
    console.error('Usage: claude-config registry-add <name> \'{"command":"...","args":[...]}\'');
    return false;
  }

  let mcpConfig;
  try {
    mcpConfig = JSON.parse(configJson);
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    return false;
  }

  const registry = loadJson(registryPath) || { mcpServers: {} };
  registry.mcpServers[name] = mcpConfig;
  saveJson(registryPath, registry);

  console.log(`✓ Added "${name}" to registry`);
  return true;
}

/**
 * Remove MCP from global registry
 */
function registryRemove(registryPath, name) {
  if (!name) {
    console.error('Usage: claude-config registry-remove <name>');
    return false;
  }

  const registry = loadJson(registryPath);
  if (!registry?.mcpServers?.[name]) {
    console.error(`"${name}" not found in registry`);
    return false;
  }

  delete registry.mcpServers[name];
  saveJson(registryPath, registry);

  console.log(`✓ Removed "${name}" from registry`);
  return true;
}

module.exports = {
  registryAdd,
  registryRemove,
};
