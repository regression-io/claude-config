/**
 * Templates Routes
 */

const fs = require('fs');
const path = require('path');

/**
 * Get all templates
 */
function getTemplates(manager) {
  const templatesDir = manager.templatesDir;
  const templates = [];

  const categories = [
    { name: 'Frameworks', path: 'frameworks' },
    { name: 'Languages', path: 'languages' },
    { name: 'Composites (Monorepos)', path: 'composites' }
  ];

  for (const category of categories) {
    const categoryPath = path.join(templatesDir, category.path);
    if (!fs.existsSync(categoryPath)) continue;

    const dirs = fs.readdirSync(categoryPath).filter(f =>
      fs.statSync(path.join(categoryPath, f)).isDirectory()
    );

    for (const dir of dirs) {
      const templatePath = path.join(categoryPath, dir);
      const templateJson = manager.loadJson(path.join(templatePath, 'template.json'));

      templates.push({
        id: `${category.path}/${dir}`,
        name: dir,
        category: category.name,
        description: templateJson?.description || '',
        includes: templateJson?.includes || [],
        mcpDefaults: templateJson?.mcpDefaults || []
      });
    }
  }

  return templates;
}

/**
 * Apply template to directory
 */
function applyTemplate(manager, templateName, dir) {
  const result = manager.applyTemplate(templateName, dir);
  return { success: result };
}

/**
 * Mark template as applied (without copying files)
 */
function markTemplateApplied(manager, templateName, dir) {
  manager.trackAppliedTemplate(dir, templateName);
  return { success: true };
}

module.exports = {
  getTemplates,
  applyTemplate,
  markTemplateApplied,
};
