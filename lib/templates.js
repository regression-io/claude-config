/**
 * Template system for project initialization
 */

const fs = require('fs');
const path = require('path');
const { loadJson } = require('./utils');

/**
 * List available templates
 */
function listTemplates(templatesDir) {
  console.log('\n📋 Available Templates:\n');

  const categories = [
    { name: 'Frameworks', path: 'frameworks' },
    { name: 'Languages', path: 'languages' },
    { name: 'Composites (Monorepos)', path: 'composites' }
  ];

  for (const category of categories) {
    const categoryPath = path.join(templatesDir, category.path);
    if (!fs.existsSync(categoryPath)) continue;

    console.log(`  ${category.name}:`);
    const templates = fs.readdirSync(categoryPath).filter(f =>
      fs.statSync(path.join(categoryPath, f)).isDirectory()
    );

    for (const template of templates) {
      const templateJson = loadJson(path.join(categoryPath, template, 'template.json'));
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
function findTemplate(templatesDir, name) {
  if (name.includes('/')) {
    const templatePath = path.join(templatesDir, name);
    if (fs.existsSync(path.join(templatePath, 'template.json'))) {
      return templatePath;
    }
  }

  const rootPath = path.join(templatesDir, name);
  if (fs.existsSync(path.join(rootPath, 'template.json'))) {
    return rootPath;
  }

  const categories = ['frameworks', 'languages', 'composites'];
  for (const category of categories) {
    const templatePath = path.join(templatesDir, category, name);
    if (fs.existsSync(path.join(templatePath, 'template.json'))) {
      return templatePath;
    }
  }

  return null;
}

/**
 * Resolve all templates to include (following includes chain)
 */
function resolveTemplateChain(templatesDir, templatePath, visited = new Set()) {
  if (visited.has(templatePath)) return [];
  visited.add(templatePath);

  const templateJson = loadJson(path.join(templatePath, 'template.json'));
  if (!templateJson) return [templatePath];

  const chain = [];

  if (templateJson.includes && Array.isArray(templateJson.includes)) {
    for (const include of templateJson.includes) {
      const includePath = findTemplate(templatesDir, include);
      if (includePath) {
        chain.push(...resolveTemplateChain(templatesDir, includePath, visited));
      }
    }
  }

  chain.push(templatePath);
  return chain;
}

/**
 * Copy template files to project (won't overwrite existing)
 */
function copyTemplateFiles(templatePath, projectDir, options = {}) {
  const { force = false, verbose = true } = options;
  const rulesDir = path.join(templatePath, 'rules');
  const commandsDir = path.join(templatePath, 'commands');
  const projectRulesDir = path.join(projectDir, '.claude', 'rules');
  const projectCommandsDir = path.join(projectDir, '.claude', 'commands');

  let copied = 0;
  let skipped = 0;

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

/**
 * Track an applied template in .claude/templates.json
 */
function trackAppliedTemplate(dir, templateName) {
  const claudeDir = path.join(dir, '.claude');
  const templatesPath = path.join(claudeDir, 'templates.json');

  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  const data = {
    template: templateName,
    appliedAt: new Date().toISOString()
  };

  fs.writeFileSync(templatesPath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Get applied template for a directory
 */
function getAppliedTemplate(dir) {
  const templatesPath = path.join(dir, '.claude', 'templates.json');
  if (!fs.existsSync(templatesPath)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    if (!data.template) return null;
    return {
      template: data.template,
      appliedAt: data.appliedAt
    };
  } catch (e) {
    return null;
  }
}

module.exports = {
  listTemplates,
  findTemplate,
  resolveTemplateChain,
  copyTemplateFiles,
  trackAppliedTemplate,
  getAppliedTemplate,
};
