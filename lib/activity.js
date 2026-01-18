/**
 * Activity tracking for workstream suggestions
 */

const fs = require('fs');
const path = require('path');
const { loadWorkstreams } = require('./workstreams');

/**
 * Get activity file path
 */
function getActivityPath(installDir) {
  return path.join(installDir, 'activity.json');
}

/**
 * Get default activity structure
 */
function getDefaultActivity() {
  return {
    sessions: [],
    projectStats: {},
    coActivity: {},
    lastUpdated: null
  };
}

/**
 * Load activity data
 */
function loadActivity(installDir) {
  const activityPath = getActivityPath(installDir);
  if (fs.existsSync(activityPath)) {
    try {
      return JSON.parse(fs.readFileSync(activityPath, 'utf8'));
    } catch (e) {
      return getDefaultActivity();
    }
  }
  return getDefaultActivity();
}

/**
 * Save activity data
 */
function saveActivity(installDir, data) {
  const activityPath = getActivityPath(installDir);
  const dir = path.dirname(activityPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(activityPath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Detect project root by finding .git or .claude folder
 */
function detectProjectRoot(filePath) {
  let dir = path.dirname(filePath);
  const home = process.env.HOME || '';

  while (dir && dir !== '/' && dir !== home) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, '.claude'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Log activity from a Claude session
 */
function activityLog(installDir, files, sessionId = null) {
  const data = loadActivity(installDir);
  const now = new Date().toISOString();

  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  let session = data.sessions.find(s => s.id === sessionId);
  if (!session) {
    session = { id: sessionId, startedAt: now, files: [], projects: [] };
    data.sessions.push(session);
  }

  const projectsInSession = new Set(session.projects);

  for (const file of files) {
    const rawPath = typeof file === 'string' ? file : file.path;
    if (!rawPath) continue;
    const filePath = path.resolve(rawPath.replace(/^~/, process.env.HOME || ''));
    const action = typeof file === 'object' ? (file.action || 'access') : 'access';

    session.files.push({ path: filePath, action, timestamp: now });

    const projectPath = detectProjectRoot(filePath);
    if (projectPath) {
      projectsInSession.add(projectPath);

      if (!data.projectStats[projectPath]) {
        data.projectStats[projectPath] = { fileCount: 0, lastActive: now, sessionCount: 0 };
      }
      data.projectStats[projectPath].fileCount++;
      data.projectStats[projectPath].lastActive = now;
    }
  }

  session.projects = Array.from(projectsInSession);

  const projects = session.projects;
  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const p1 = projects[i], p2 = projects[j];
      if (!data.coActivity[p1]) data.coActivity[p1] = {};
      if (!data.coActivity[p2]) data.coActivity[p2] = {};
      data.coActivity[p1][p2] = (data.coActivity[p1][p2] || 0) + 1;
      data.coActivity[p2][p1] = (data.coActivity[p2][p1] || 0) + 1;
    }
  }

  if (data.sessions.length > 100) {
    data.sessions = data.sessions.slice(-100);
  }

  saveActivity(installDir, data);
  return { sessionId, filesLogged: files.length, projects: session.projects };
}

/**
 * Get activity summary for UI
 */
function activitySummary(installDir) {
  const data = loadActivity(installDir);
  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const recentSessions = data.sessions.filter(s => new Date(s.startedAt) > oneDayAgo);

  const projectActivity = Object.entries(data.projectStats)
    .map(([projectPath, stats]) => ({
      path: projectPath,
      name: path.basename(projectPath),
      ...stats,
      isRecent: new Date(stats.lastActive) > oneDayAgo
    }))
    .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

  const coActiveProjects = [];
  for (const [project, coProjects] of Object.entries(data.coActivity)) {
    for (const [otherProject, count] of Object.entries(coProjects)) {
      if (count >= 2 && project < otherProject) {
        coActiveProjects.push({
          projects: [project, otherProject],
          names: [path.basename(project), path.basename(otherProject)],
          count
        });
      }
    }
  }
  coActiveProjects.sort((a, b) => b.count - a.count);

  const totalFiles = data.sessions.reduce((sum, s) => sum + (s.files?.length || 0), 0);

  return {
    totalSessions: data.sessions.length,
    recentSessions: recentSessions.length,
    totalFiles,
    projectCount: Object.keys(data.projectStats).length,
    topProjects: projectActivity.slice(0, 10),
    projectActivity: projectActivity.slice(0, 20),
    coActiveProjects: coActiveProjects.slice(0, 10),
    lastUpdated: data.lastUpdated
  };
}

/**
 * Generate a workstream name from project names
 */
function generateWorkstreamName(projects) {
  const names = projects.map(p => path.basename(p));
  if (names.length <= 2) return names.join(' + ');
  return `${names[0]} + ${names.length - 1} more`;
}

/**
 * Suggest workstreams based on activity patterns
 */
function activitySuggestWorkstreams(installDir) {
  const data = loadActivity(installDir);
  const workstreams = loadWorkstreams(installDir);
  const suggestions = [];

  const coGroups = new Map();

  for (const session of data.sessions) {
    if (session.projects.length >= 2) {
      const key = session.projects.sort().join('|');
      coGroups.set(key, (coGroups.get(key) || 0) + 1);
    }
  }

  for (const [key, count] of coGroups) {
    if (count >= 3) {
      const projects = key.split('|');
      const existingWs = workstreams.workstreams.find(ws =>
        projects.every(p => ws.projects.includes(p))
      );

      if (!existingWs) {
        const totalSessions = data.sessions.length;
        const coActivityScore = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;

        suggestions.push({
          projects,
          name: generateWorkstreamName(projects),
          names: projects.map(p => path.basename(p)),
          sessionCount: count,
          coActivityScore: Math.min(coActivityScore, 100),
        });
      }
    }
  }

  suggestions.sort((a, b) => b.sessionCount - a.sessionCount);
  return suggestions.slice(0, 5);
}

/**
 * Clear old activity data
 */
function activityClear(installDir, olderThanDays = 30) {
  const data = loadActivity(installDir);
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  data.sessions = data.sessions.filter(s => new Date(s.startedAt) > cutoff);
  data.projectStats = {};
  data.coActivity = {};

  for (const session of data.sessions) {
    for (const file of session.files) {
      const projectPath = detectProjectRoot(file.path);
      if (projectPath) {
        if (!data.projectStats[projectPath]) {
          data.projectStats[projectPath] = { fileCount: 0, lastActive: session.startedAt, sessionCount: 0 };
        }
        data.projectStats[projectPath].fileCount++;
        if (session.startedAt > data.projectStats[projectPath].lastActive) {
          data.projectStats[projectPath].lastActive = session.startedAt;
        }
      }
    }

    const projects = session.projects;
    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const p1 = projects[i], p2 = projects[j];
        if (!data.coActivity[p1]) data.coActivity[p1] = {};
        if (!data.coActivity[p2]) data.coActivity[p2] = {};
        data.coActivity[p1][p2] = (data.coActivity[p1][p2] || 0) + 1;
        data.coActivity[p2][p1] = (data.coActivity[p2][p1] || 0) + 1;
      }
    }
  }

  saveActivity(installDir, data);
  return { sessionsRemaining: data.sessions.length };
}

module.exports = {
  getActivityPath,
  getDefaultActivity,
  loadActivity,
  saveActivity,
  detectProjectRoot,
  activityLog,
  activitySummary,
  generateWorkstreamName,
  activitySuggestWorkstreams,
  activityClear,
};
