/**
 * Commands Routes
 */

const fs = require('fs');
const path = require('path');

/**
 * Get all commands
 */
function getCommands(manager, projectDir) {
  const configs = manager.findAllConfigs(projectDir);
  return manager.collectFilesFromHierarchy(configs, 'commands');
}

/**
 * Get a single command
 */
function getCommand(fullPath) {
  try {
    return { content: fs.readFileSync(fullPath, 'utf8') };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Save a command
 */
function saveCommand(body) {
  try {
    fs.writeFileSync(body.path, body.content);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Create a command
 */
function createCommand(body, projectDir) {
  try {
    const dir = body.dir || path.join(projectDir, '.claude', 'commands');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, body.name);
    fs.writeFileSync(filePath, body.content || '');
    return { success: true, path: filePath };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Delete a command
 */
function deleteCommand(fullPath) {
  try {
    fs.unlinkSync(fullPath);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = {
  getCommands,
  getCommand,
  saveCommand,
  createCommand,
  deleteCommand,
};
