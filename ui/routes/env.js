/**
 * Env Routes
 */

const fs = require('fs');
const path = require('path');

/**
 * Get env file for a directory
 */
function getEnv(dir, projectDir) {
  const targetDir = dir || projectDir;
  const envPath = path.join(targetDir, '.claude', '.env');

  if (fs.existsSync(envPath)) {
    return { content: fs.readFileSync(envPath, 'utf8'), path: envPath };
  }
  return { content: '', path: envPath };
}

/**
 * Save env file
 */
function saveEnv(body) {
  const { dir, content } = body;
  const envPath = path.join(dir, '.claude', '.env');
  const claudeDir = path.dirname(envPath);

  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  fs.writeFileSync(envPath, content);
  return { success: true };
}

module.exports = {
  getEnv,
  saveEnv,
};
