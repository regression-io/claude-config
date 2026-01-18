/**
 * Plugins Routes
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

/**
 * Get plugins directory path
 */
function getPluginsDir() {
  return path.join(os.homedir(), '.claude', 'plugins');
}

/**
 * Get all plugins
 */
function getPlugins(manager) {
  const pluginsDir = getPluginsDir();
  const installedPath = path.join(pluginsDir, 'installed_plugins.json');
  const marketplacesPath = path.join(pluginsDir, 'known_marketplaces.json');

  // Load installed plugins
  let installed = {};
  if (fs.existsSync(installedPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(installedPath, 'utf8'));
      installed = data.plugins || {};
    } catch (e) {}
  }

  // Load marketplaces and their plugins
  const marketplaces = [];
  const allPlugins = [];
  const categories = new Set();

  if (fs.existsSync(marketplacesPath)) {
    try {
      const known = JSON.parse(fs.readFileSync(marketplacesPath, 'utf8'));
      for (const [name, info] of Object.entries(known)) {
        const marketplace = {
          name,
          source: info.source,
          installLocation: info.installLocation,
          lastUpdated: info.lastUpdated,
          plugins: [],
          externalPlugins: []
        };

        // Track plugin names from manifest to avoid duplicates
        const manifestPluginNames = new Set();

        // Load marketplace manifest for plugins
        const manifestPath = path.join(info.installLocation, '.claude-plugin', 'marketplace.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            marketplace.description = manifest.description;
            marketplace.owner = manifest.owner;
            marketplace.plugins = (manifest.plugins || []).map(p => {
              if (p.category) categories.add(p.category);
              manifestPluginNames.add(p.name);
              const isExternal = p.source?.includes('external_plugins');
              const plugin = {
                ...p,
                marketplace: name,
                sourceType: isExternal ? 'external' : 'internal',
                installed: !!installed[`${p.name}@${name}`],
                installedInfo: installed[`${p.name}@${name}`]?.[0] || null
              };
              allPlugins.push(plugin);
              return plugin;
            });
          } catch (e) {}
        }

        // Load external plugins by scanning external_plugins directory
        const externalDir = path.join(info.installLocation, 'external_plugins');
        if (fs.existsSync(externalDir)) {
          try {
            const externals = fs.readdirSync(externalDir, { withFileTypes: true })
              .filter(d => d.isDirectory())
              .map(d => d.name);

            for (const pluginName of externals) {
              if (manifestPluginNames.has(pluginName)) continue;

              const pluginManifestPath = path.join(externalDir, pluginName, '.claude-plugin', 'plugin.json');
              if (fs.existsSync(pluginManifestPath)) {
                try {
                  const pluginManifest = JSON.parse(fs.readFileSync(pluginManifestPath, 'utf8'));
                  if (manifestPluginNames.has(pluginManifest.name)) continue;

                  if (pluginManifest.category) categories.add(pluginManifest.category);
                  const plugin = {
                    name: pluginManifest.name || pluginName,
                    description: pluginManifest.description || '',
                    version: pluginManifest.version || '1.0.0',
                    author: pluginManifest.author,
                    category: pluginManifest.category || 'external',
                    homepage: pluginManifest.homepage,
                    mcpServers: pluginManifest.mcpServers,
                    lspServers: pluginManifest.lspServers,
                    commands: pluginManifest.commands,
                    marketplace: name,
                    sourceType: 'external',
                    installed: !!installed[`${pluginManifest.name || pluginName}@${name}`],
                    installedInfo: installed[`${pluginManifest.name || pluginName}@${name}`]?.[0] || null
                  };
                  marketplace.externalPlugins.push(plugin);
                  allPlugins.push(plugin);
                } catch (e) {}
              }
            }
          } catch (e) {}
        }

        marketplaces.push(marketplace);
      }
    } catch (e) {}
  }

  return {
    installed,
    marketplaces,
    allPlugins,
    categories: Array.from(categories).sort(),
    pluginsDir
  };
}

/**
 * Get marketplaces
 */
function getMarketplaces() {
  const pluginsDir = getPluginsDir();
  const marketplacesPath = path.join(pluginsDir, 'known_marketplaces.json');

  if (fs.existsSync(marketplacesPath)) {
    try {
      return JSON.parse(fs.readFileSync(marketplacesPath, 'utf8'));
    } catch (e) {}
  }
  return {};
}

/**
 * Install a plugin
 */
async function installPlugin(pluginId, marketplace, scope = 'user', projectDir = null) {
  const args = ['plugin', 'install', `${pluginId}@${marketplace}`];
  if (scope && scope !== 'user') {
    args.push('--scope', scope);
  }
  return new Promise((resolve) => {
    const proc = spawn('claude', args, {
      cwd: projectDir || os.homedir(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: stdout || 'Plugin installed' });
      } else {
        resolve({ success: false, error: stderr || stdout || 'Installation failed' });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Uninstall a plugin
 */
async function uninstallPlugin(pluginId) {
  return new Promise((resolve) => {
    const proc = spawn('claude', ['plugin', 'uninstall', pluginId], {
      cwd: os.homedir(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: stdout || 'Plugin uninstalled' });
      } else {
        resolve({ success: false, error: stderr || stdout || 'Uninstallation failed' });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Add a marketplace
 */
async function addMarketplace(name, repo) {
  return new Promise((resolve) => {
    const proc = spawn('claude', ['plugin', 'marketplace', 'add', repo], {
      cwd: os.homedir(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: stdout || 'Marketplace added' });
      } else {
        resolve({ success: false, error: stderr || stdout || 'Failed to add marketplace' });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Refresh a marketplace
 */
async function refreshMarketplace(name) {
  return new Promise((resolve) => {
    const proc = spawn('claude', ['plugin', 'marketplace', 'update', name], {
      cwd: os.homedir(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: stdout || 'Marketplace refreshed' });
      } else {
        resolve({ success: false, error: stderr || stdout || 'Failed to refresh marketplace' });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

module.exports = {
  getPluginsDir,
  getPlugins,
  getMarketplaces,
  installPlugin,
  uninstallPlugin,
  addMarketplace,
  refreshMarketplace,
};
