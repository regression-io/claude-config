/**
 * Project initialization commands
 */

const fs = require('fs');
const path = require('path');
const { loadJson, saveJson } = require('./utils');
const { findProjectRoot, findAllConfigs, mergeConfigs, collectFilesFromHierarchy } = require('./config');
const { findTemplate, resolveTemplateChain, copyTemplateFiles, trackAppliedTemplate } = require('./templates');

/**
 * Initialize project with template
 */
function init(templatesDir, registryPath, projectDir = null, templateName = null) {
  const dir = projectDir || process.cwd();
  const claudeDir = path.join(dir, '.claude');
  const configPath = path.join(claudeDir, 'mcps.json');

  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  let mcpDefaults = ['github', 'filesystem'];
  let templateChain = [];

  if (templateName) {
    const templatePath = findTemplate(templatesDir, templateName);
    if (!templatePath) {
      console.error(`Template not found: ${templateName}`);
      console.log('Run "claude-config templates" to see available templates.');
      return false;
    }

    templateChain = resolveTemplateChain(templatesDir, templatePath);

    const templateJson = loadJson(path.join(templatePath, 'template.json'));
    if (templateJson?.mcpDefaults) {
      mcpDefaults = templateJson.mcpDefaults;
    }

    console.log(`\n🎯 Using template: ${templateName}`);
    console.log(`  Includes: ${templateChain.map(p => path.basename(p)).join(' → ')}\n`);
  }

  if (!fs.existsSync(configPath)) {
    const template = {
      "include": mcpDefaults,
      "template": templateName || null,
      "mcpServers": {}
    };
    saveJson(configPath, template);
    console.log(`✓ Created ${configPath}`);
  } else {
    console.log(`⏭  ${configPath} already exists`);
  }

  if (templateChain.length > 0) {
    console.log('\nCopying template files:');
    let totalCopied = 0;
    let totalSkipped = 0;

    for (const tplPath of templateChain) {
      const { copied, skipped } = copyTemplateFiles(tplPath, dir);
      totalCopied += copied;
      totalSkipped += skipped;
    }

    console.log(`\n  Total: ${totalCopied} copied, ${totalSkipped} skipped (already exist)`);
  }

  const envPath = path.join(claudeDir, '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `# Project secrets (gitignored)
# GITHUB_TOKEN=ghp_xxx
# DATABASE_URL=postgres://...
`);
    console.log(`✓ Created ${envPath}`);
  }

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
function applyTemplate(templatesDir, templateName, projectDir = null) {
  const dir = projectDir || findProjectRoot() || process.cwd();

  if (!templateName) {
    console.error('Usage: claude-config apply-template <template-name>');
    console.log('Run "claude-config templates" to see available templates.');
    return false;
  }

  const templatePath = findTemplate(templatesDir, templateName);
  if (!templatePath) {
    console.error(`Template not found: ${templateName}`);
    console.log('Run "claude-config templates" to see available templates.');
    return false;
  }

  const templateChain = resolveTemplateChain(templatesDir, templatePath);

  console.log(`\n🎯 Applying template: ${templateName}`);
  console.log(`  Includes: ${templateChain.map(p => path.basename(p)).join(' → ')}\n`);

  console.log('Copying template files (won\'t overwrite existing):');
  let totalCopied = 0;
  let totalSkipped = 0;

  for (const tplPath of templateChain) {
    const { copied, skipped } = copyTemplateFiles(tplPath, dir);
    totalCopied += copied;
    totalSkipped += skipped;
  }

  console.log(`\n✅ Applied template: ${totalCopied} files copied, ${totalSkipped} skipped\n`);

  trackAppliedTemplate(dir, templateName);

  return true;
}

/**
 * Show current project config (including hierarchy)
 */
function show(projectDir = null) {
  const dir = projectDir || findProjectRoot() || process.cwd();

  const configLocations = findAllConfigs(dir);

  if (configLocations.length === 0) {
    console.log('No .claude/mcps.json found in current directory or parents');
    return;
  }

  console.log(`\n📁 Project: ${dir}`);

  if (configLocations.length > 1) {
    console.log('\n📚 Config Hierarchy (root → leaf):');
  }

  for (const { dir: d, configPath } of configLocations) {
    const config = loadJson(configPath);
    const relPath = d === process.env.HOME ? '~' : path.relative(process.cwd(), d) || '.';

    console.log(`\n📄 ${relPath}/.claude/mcps.json:`);
    console.log(JSON.stringify(config, null, 2));
  }

  if (configLocations.length > 1) {
    const loadedConfigs = configLocations.map(loc => ({
      ...loc,
      config: loadJson(loc.configPath)
    }));
    const merged = mergeConfigs(loadedConfigs);
    console.log('\n🔀 Merged Config (effective):');
    console.log(JSON.stringify(merged, null, 2));
  }

  const allRules = collectFilesFromHierarchy(configLocations, 'rules');
  const allCommands = collectFilesFromHierarchy(configLocations, 'commands');

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

module.exports = {
  init,
  applyTemplate,
  show,
};
