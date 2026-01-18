/**
 * Core utility functions
 */

const fs = require('fs');
const path = require('path');

/**
 * Load JSON file
 */
function loadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Save JSON file
 */
function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Load environment variables from .env file
 */
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const envVars = {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    }
  }
  return envVars;
}

/**
 * Interpolate ${VAR} in object values
 */
function interpolate(obj, env) {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return env[varName] || process.env[varName] || match;
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(v => interpolate(v, env));
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = interpolate(v, env);
    }
    return result;
  }
  return obj;
}

/**
 * Resolve ${VAR} to actual values (for tools that don't support interpolation)
 */
function resolveEnvVars(obj, env) {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const value = env[varName] || process.env[varName];
      if (!value) {
        console.warn(`Warning: Environment variable ${varName} not set`);
        return '';
      }
      return value;
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(v => resolveEnvVars(v, env));
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = resolveEnvVars(value, env);
    }
    return result;
  }
  return obj;
}

/**
 * Recursively copy directory
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = {
  loadJson,
  saveJson,
  loadEnvFile,
  interpolate,
  resolveEnvVars,
  copyDirRecursive,
};
