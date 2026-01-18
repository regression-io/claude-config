/**
 * Smart Sync Routes
 */

/**
 * Get smart sync status
 */
function getSmartSyncStatus(manager) {
  try {
    return manager.smartSyncStatus();
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Detect workstream from projects
 */
function smartSyncDetect(manager, projects) {
  try {
    return manager.smartSyncDetect(projects || []);
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Check for nudge
 */
function smartSyncCheckNudge(manager, projects) {
  try {
    return manager.smartSyncCheckNudge(projects || []);
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Handle nudge action
 */
function smartSyncHandleAction(manager, nudgeKey, action, context) {
  try {
    return manager.smartSyncHandleAction(nudgeKey, action, context || {});
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Update smart sync settings
 */
function smartSyncUpdateSettings(manager, settings) {
  try {
    return manager.smartSyncUpdateSettings(settings);
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Remember choice
 */
function smartSyncRememberChoice(manager, projectPath, workstreamId, choice) {
  try {
    return manager.smartSyncRememberChoice(projectPath, workstreamId, choice);
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = {
  getSmartSyncStatus,
  smartSyncDetect,
  smartSyncCheckNudge,
  smartSyncHandleAction,
  smartSyncUpdateSettings,
  smartSyncRememberChoice,
};
