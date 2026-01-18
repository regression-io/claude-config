/**
 * Activity Tracking Routes
 */

/**
 * Get activity summary
 */
function getActivitySummary(manager) {
  try {
    return manager.activitySummary();
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Log activity
 */
function logActivity(manager, files, sessionId) {
  try {
    if (!files || !Array.isArray(files)) {
      return { error: 'files must be an array' };
    }
    return manager.activityLog(files, sessionId);
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get workstream suggestions
 */
function getWorkstreamSuggestions(manager) {
  try {
    const suggestions = manager.activitySuggestWorkstreams();
    return { suggestions };
  } catch (e) {
    return { suggestions: [], error: e.message };
  }
}

/**
 * Clear activity
 */
function clearActivity(manager, olderThanDays = 30) {
  try {
    return manager.activityClear(olderThanDays);
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = {
  getActivitySummary,
  logActivity,
  getWorkstreamSuggestions,
  clearActivity,
};
