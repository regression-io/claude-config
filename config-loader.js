#!/usr/bin/env node

/**
 * Claude Code Configuration Loader
 *
 * Uses standard JSON format throughout - no custom YAML.
 * Copy/paste MCP configs from anywhere.
 *
 * Files:
 *   ~/.claude-config/mcp-registry.json   - All available MCPs (copy/paste friendly)
 *   ~/.claude-config/templates/          - Rule and command templates
 *   project/.claude/mcps.json            - Which MCPs this project uses
 *   project/.claude/rules/*.md           - Project rules (from templates)
 *   project/.claude/commands/*.md        - Project commands (from templates)
 *   project/.mcp.json                    - Generated output for Claude Code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = '2.12.0';

class ClaudeConfigManager {
  constructor() {
    this.installDir = process.env.CLAUDE_CONFIG_HOME || path.join(process.env.HOME || '', '.claude-config');

    // Look for registry in multiple places
    const possiblePaths = [
      path.join(__dirname, 'shared', 'mcp-registry.json'),
      path.join(__dirname, 'mcp-registry.json'),
      path.join(this.installDir, 'shared', 'mcp-registry.json')
    ];
    this.registryPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

    // Template directory
    const templatePaths = [
      path.join(__dirname, 'templates'),
      path.join(this.installDir, 'templates')
    ];
    this.templatesDir = templatePaths.find(p => fs.existsSync(p)) || templatePaths[0];
  }

  /**
   * Load JSON file
   */
  loadJson(filePath) {
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
  saveJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  }

  /**
   * Load environment variables from .env file
   */
  loadEnvFile(envPath) {
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
  interpolate(obj, env) {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return env[varName] || process.env[varName] || match;
      });
    }
    if (Array.isArray(obj)) {
      return obj.map(v => this.interpolate(v, env));
    }
    if (obj !== null && typeof obj === 'object') {
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = this.interpolate(v, env);
      }
      return result;
    }
    return obj;
  }

  /**
   * Find project root (has .claude/ directory)
   */
  findProjectRoot(startDir = process.cwd()) {
    let dir = path.resolve(startDir);
    const root = path.parse(dir).root;
    while (dir !== root) {
      if (fs.existsSync(path.join(dir, '.claude'))) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    return null;
  }

  /**
   * Find ALL .claude/mcps.json configs from cwd up to root (and ~/.claude)
   * Returns array from root to leaf (so child overrides parent when merged)
   */
  findAllConfigs(startDir = process.cwd()) {
    const configs = [];
    let dir = path.resolve(startDir);
    const root = path.parse(dir).root;
    const homeDir = process.env.HOME || '';

    // Walk up directory tree
    while (dir !== root) {
      const configPath = path.join(dir, '.claude', 'mcps.json');
      if (fs.existsSync(configPath)) {
        configs.unshift({ dir, configPath }); // Add at beginning (root first)
      }
      dir = path.dirname(dir);
    }

    // Also check ~/.claude/mcps.json (global user config)
    const homeConfig = path.join(homeDir, '.claude', 'mcps.json');
    if (fs.existsSync(homeConfig)) {
      // Only add if not already included
      if (!configs.some(c => c.configPath === homeConfig)) {
        configs.unshift({ dir: homeDir, configPath: homeConfig });
      }
    }

    return configs;
  }

  /**
   * Merge multiple configs (later ones override earlier)
   */
  mergeConfigs(configs) {
    const merged = {
      include: [],
      mcpServers: {},
      template: null
    };

    for (const { config } of configs) {
      if (!config) continue;

      // Merge include arrays (dedupe)
      if (config.include && Array.isArray(config.include)) {
        for (const mcp of config.include) {
          if (!merged.include.includes(mcp)) {
            merged.include.push(mcp);
          }
        }
      }

      // Merge mcpServers (override)
      if (config.mcpServers) {
        Object.assign(merged.mcpServers, config.mcpServers);
      }

      // Take the most specific template
      if (config.template) {
        merged.template = config.template;
      }
    }

    return merged;
  }

  /**
   * Get project config path
   */
  getConfigPath(projectDir = null) {
    const dir = projectDir || this.findProjectRoot() || process.cwd();
    return path.join(dir, '.claude', 'mcps.json');
  }

  /**
   * Collect files (rules or commands) from all directories in hierarchy
   * Returns array of { file, source, fullPath } with child files overriding parent
   */
  collectFilesFromHierarchy(configLocations, subdir) {
    const fileMap = new Map(); // filename -> { file, source, fullPath }

    // Process from root to leaf (so child overrides parent)
    for (const { dir } of configLocations) {
      const dirPath = path.join(dir, '.claude', subdir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
        for (const file of files) {
          fileMap.set(file, {
            file,
            source: dir,
            fullPath: path.join(dirPath, file)
          });
        }
      }
    }

    return Array.from(fileMap.values());
  }

  /**
   * Get all rules from hierarchy (for external use)
   */
  getAllRules(startDir = process.cwd()) {
    const configLocations = this.findAllConfigs(startDir);
    return this.collectFilesFromHierarchy(configLocations, 'rules');
  }

  /**
   * Get all commands from hierarchy (for external use)
   */
  getAllCommands(startDir = process.cwd()) {
    const configLocations = this.findAllConfigs(startDir);
    return this.collectFilesFromHierarchy(configLocations, 'commands');
  }

  // ===========================================================================
  // TEMPLATE SYSTEM
  // ===========================================================================

  /**
   * List available templates
   */
  listTemplates() {
    console.log('\n📋 Available Templates:\n');

    const categories = [
      { name: 'Frameworks', path: 'frameworks' },
      { name: 'Languages', path: 'languages' },
      { name: 'Composites (Monorepos)', path: 'composites' }
    ];

    for (const category of categories) {
      const categoryPath = path.join(this.templatesDir, category.path);
      if (!fs.existsSync(categoryPath)) continue;

      console.log(`  ${category.name}:`);
      const templates = fs.readdirSync(categoryPath).filter(f =>
        fs.statSync(path.join(categoryPath, f)).isDirectory()
      );

      for (const template of templates) {
        const templateJson = this.loadJson(path.join(categoryPath, template, 'template.json'));
        const desc = templateJson?.description || '';
        console.log(`    • ${category.path}/${template}${desc ? ` - ${desc}` : ''}`);
      }
      console.log('');
    }

    console.log('  Usage: claude-config init --template <template-name>');
    console.log('  Example: claude-config init --template fastapi');
    console.log('           claude-config init --template fastapi-react-ts\n');
  }

  /**
   * Find a template by name (searches all categories)
   */
  findTemplate(name) {
    // Direct path
    if (name.includes('/')) {
      const templatePath = path.join(this.templatesDir, name);
      if (fs.existsSync(path.join(templatePath, 'template.json'))) {
        return templatePath;
      }
    }

    // Check root level first (for "universal")
    const rootPath = path.join(this.templatesDir, name);
    if (fs.existsSync(path.join(rootPath, 'template.json'))) {
      return rootPath;
    }

    // Search in categories
    const categories = ['frameworks', 'languages', 'composites'];
    for (const category of categories) {
      const templatePath = path.join(this.templatesDir, category, name);
      if (fs.existsSync(path.join(templatePath, 'template.json'))) {
        return templatePath;
      }
    }

    return null;
  }

  /**
   * Resolve all templates to include (following includes chain)
   */
  resolveTemplateChain(templatePath, visited = new Set()) {
    if (visited.has(templatePath)) return [];
    visited.add(templatePath);

    const templateJson = this.loadJson(path.join(templatePath, 'template.json'));
    if (!templateJson) return [templatePath];

    const chain = [];

    // Process includes first (base templates)
    if (templateJson.includes && Array.isArray(templateJson.includes)) {
      for (const include of templateJson.includes) {
        const includePath = this.findTemplate(include);
        if (includePath) {
          chain.push(...this.resolveTemplateChain(includePath, visited));
        }
      }
    }

    // Then add this template
    chain.push(templatePath);

    return chain;
  }

  /**
   * Copy template files to project (won't overwrite existing)
   */
  copyTemplateFiles(templatePath, projectDir, options = {}) {
    const { force = false, verbose = true } = options;
    const rulesDir = path.join(templatePath, 'rules');
    const commandsDir = path.join(templatePath, 'commands');
    const projectRulesDir = path.join(projectDir, '.claude', 'rules');
    const projectCommandsDir = path.join(projectDir, '.claude', 'commands');

    let copied = 0;
    let skipped = 0;

    // Copy rules
    if (fs.existsSync(rulesDir)) {
      if (!fs.existsSync(projectRulesDir)) {
        fs.mkdirSync(projectRulesDir, { recursive: true });
      }

      for (const file of fs.readdirSync(rulesDir)) {
        if (!file.endsWith('.md')) continue;
        const src = path.join(rulesDir, file);
        const dest = path.join(projectRulesDir, file);

        if (fs.existsSync(dest) && !force) {
          skipped++;
          if (verbose) console.log(`  ⏭  rules/${file} (exists)`);
        } else {
          fs.copyFileSync(src, dest);
          copied++;
          if (verbose) console.log(`  ✓ rules/${file}`);
        }
      }
    }

    // Copy commands
    if (fs.existsSync(commandsDir)) {
      if (!fs.existsSync(projectCommandsDir)) {
        fs.mkdirSync(projectCommandsDir, { recursive: true });
      }

      for (const file of fs.readdirSync(commandsDir)) {
        if (!file.endsWith('.md')) continue;
        const src = path.join(commandsDir, file);
        const dest = path.join(projectCommandsDir, file);

        if (fs.existsSync(dest) && !force) {
          skipped++;
          if (verbose) console.log(`  ⏭  commands/${file} (exists)`);
        } else {
          fs.copyFileSync(src, dest);
          copied++;
          if (verbose) console.log(`  ✓ commands/${file}`);
        }
      }
    }

    return { copied, skipped };
  }

  // ===========================================================================
  // CORE COMMANDS
  // ===========================================================================

  /**
   * Generate .mcp.json for a project (with hierarchical config merging)
   */
  apply(projectDir = null) {
    const dir = projectDir || this.findProjectRoot() || process.cwd();

    const registry = this.loadJson(this.registryPath);
    if (!registry) {
      console.error('Error: Could not load MCP registry from', this.registryPath);
      return false;
    }

    // Find and load all configs in hierarchy
    const configLocations = this.findAllConfigs(dir);

    if (configLocations.length === 0) {
      console.error(`No .claude/mcps.json found in ${dir} or parent directories`);
      console.error('Run: claude-config init');
      return false;
    }

    // Load all configs
    const loadedConfigs = configLocations.map(loc => ({
      ...loc,
      config: this.loadJson(loc.configPath)
    }));

    // Show config hierarchy if multiple configs found
    if (loadedConfigs.length > 1) {
      console.log('📚 Config hierarchy (merged):');
      for (const { dir: d, configPath } of loadedConfigs) {
        const relPath = d === process.env.HOME ? '~' : path.relative(process.cwd(), d) || '.';
        console.log(`  • ${relPath}/.claude/mcps.json`);
      }
      console.log('');
    }

    // Merge all configs
    const mergedConfig = this.mergeConfigs(loadedConfigs);

    // Collect env vars from all levels (child overrides parent)
    const globalEnvPath = path.join(path.dirname(this.registryPath), '.env');
    let env = this.loadEnvFile(globalEnvPath);

    for (const { dir: d } of loadedConfigs) {
      const envPath = path.join(d, '.claude', '.env');
      env = { ...env, ...this.loadEnvFile(envPath) };
    }

    const output = { mcpServers: {} };

    // Add MCPs from include list
    if (mergedConfig.include && Array.isArray(mergedConfig.include)) {
      for (const name of mergedConfig.include) {
        if (registry.mcpServers && registry.mcpServers[name]) {
          output.mcpServers[name] = this.interpolate(registry.mcpServers[name], env);
        } else {
          console.warn(`Warning: MCP "${name}" not found in registry`);
        }
      }
    }

    // Add custom mcpServers (override registry)
    if (mergedConfig.mcpServers) {
      for (const [name, config] of Object.entries(mergedConfig.mcpServers)) {
        if (name.startsWith('_')) continue;
        output.mcpServers[name] = this.interpolate(config, env);
      }
    }

    const outputPath = path.join(dir, '.mcp.json');
    this.saveJson(outputPath, output);

    const count = Object.keys(output.mcpServers).length;
    console.log(`✓ Generated ${outputPath}`);
    console.log(`  └─ ${count} MCP(s): ${Object.keys(output.mcpServers).join(', ')}`);

    return true;
  }

  /**
   * List available MCPs
   */
  list() {
    const registry = this.loadJson(this.registryPath);
    if (!registry || !registry.mcpServers) {
      console.error('Error: Could not load MCP registry');
      return;
    }

    const dir = this.findProjectRoot();
    const projectConfig = dir ? this.loadJson(path.join(dir, '.claude', 'mcps.json')) : null;
    const included = projectConfig?.include || [];

    console.log('\n📚 Available MCPs:\n');
    for (const name of Object.keys(registry.mcpServers)) {
      const active = included.includes(name) ? ' ✓' : '';
      console.log(`  • ${name}${active}`);
    }
    console.log(`\n  Total: ${Object.keys(registry.mcpServers).length} in registry`);
    if (included.length) {
      console.log(`  Active: ${included.join(', ')}`);
    }
    console.log('');
  }

  /**
   * Initialize project with template
   */
  init(projectDir = null, templateName = null) {
    const dir = projectDir || process.cwd();
    const claudeDir = path.join(dir, '.claude');
    const configPath = path.join(claudeDir, 'mcps.json');

    // Create .claude directory
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // Determine MCPs to include
    let mcpDefaults = ['github', 'filesystem'];
    let templateChain = [];

    if (templateName) {
      const templatePath = this.findTemplate(templateName);
      if (!templatePath) {
        console.error(`Template not found: ${templateName}`);
        console.log('Run "claude-config templates" to see available templates.');
        return false;
      }

      // Resolve full template chain
      templateChain = this.resolveTemplateChain(templatePath);

      // Get MCP defaults from the main template
      const templateJson = this.loadJson(path.join(templatePath, 'template.json'));
      if (templateJson?.mcpDefaults) {
        mcpDefaults = templateJson.mcpDefaults;
      }

      console.log(`\n🎯 Using template: ${templateName}`);
      console.log(`  Includes: ${templateChain.map(p => path.basename(p)).join(' → ')}\n`);
    }

    // Create or update mcps.json
    if (!fs.existsSync(configPath)) {
      const template = {
        "include": mcpDefaults,
        "template": templateName || null,
        "mcpServers": {}
      };
      this.saveJson(configPath, template);
      console.log(`✓ Created ${configPath}`);
    } else {
      console.log(`⏭  ${configPath} already exists`);
    }

    // Copy template files
    if (templateChain.length > 0) {
      console.log('\nCopying template files:');
      let totalCopied = 0;
      let totalSkipped = 0;

      for (const tplPath of templateChain) {
        const { copied, skipped } = this.copyTemplateFiles(tplPath, dir);
        totalCopied += copied;
        totalSkipped += skipped;
      }

      console.log(`\n  Total: ${totalCopied} copied, ${totalSkipped} skipped (already exist)`);
    }

    // Create .env file
    const envPath = path.join(claudeDir, '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, `# Project secrets (gitignored)
# GITHUB_TOKEN=ghp_xxx
# DATABASE_URL=postgres://...
`);
      console.log(`✓ Created ${envPath}`);
    }

    // Update .gitignore
    const gitignorePath = path.join(dir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      if (!content.includes('.claude/.env')) {
        fs.appendFileSync(gitignorePath, '\n.claude/.env\n');
        console.log('✓ Updated .gitignore');
      }
    }

    console.log('\n✅ Project initialized!');
    console.log('Next steps:');
    console.log('  1. Edit .claude/mcps.json to customize MCPs');
    console.log('  2. Review .claude/rules/ and .claude/commands/');
    console.log('  3. Run: claude-config apply\n');

    return true;
  }

  /**
   * Apply templates to existing project (add rules/commands without overwriting)
   */
  applyTemplate(templateName, projectDir = null) {
    const dir = projectDir || this.findProjectRoot() || process.cwd();

    if (!templateName) {
      console.error('Usage: claude-config apply-template <template-name>');
      console.log('Run "claude-config templates" to see available templates.');
      return false;
    }

    const templatePath = this.findTemplate(templateName);
    if (!templatePath) {
      console.error(`Template not found: ${templateName}`);
      console.log('Run "claude-config templates" to see available templates.');
      return false;
    }

    // Resolve full template chain
    const templateChain = this.resolveTemplateChain(templatePath);

    console.log(`\n🎯 Applying template: ${templateName}`);
    console.log(`  Includes: ${templateChain.map(p => path.basename(p)).join(' → ')}\n`);

    console.log('Copying template files (won\'t overwrite existing):');
    let totalCopied = 0;
    let totalSkipped = 0;

    for (const tplPath of templateChain) {
      const { copied, skipped } = this.copyTemplateFiles(tplPath, dir);
      totalCopied += copied;
      totalSkipped += skipped;
    }

    console.log(`\n✅ Applied template: ${totalCopied} files copied, ${totalSkipped} skipped\n`);
    return true;
  }

  /**
   * Show current project config (including hierarchy)
   */
  show(projectDir = null) {
    const dir = projectDir || this.findProjectRoot() || process.cwd();

    // Find all configs in hierarchy
    const configLocations = this.findAllConfigs(dir);

    if (configLocations.length === 0) {
      console.log('No .claude/mcps.json found in current directory or parents');
      return;
    }

    console.log(`\n📁 Project: ${dir}`);

    // Show each config in hierarchy
    if (configLocations.length > 1) {
      console.log('\n📚 Config Hierarchy (root → leaf):');
    }

    for (const { dir: d, configPath } of configLocations) {
      const config = this.loadJson(configPath);
      const relPath = d === process.env.HOME ? '~' : path.relative(process.cwd(), d) || '.';

      console.log(`\n📄 ${relPath}/.claude/mcps.json:`);
      console.log(JSON.stringify(config, null, 2));
    }

    // Show merged result
    if (configLocations.length > 1) {
      const loadedConfigs = configLocations.map(loc => ({
        ...loc,
        config: this.loadJson(loc.configPath)
      }));
      const merged = this.mergeConfigs(loadedConfigs);
      console.log('\n🔀 Merged Config (effective):');
      console.log(JSON.stringify(merged, null, 2));
    }

    // Collect rules and commands from all levels in hierarchy
    const allRules = this.collectFilesFromHierarchy(configLocations, 'rules');
    const allCommands = this.collectFilesFromHierarchy(configLocations, 'commands');

    if (allRules.length) {
      console.log(`\n📜 Rules (${allRules.length} total):`);
      for (const { file, source } of allRules) {
        const sourceLabel = source === process.env.HOME ? '~' : path.relative(process.cwd(), source) || '.';
        console.log(`  • ${file}  (${sourceLabel})`);
      }
    }

    if (allCommands.length) {
      console.log(`\n⚡ Commands (${allCommands.length} total):`);
      for (const { file, source } of allCommands) {
        const sourceLabel = source === process.env.HOME ? '~' : path.relative(process.cwd(), source) || '.';
        console.log(`  • ${file}  (${sourceLabel})`);
      }
    }
    console.log('');
  }

  // ===========================================================================
  // MCP EDIT COMMANDS
  // ===========================================================================

  /**
   * Add MCP(s) to current project
   */
  add(mcpNames) {
    if (!mcpNames || mcpNames.length === 0) {
      console.error('Usage: claude-config add <mcp-name> [mcp-name...]');
      return false;
    }

    const configPath = this.getConfigPath();
    let config = this.loadJson(configPath);

    if (!config) {
      console.error('No .claude/mcps.json found. Run: claude-config init');
      return false;
    }

    const registry = this.loadJson(this.registryPath);
    if (!config.include) config.include = [];

    const added = [];
    const notFound = [];
    const alreadyExists = [];

    for (const name of mcpNames) {
      if (config.include.includes(name)) {
        alreadyExists.push(name);
      } else if (registry?.mcpServers?.[name]) {
        config.include.push(name);
        added.push(name);
      } else {
        notFound.push(name);
      }
    }

    if (added.length) {
      this.saveJson(configPath, config);
      console.log(`✓ Added: ${added.join(', ')}`);
    }
    if (alreadyExists.length) {
      console.log(`Already included: ${alreadyExists.join(', ')}`);
    }
    if (notFound.length) {
      console.log(`Not in registry: ${notFound.join(', ')}`);
      console.log('  (Use "claude-config list" to see available MCPs)');
    }

    if (added.length) {
      console.log('\nRun "claude-config apply" to regenerate .mcp.json');
    }

    return added.length > 0;
  }

  /**
   * Remove MCP(s) from current project
   */
  remove(mcpNames) {
    if (!mcpNames || mcpNames.length === 0) {
      console.error('Usage: claude-config remove <mcp-name> [mcp-name...]');
      return false;
    }

    const configPath = this.getConfigPath();
    let config = this.loadJson(configPath);

    if (!config) {
      console.error('No .claude/mcps.json found');
      return false;
    }

    if (!config.include) config.include = [];

    const removed = [];
    const notFound = [];

    for (const name of mcpNames) {
      const idx = config.include.indexOf(name);
      if (idx !== -1) {
        config.include.splice(idx, 1);
        removed.push(name);
      } else {
        notFound.push(name);
      }
    }

    if (removed.length) {
      this.saveJson(configPath, config);
      console.log(`✓ Removed: ${removed.join(', ')}`);
      console.log('\nRun "claude-config apply" to regenerate .mcp.json');
    }
    if (notFound.length) {
      console.log(`Not in project: ${notFound.join(', ')}`);
    }

    return removed.length > 0;
  }

  // ===========================================================================
  // REGISTRY COMMANDS
  // ===========================================================================

  /**
   * Add MCP to global registry
   */
  registryAdd(name, configJson) {
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

    const registry = this.loadJson(this.registryPath) || { mcpServers: {} };
    registry.mcpServers[name] = mcpConfig;
    this.saveJson(this.registryPath, registry);

    console.log(`✓ Added "${name}" to registry`);
    return true;
  }

  /**
   * Remove MCP from global registry
   */
  registryRemove(name) {
    if (!name) {
      console.error('Usage: claude-config registry-remove <name>');
      return false;
    }

    const registry = this.loadJson(this.registryPath);
    if (!registry?.mcpServers?.[name]) {
      console.error(`"${name}" not found in registry`);
      return false;
    }

    delete registry.mcpServers[name];
    this.saveJson(this.registryPath, registry);

    console.log(`✓ Removed "${name}" from registry`);
    return true;
  }

  // ===========================================================================
  // UPDATE COMMAND
  // ===========================================================================

  /**
   * Update claude-config from source
   */
  update(sourcePath) {
    if (!sourcePath) {
      console.error('Usage: claude-config update /path/to/claude-config');
      console.log('\nThis copies updated files from the source to your installation.');
      return false;
    }

    if (!fs.existsSync(sourcePath)) {
      console.error(`Source not found: ${sourcePath}`);
      return false;
    }

    const files = [
      'config-loader.js',
      'shared/mcp-registry.json',
      'shell/claude-config.zsh'
    ];

    let updated = 0;
    for (const file of files) {
      const src = path.join(sourcePath, file);
      const dest = path.join(this.installDir, file);

      if (fs.existsSync(src)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
        console.log(`✓ Updated ${file}`);
        updated++;
      }
    }

    // Copy templates directory
    const srcTemplates = path.join(sourcePath, 'templates');
    const destTemplates = path.join(this.installDir, 'templates');
    if (fs.existsSync(srcTemplates)) {
      this.copyDirRecursive(srcTemplates, destTemplates);
      console.log(`✓ Updated templates/`);
      updated++;
    }

    if (updated > 0) {
      console.log(`\n✅ Updated ${updated} item(s)`);
      console.log('Restart your shell or run: source ~/.zshrc');
    } else {
      console.log('No files found to update');
    }

    return updated > 0;
  }

  /**
   * Recursively copy directory
   */
  copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    for (const item of fs.readdirSync(src)) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Show version
   */
  version() {
    console.log(`claude-config v${VERSION}`);
    console.log(`Install: ${this.installDir}`);
    console.log(`Registry: ${this.registryPath}`);
    console.log(`Templates: ${this.templatesDir}`);
  }
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new ClaudeConfigManager();

  // Parse --template flag for init
  const templateIndex = args.indexOf('--template');
  const templateArg = templateIndex !== -1 ? args[templateIndex + 1] : null;

  switch (command) {
    // Core
    case 'init':
      if (templateArg) {
        // Remove --template and its value from args for path detection
        const filteredArgs = args.filter((_, i) => i !== templateIndex && i !== templateIndex + 1);
        manager.init(filteredArgs[1], templateArg);
      } else {
        manager.init(args[1]);
      }
      break;
    case 'apply':
      manager.apply(args[1]);
      break;
    case 'apply-template':
      manager.applyTemplate(args[1], args[2]);
      break;
    case 'show':
      manager.show(args[1]);
      break;
    case 'list':
    case 'mcps':
      manager.list();
      break;
    case 'templates':
      manager.listTemplates();
      break;

    // Edit MCPs
    case 'add':
      manager.add(args.slice(1));
      break;
    case 'remove':
    case 'rm':
      manager.remove(args.slice(1));
      break;

    // Registry management
    case 'registry-add':
      manager.registryAdd(args[1], args[2]);
      break;
    case 'registry-remove':
    case 'registry-rm':
      manager.registryRemove(args[1]);
      break;

    // Maintenance
    case 'update':
      manager.update(args[1]);
      break;
    case 'ui': {
      const UIServer = require('./ui/server.cjs');
      const port = parseInt(args.find(a => a.startsWith('--port='))?.split('=')[1] || '3333');
      const uiDir = args.find(a => !a.startsWith('--') && a !== 'ui') || process.cwd();
      const uiServer = new UIServer(port, uiDir, manager);
      uiServer.start();
      break;
    }
    case 'version':
    case '-v':
    case '--version':
      manager.version();
      break;

    default:
      console.log(`
claude-config v${VERSION}

Usage:
  claude-config <command> [args]

Project Commands:
  init [--template <name>]     Initialize project (optionally with template)
  apply                        Generate .mcp.json from config
  apply-template <name>        Add template rules/commands to existing project
  show                         Show current project config
  list                         List available MCPs (✓ = active)
  templates                    List available templates

  add <mcp> [mcp...]           Add MCP(s) to project
  remove <mcp> [mcp...]        Remove MCP(s) from project

Registry Commands:
  registry-add <name> '<json>'   Add MCP to global registry
  registry-remove <name>         Remove MCP from registry

Maintenance:
  ui [--port=3333]        Open web UI for config management
  update <source-path>    Update from source directory
  version                 Show version info

Examples:
  claude-config init --template fastapi
  claude-config init --template react-ts
  claude-config init --template fastapi-react-ts
  claude-config templates
  claude-config apply-template python
  claude-config add postgres slack
  claude-config apply
`);
  }
}

module.exports = ClaudeConfigManager;
