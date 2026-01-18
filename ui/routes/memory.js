/**
 * Memory Routes
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Get all memory files (global + project + sync)
 */
function getMemory(projectDir) {
  const home = os.homedir();
  const globalMemoryDir = path.join(home, '.claude', 'memory');
  const projectMemoryDir = path.join(projectDir, '.claude', 'memory');
  const syncDir = path.join(home, '.claude', 'sync');
  const templatesDir = path.join(home, '.claude', 'templates', 'project-memory');

  const result = {
    global: {
      dir: globalMemoryDir,
      files: []
    },
    project: {
      dir: projectMemoryDir,
      files: [],
      initialized: false
    },
    sync: {
      dir: syncDir,
      state: null,
      history: []
    },
    templates: {
      dir: templatesDir,
      available: fs.existsSync(templatesDir)
    }
  };

  // Global memory files
  const globalFiles = ['index.md', 'preferences.md', 'corrections.md', 'facts.md'];
  for (const file of globalFiles) {
    const filePath = path.join(globalMemoryDir, file);
    result.global.files.push({
      name: file,
      path: filePath,
      exists: fs.existsSync(filePath),
      type: file.replace('.md', '')
    });
  }

  // Project memory files
  const projectFiles = ['context.md', 'patterns.md', 'decisions.md', 'issues.md', 'history.md'];
  result.project.initialized = fs.existsSync(projectMemoryDir);
  for (const file of projectFiles) {
    const filePath = path.join(projectMemoryDir, file);
    result.project.files.push({
      name: file,
      path: filePath,
      exists: fs.existsSync(filePath),
      type: file.replace('.md', '')
    });
  }

  // Sync state
  const stateJsonPath = path.join(syncDir, 'state.json');
  const stateMdPath = path.join(syncDir, 'state.md');
  if (fs.existsSync(stateJsonPath)) {
    try {
      result.sync.state = JSON.parse(fs.readFileSync(stateJsonPath, 'utf8'));
      result.sync.stateMd = fs.existsSync(stateMdPath) ? fs.readFileSync(stateMdPath, 'utf8') : null;
    } catch (e) {
      result.sync.state = null;
    }
  }

  // Sync history
  const historyDir = path.join(syncDir, 'history');
  if (fs.existsSync(historyDir)) {
    try {
      const files = fs.readdirSync(historyDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 10);
      result.sync.history = files.map(f => ({
        name: f,
        path: path.join(historyDir, f)
      }));
    } catch (e) {}
  }

  return result;
}

/**
 * Get a specific memory file content
 */
function getMemoryFile(filePath, projectDir) {
  if (!filePath) {
    return { error: 'Path required' };
  }

  const home = os.homedir();
  const normalizedPath = path.resolve(filePath);
  const isGlobalMemory = normalizedPath.startsWith(path.join(home, '.claude'));
  const isProjectMemory = normalizedPath.startsWith(path.join(projectDir, '.claude'));

  if (!isGlobalMemory && !isProjectMemory) {
    return { error: 'Access denied: path must be within .claude directory' };
  }

  if (!fs.existsSync(normalizedPath)) {
    return { content: '', exists: false };
  }

  try {
    const content = fs.readFileSync(normalizedPath, 'utf8');
    return { content, exists: true, path: normalizedPath };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Save a memory file
 */
function saveMemoryFile(body, projectDir) {
  const { path: filePath, content } = body;

  if (!filePath) {
    return { error: 'Path required' };
  }

  const home = os.homedir();
  const normalizedPath = path.resolve(filePath);
  const isGlobalMemory = normalizedPath.startsWith(path.join(home, '.claude'));
  const isProjectMemory = normalizedPath.startsWith(path.join(projectDir, '.claude'));

  if (!isGlobalMemory && !isProjectMemory) {
    return { error: 'Access denied: path must be within .claude directory' };
  }

  try {
    const dir = path.dirname(normalizedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(normalizedPath, content, 'utf8');
    return { success: true, path: normalizedPath };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Add a memory entry to the appropriate file
 */
function addMemoryEntry(body, projectDir) {
  const { type, content, scope = 'global' } = body;

  if (!type || !content) {
    return { error: 'Type and content required' };
  }

  const typeToFile = {
    preference: { file: 'preferences.md', dir: 'global' },
    correction: { file: 'corrections.md', dir: 'global' },
    fact: { file: 'facts.md', dir: 'global' },
    pattern: { file: 'patterns.md', dir: 'project' },
    decision: { file: 'decisions.md', dir: 'project' },
    issue: { file: 'issues.md', dir: 'project' },
    history: { file: 'history.md', dir: 'project' },
    context: { file: 'context.md', dir: 'project' }
  };

  const mapping = typeToFile[type];
  if (!mapping) {
    return { error: `Unknown type: ${type}. Valid types: ${Object.keys(typeToFile).join(', ')}` };
  }

  const home = os.homedir();
  let targetDir;
  if (mapping.dir === 'global' || scope === 'global') {
    targetDir = path.join(home, '.claude', 'memory');
  } else {
    targetDir = path.join(projectDir, '.claude', 'memory');
  }

  const targetPath = path.join(targetDir, mapping.file);

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let existing = '';
    if (fs.existsSync(targetPath)) {
      existing = fs.readFileSync(targetPath, 'utf8');
    } else {
      existing = `# ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const entry = `\n## [${timestamp}]\n${content}\n`;

    fs.writeFileSync(targetPath, existing + entry, 'utf8');

    return { success: true, path: targetPath, type };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Initialize project memory from templates
 */
function initProjectMemory(dir, projectDir) {
  const targetDir = dir || projectDir;
  const home = os.homedir();
  const templatesDir = path.join(home, '.claude', 'templates', 'project-memory');
  const memoryDir = path.join(targetDir, '.claude', 'memory');

  if (!fs.existsSync(templatesDir)) {
    const defaultTemplates = {
      'context.md': `# Project Context\n\n## Overview\n[Describe what this project does]\n\n## Tech Stack\n- \n\n## Key Conventions\n- \n`,
      'patterns.md': `# Code Patterns\n\n## Common Patterns\n[Document recurring patterns in this codebase]\n`,
      'decisions.md': `# Architecture Decisions\n\n## ADRs\n[Record important decisions and their rationale]\n`,
      'issues.md': `# Known Issues\n\n## Current Issues\n[Track bugs, limitations, and workarounds]\n`,
      'history.md': `# Session History\n\n[Chronological log of significant work]\n`
    };

    try {
      fs.mkdirSync(templatesDir, { recursive: true });
      for (const [file, content] of Object.entries(defaultTemplates)) {
        fs.writeFileSync(path.join(templatesDir, file), content, 'utf8');
      }
    } catch (e) {
      return { error: `Failed to create templates: ${e.message}` };
    }
  }

  if (fs.existsSync(memoryDir)) {
    return { error: 'Project memory already exists', dir: memoryDir };
  }

  try {
    fs.mkdirSync(memoryDir, { recursive: true });
    const templateFiles = fs.readdirSync(templatesDir);

    for (const file of templateFiles) {
      const src = path.join(templatesDir, file);
      const dest = path.join(memoryDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
      }
    }

    return { success: true, dir: memoryDir, files: templateFiles };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Search memory files
 */
function searchMemory(query, projectDir) {
  if (!query) {
    return { results: [] };
  }

  const home = os.homedir();
  const searchDirs = [
    path.join(home, '.claude', 'memory'),
    path.join(projectDir, '.claude', 'memory')
  ];

  const results = [];
  const queryLower = query.toLowerCase();

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        if (content.toLowerCase().includes(queryLower)) {
          const lines = content.split('\n');
          const matches = [];

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(queryLower)) {
              matches.push({
                line: i + 1,
                text: lines[i].trim().substring(0, 200)
              });
            }
          }

          if (matches.length > 0) {
            results.push({
              file,
              path: filePath,
              scope: dir.includes(projectDir) ? 'project' : 'global',
              matches: matches.slice(0, 5)
            });
          }
        }
      }
    } catch (e) {}
  }

  return { query, results };
}

/**
 * Get sync state
 */
function getSyncState() {
  const home = os.homedir();
  const syncDir = path.join(home, '.claude', 'sync');

  const result = {
    dir: syncDir,
    state: null,
    stateMd: null,
    history: []
  };

  const stateJsonPath = path.join(syncDir, 'state.json');
  if (fs.existsSync(stateJsonPath)) {
    try {
      result.state = JSON.parse(fs.readFileSync(stateJsonPath, 'utf8'));
    } catch (e) {}
  }

  const stateMdPath = path.join(syncDir, 'state.md');
  if (fs.existsSync(stateMdPath)) {
    try {
      result.stateMd = fs.readFileSync(stateMdPath, 'utf8');
    } catch (e) {}
  }

  const historyDir = path.join(syncDir, 'history');
  if (fs.existsSync(historyDir)) {
    try {
      const files = fs.readdirSync(historyDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 10);

      result.history = files.map(f => {
        const filePath = path.join(historyDir, f);
        try {
          return {
            name: f,
            path: filePath,
            data: JSON.parse(fs.readFileSync(filePath, 'utf8'))
          };
        } catch (e) {
          return { name: f, path: filePath, error: e.message };
        }
      });
    } catch (e) {}
  }

  return result;
}

module.exports = {
  getMemory,
  getMemoryFile,
  saveMemoryFile,
  addMemoryEntry,
  initProjectMemory,
  searchMemory,
  getSyncState,
};
