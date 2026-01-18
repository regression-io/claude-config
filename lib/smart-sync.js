/**
 * Smart Sync - Auto-detect and nudge workstream switching
 */

const fs = require('fs');
const path = require('path');
const { loadWorkstreams, workstreamUse, workstreamAddProject } = require('./workstreams');
const { loadActivity } = require('./activity');

/**
 * Get path to smart sync preferences file
 */
function getSmartSyncPath(installDir) {
  return path.join(installDir, 'smart-sync.json');
}

/**
 * Load smart sync preferences
 */
function loadSmartSyncPrefs(installDir) {
  const prefsPath = getSmartSyncPath(installDir);
  try {
    if (fs.existsSync(prefsPath)) {
      return JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    }
  } catch (e) {
    // Ignore errors, return defaults
  }
  return {
    enabled: true,
    autoSwitchThreshold: 80,
    projectChoices: {},
    dismissedNudges: [],
    lastActiveWorkstream: null,
    lastNudgeTime: null
  };
}

/**
 * Save smart sync preferences
 */
function saveSmartSyncPrefs(installDir, prefs) {
  const prefsPath = getSmartSyncPath(installDir);
  fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
}

/**
 * Remember user's choice for a project-workstream association
 */
function smartSyncRememberChoice(installDir, projectPath, workstreamId, choice) {
  const prefs = loadSmartSyncPrefs(installDir);
  prefs.projectChoices[projectPath] = { workstreamId, choice, savedAt: new Date().toISOString() };
  saveSmartSyncPrefs(installDir, prefs);
  return { success: true, projectPath, workstreamId, choice };
}

/**
 * Dismiss a nudge so it won't show again
 */
function smartSyncDismissNudge(installDir, nudgeKey) {
  const prefs = loadSmartSyncPrefs(installDir);
  if (!prefs.dismissedNudges.includes(nudgeKey)) {
    prefs.dismissedNudges.push(nudgeKey);
  }
  saveSmartSyncPrefs(installDir, prefs);
  return { success: true, nudgeKey };
}

/**
 * Update smart sync settings
 */
function smartSyncUpdateSettings(installDir, settings) {
  const prefs = loadSmartSyncPrefs(installDir);
  if (settings.enabled !== undefined) prefs.enabled = settings.enabled;
  if (settings.autoSwitchThreshold !== undefined) prefs.autoSwitchThreshold = settings.autoSwitchThreshold;
  saveSmartSyncPrefs(installDir, prefs);
  return { success: true, settings: prefs };
}

/**
 * Detect which workstream best matches current activity
 */
function smartSyncDetect(installDir, currentProjects = []) {
  const prefs = loadSmartSyncPrefs(installDir);
  const workstreams = loadWorkstreams(installDir);

  if (!prefs.enabled || !currentProjects.length || !workstreams.workstreams.length) {
    return { suggestion: null, reason: 'disabled_or_no_data' };
  }

  for (const projectPath of currentProjects) {
    const choice = prefs.projectChoices[projectPath];
    if (choice && choice.choice === 'always') {
      const ws = workstreams.workstreams.find(w => w.id === choice.workstreamId);
      if (ws) {
        return {
          suggestion: ws,
          confidence: 100,
          reason: 'user_preference',
          autoSwitch: true
        };
      }
    }
  }

  const excludedWorkstreams = new Set();
  for (const projectPath of currentProjects) {
    const choice = prefs.projectChoices[projectPath];
    if (choice && choice.choice === 'never') {
      excludedWorkstreams.add(choice.workstreamId);
    }
  }

  const scores = [];
  for (const ws of workstreams.workstreams) {
    if (excludedWorkstreams.has(ws.id)) continue;
    if (ws.id === workstreams.activeId) continue;

    const wsProjects = ws.projects || [];
    if (wsProjects.length === 0) continue;

    const matchingProjects = currentProjects.filter(p => wsProjects.includes(p));
    const overlapPercent = (matchingProjects.length / currentProjects.length) * 100;
    const coveragePercent = (matchingProjects.length / wsProjects.length) * 100;
    const confidence = Math.round((overlapPercent * 0.7) + (coveragePercent * 0.3));

    if (confidence > 0) {
      scores.push({
        workstream: ws,
        confidence,
        matchingProjects,
        overlapPercent,
        coveragePercent
      });
    }
  }

  scores.sort((a, b) => b.confidence - a.confidence);

  if (scores.length === 0) {
    return { suggestion: null, reason: 'no_matching_workstream' };
  }

  const best = scores[0];
  const shouldAutoSwitch = best.confidence >= prefs.autoSwitchThreshold;

  return {
    suggestion: best.workstream,
    confidence: best.confidence,
    matchingProjects: best.matchingProjects,
    reason: shouldAutoSwitch ? 'high_confidence_match' : 'partial_match',
    autoSwitch: shouldAutoSwitch,
    alternatives: scores.slice(1, 3).map(s => ({
      workstream: s.workstream,
      confidence: s.confidence
    }))
  };
}

/**
 * Check if we should show a nudge and what type
 */
function smartSyncCheckNudge(installDir, currentProjects = []) {
  const prefs = loadSmartSyncPrefs(installDir);
  const workstreams = loadWorkstreams(installDir);
  const activeWs = workstreams.workstreams.find(w => w.id === workstreams.activeId);

  if (!prefs.enabled || !currentProjects.length) {
    return null;
  }

  if (prefs.lastNudgeTime) {
    const timeSince = Date.now() - new Date(prefs.lastNudgeTime).getTime();
    if (timeSince < 5 * 60 * 1000) {
      return null;
    }
  }

  const nudges = [];

  const detection = smartSyncDetect(installDir, currentProjects);
  if (detection.suggestion && detection.confidence >= 50) {
    const nudgeKey = `switch:${detection.suggestion.id}`;
    if (!prefs.dismissedNudges.includes(nudgeKey)) {
      nudges.push({
        type: 'switch',
        key: nudgeKey,
        message: `Working on ${currentProjects.map(p => path.basename(p)).join(', ')}. Switch to "${detection.suggestion.name}"?`,
        workstream: detection.suggestion,
        confidence: detection.confidence,
        autoSwitch: detection.autoSwitch,
        actions: [
          { label: 'Yes', action: 'switch' },
          { label: 'No', action: 'dismiss' },
          { label: 'Always', action: 'always' }
        ]
      });
    }
  }

  if (activeWs) {
    for (const projectPath of currentProjects) {
      if (!activeWs.projects?.includes(projectPath)) {
        const nudgeKey = `add:${activeWs.id}:${projectPath}`;
        if (!prefs.dismissedNudges.includes(nudgeKey)) {
          const inOtherWs = workstreams.workstreams.some(
            ws => ws.id !== activeWs.id && ws.projects?.includes(projectPath)
          );
          if (!inOtherWs) {
            nudges.push({
              type: 'add_project',
              key: nudgeKey,
              message: `New project "${path.basename(projectPath)}" detected. Add to "${activeWs.name}"?`,
              workstream: activeWs,
              projectPath,
              actions: [
                { label: 'Yes', action: 'add' },
                { label: 'No', action: 'dismiss' },
                { label: 'Never', action: 'never' }
              ]
            });
          }
        }
      }
    }
  }

  if (nudges.length === 0) {
    return null;
  }

  const nudge = nudges.find(n => n.type === 'switch') || nudges[0];

  prefs.lastNudgeTime = new Date().toISOString();
  saveSmartSyncPrefs(installDir, prefs);

  return nudge;
}

/**
 * Handle a nudge action
 */
function smartSyncHandleAction(installDir, nudgeKey, action, context = {}) {
  const prefs = loadSmartSyncPrefs(installDir);

  switch (action) {
    case 'switch':
      if (context.workstreamId) {
        workstreamUse(installDir, context.workstreamId);
      }
      break;

    case 'add':
      if (context.workstreamId && context.projectPath) {
        workstreamAddProject(installDir, context.workstreamId, context.projectPath);
      }
      break;

    case 'always':
      if (context.workstreamId && context.projects) {
        for (const projectPath of context.projects) {
          smartSyncRememberChoice(installDir, projectPath, context.workstreamId, 'always');
        }
      }
      if (context.workstreamId) {
        workstreamUse(installDir, context.workstreamId);
      }
      break;

    case 'never':
      if (context.workstreamId && context.projectPath) {
        smartSyncRememberChoice(installDir, context.projectPath, context.workstreamId, 'never');
      }
      smartSyncDismissNudge(installDir, nudgeKey);
      break;

    case 'dismiss':
      smartSyncDismissNudge(installDir, nudgeKey);
      break;
  }

  return { success: true, action, nudgeKey };
}

/**
 * Get smart sync status and settings
 */
function smartSyncStatus(installDir) {
  const prefs = loadSmartSyncPrefs(installDir);
  const activity = loadActivity(installDir);

  const recentProjects = [];
  const recentSessions = activity.sessions.slice(-5);
  for (const session of recentSessions) {
    for (const proj of session.projects || []) {
      if (!recentProjects.includes(proj)) {
        recentProjects.push(proj);
      }
    }
  }

  return {
    enabled: prefs.enabled,
    autoSwitchThreshold: prefs.autoSwitchThreshold,
    savedChoicesCount: Object.keys(prefs.projectChoices).length,
    dismissedNudgesCount: prefs.dismissedNudges.length,
    recentProjects: recentProjects.slice(0, 10),
    lastNudgeTime: prefs.lastNudgeTime
  };
}

module.exports = {
  getSmartSyncPath,
  loadSmartSyncPrefs,
  saveSmartSyncPrefs,
  smartSyncRememberChoice,
  smartSyncDismissNudge,
  smartSyncUpdateSettings,
  smartSyncDetect,
  smartSyncCheckNudge,
  smartSyncHandleAction,
  smartSyncStatus,
};
