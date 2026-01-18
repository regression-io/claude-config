/**
 * MCP Registry Routes
 */

const fs = require('fs');
const path = require('path');

/**
 * Get MCP registry
 */
function getRegistry(manager) {
  return manager.loadJson(manager.registryPath) || { mcpServers: {} };
}

/**
 * Update MCP registry
 */
function updateRegistry(manager, body) {
  try {
    manager.saveJson(manager.registryPath, body);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = {
  getRegistry,
  updateRegistry,
};
