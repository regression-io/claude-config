/**
 * Workstreams feature
 */

const fs = require('fs');
const path = require('path');

/**
 * Get workstreams file path
 */
function getWorkstreamsPath(installDir) {
  return path.join(installDir, 'workstreams.json');
}

/**
 * Load workstreams
 */
function loadWorkstreams(installDir) {
  const wsPath = getWorkstreamsPath(installDir);
  if (fs.existsSync(wsPath)) {
    try {
      return JSON.parse(fs.readFileSync(wsPath, 'utf8'));
    } catch (e) {
      return { workstreams: [], activeId: null, lastUsedByProject: {} };
    }
  }
  return { workstreams: [], activeId: null, lastUsedByProject: {} };
}

/**
 * Save workstreams
 */
function saveWorkstreams(installDir, data) {
  const wsPath = getWorkstreamsPath(installDir);
  const dir = path.dirname(wsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(wsPath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * List all workstreams
 */
function workstreamList(installDir) {
  const data = loadWorkstreams(installDir);

  if (data.workstreams.length === 0) {
    console.log('\nNo workstreams defined.');
    console.log('Create one with: claude-config workstream create "Name"\n');
    return data.workstreams;
  }

  console.log('\n📋 Workstreams:\n');
  for (const ws of data.workstreams) {
    const active = ws.id === data.activeId ? '● ' : '○ ';
    console.log(`${active}${ws.name}`);
    if (ws.projects && ws.projects.length > 0) {
      console.log(`    Projects: ${ws.projects.map(p => path.basename(p)).join(', ')}`);
    }
    if (ws.rules) {
      const preview = ws.rules.substring(0, 60).replace(/\n/g, ' ');
      console.log(`    Rules: ${preview}${ws.rules.length > 60 ? '...' : ''}`);
    }
  }
  console.log('');
  return data.workstreams;
}

/**
 * Create a new workstream
 */
function workstreamCreate(installDir, name, projects = [], rules = '') {
  if (!name) {
    console.error('Usage: claude-config workstream create "Name"');
    return null;
  }

  const data = loadWorkstreams(installDir);

  if (data.workstreams.some(ws => ws.name.toLowerCase() === name.toLowerCase())) {
    console.error(`Workstream "${name}" already exists`);
    return null;
  }

  const workstream = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name,
    projects: projects.map(p => path.resolve(p.replace(/^~/, process.env.HOME || ''))),
    rules: rules || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.workstreams.push(workstream);

  if (!data.activeId) {
    data.activeId = workstream.id;
  }

  saveWorkstreams(installDir, data);
  console.log(`✓ Created workstream: ${name}`);
  return workstream;
}

/**
 * Update a workstream
 */
function workstreamUpdate(installDir, idOrName, updates) {
  const data = loadWorkstreams(installDir);
  const ws = data.workstreams.find(
    w => w.id === idOrName || w.name.toLowerCase() === idOrName.toLowerCase()
  );

  if (!ws) {
    console.error(`Workstream not found: ${idOrName}`);
    return null;
  }

  if (updates.name !== undefined) ws.name = updates.name;
  if (updates.projects !== undefined) {
    ws.projects = updates.projects.map(p =>
      path.resolve(p.replace(/^~/, process.env.HOME || ''))
    );
  }
  if (updates.rules !== undefined) ws.rules = updates.rules;
  ws.updatedAt = new Date().toISOString();

  saveWorkstreams(installDir, data);
  console.log(`✓ Updated workstream: ${ws.name}`);
  return ws;
}

/**
 * Delete a workstream
 */
function workstreamDelete(installDir, idOrName) {
  const data = loadWorkstreams(installDir);
  const idx = data.workstreams.findIndex(
    w => w.id === idOrName || w.name.toLowerCase() === idOrName.toLowerCase()
  );

  if (idx === -1) {
    console.error(`Workstream not found: ${idOrName}`);
    return false;
  }

  const removed = data.workstreams.splice(idx, 1)[0];

  if (data.activeId === removed.id) {
    data.activeId = data.workstreams[0]?.id || null;
  }

  saveWorkstreams(installDir, data);
  console.log(`✓ Deleted workstream: ${removed.name}`);
  return true;
}

/**
 * Set active workstream
 */
function workstreamUse(installDir, idOrName) {
  const data = loadWorkstreams(installDir);

  if (!idOrName) {
    const active = data.workstreams.find(w => w.id === data.activeId);
    if (active) {
      console.log(`Active workstream: ${active.name}`);
    } else {
      console.log('No active workstream');
    }
    return active || null;
  }

  const ws = data.workstreams.find(
    w => w.id === idOrName || w.name.toLowerCase() === idOrName.toLowerCase()
  );

  if (!ws) {
    console.error(`Workstream not found: ${idOrName}`);
    return null;
  }

  data.activeId = ws.id;
  saveWorkstreams(installDir, data);
  console.log(`✓ Switched to workstream: ${ws.name}`);
  return ws;
}

/**
 * Get active workstream
 */
function workstreamActive(installDir) {
  const data = loadWorkstreams(installDir);
  return data.workstreams.find(w => w.id === data.activeId) || null;
}

/**
 * Add project to workstream
 */
function workstreamAddProject(installDir, idOrName, projectPath) {
  const data = loadWorkstreams(installDir);
  const ws = data.workstreams.find(
    w => w.id === idOrName || w.name.toLowerCase() === idOrName.toLowerCase()
  );

  if (!ws) {
    console.error(`Workstream not found: ${idOrName}`);
    return null;
  }

  const absPath = path.resolve(projectPath.replace(/^~/, process.env.HOME || ''));

  if (!ws.projects.includes(absPath)) {
    ws.projects.push(absPath);
    ws.updatedAt = new Date().toISOString();
    saveWorkstreams(installDir, data);
    console.log(`✓ Added ${path.basename(absPath)} to ${ws.name}`);
  } else {
    console.log(`Project already in workstream: ${path.basename(absPath)}`);
  }

  return ws;
}

/**
 * Remove project from workstream
 */
function workstreamRemoveProject(installDir, idOrName, projectPath) {
  const data = loadWorkstreams(installDir);
  const ws = data.workstreams.find(
    w => w.id === idOrName || w.name.toLowerCase() === idOrName.toLowerCase()
  );

  if (!ws) {
    console.error(`Workstream not found: ${idOrName}`);
    return null;
  }

  const absPath = path.resolve(projectPath.replace(/^~/, process.env.HOME || ''));
  const idx = ws.projects.indexOf(absPath);

  if (idx !== -1) {
    ws.projects.splice(idx, 1);
    ws.updatedAt = new Date().toISOString();
    saveWorkstreams(installDir, data);
    console.log(`✓ Removed ${path.basename(absPath)} from ${ws.name}`);
  } else {
    console.log(`Project not in workstream: ${path.basename(absPath)}`);
  }

  return ws;
}

/**
 * Inject active workstream rules into Claude context
 */
function workstreamInject(installDir, silent = false) {
  const active = workstreamActive(installDir);

  if (!active) {
    if (!silent) console.log('No active workstream');
    return null;
  }

  if (!active.rules || active.rules.trim() === '') {
    if (!silent) console.log(`Workstream "${active.name}" has no rules defined`);
    return null;
  }

  const header = `## Active Workstream: ${active.name}\n\n`;
  const output = header + active.rules;

  if (!silent) {
    console.log(output);
  }

  return output;
}

/**
 * Detect workstream from current directory
 */
function workstreamDetect(installDir, dir = process.cwd()) {
  const data = loadWorkstreams(installDir);
  const absDir = path.resolve(dir.replace(/^~/, process.env.HOME || ''));

  const matches = data.workstreams.filter(ws =>
    ws.projects.some(p => absDir.startsWith(p) || p.startsWith(absDir))
  );

  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return matches[0];
  }

  if (data.lastUsedByProject && data.lastUsedByProject[absDir]) {
    const lastUsed = matches.find(ws => ws.id === data.lastUsedByProject[absDir]);
    if (lastUsed) return lastUsed;
  }

  return matches.sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  )[0];
}

/**
 * Get workstream by ID
 */
function workstreamGet(installDir, id) {
  const data = loadWorkstreams(installDir);
  return data.workstreams.find(w => w.id === id) || null;
}

module.exports = {
  getWorkstreamsPath,
  loadWorkstreams,
  saveWorkstreams,
  workstreamList,
  workstreamCreate,
  workstreamUpdate,
  workstreamDelete,
  workstreamUse,
  workstreamActive,
  workstreamAddProject,
  workstreamRemoveProject,
  workstreamInject,
  workstreamDetect,
  workstreamGet,
};
