/**
 * Rules Routes
 */

const fs = require('fs');
const path = require('path');

/**
 * Get all rules
 */
function getRules(manager, projectDir) {
  const configs = manager.findAllConfigs(projectDir);
  return manager.collectFilesFromHierarchy(configs, 'rules');
}

/**
 * Get a single rule
 */
function getRule(fullPath) {
  try {
    return { content: fs.readFileSync(fullPath, 'utf8') };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Save a rule
 */
function saveRule(body) {
  try {
    fs.writeFileSync(body.path, body.content);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Create a rule
 */
function createRule(body, projectDir) {
  try {
    const dir = body.dir || path.join(projectDir, '.claude', 'rules');
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
 * Delete a rule
 */
function deleteRule(fullPath) {
  try {
    fs.unlinkSync(fullPath);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = {
  getRules,
  getRule,
  saveRule,
  createRule,
  deleteRule,
};
