/**
 * Consistent color coding for config hierarchy levels
 */

export const LEVEL_COLORS = {
  global: {
    bg: 'bg-indigo-50',
    bgSolid: 'bg-indigo-500',
    border: 'border-indigo-200',
    borderSolid: 'border-indigo-500',
    text: 'text-indigo-700',
    textLight: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    hover: 'hover:bg-indigo-100 hover:border-indigo-300',
    ring: 'ring-indigo-500'
  },
  parent: {
    bg: 'bg-gray-50',
    bgSolid: 'bg-gray-400',
    border: 'border-gray-200',
    borderSolid: 'border-gray-400',
    text: 'text-gray-700',
    textLight: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600 border-gray-300',
    hover: 'hover:bg-gray-100 hover:border-gray-300',
    ring: 'ring-gray-400'
  },
  project: {
    bg: 'bg-green-50',
    bgSolid: 'bg-green-500',
    border: 'border-green-200',
    borderSolid: 'border-green-500',
    text: 'text-green-700',
    textLight: 'text-green-600',
    badge: 'bg-green-100 text-green-700 border-green-300',
    hover: 'hover:bg-green-100 hover:border-green-300',
    ring: 'ring-green-500'
  }
};

/**
 * Get the level type based on index in the config hierarchy
 * @param {number} index - Position in the configs array
 * @param {number} total - Total number of configs
 * @returns {'global' | 'parent' | 'project'}
 */
export function getLevelType(index, total) {
  if (index === 0) return 'global';
  if (index === total - 1) return 'project';
  return 'parent';
}

/**
 * Get colors for a specific level type
 * @param {'global' | 'parent' | 'project'} levelType
 * @returns {typeof LEVEL_COLORS.global}
 */
export function getLevelColors(levelType) {
  return LEVEL_COLORS[levelType] || LEVEL_COLORS.parent;
}

/**
 * Get the display label for a level
 * @param {number} index - Position in the configs array
 * @param {number} total - Total number of configs
 * @param {string} [dir] - Optional directory path for parent levels
 * @returns {string}
 */
export function getLevelLabel(index, total, dir) {
  if (index === 0) return 'Global (~)';
  if (index === total - 1) return 'Project';
  // For parent levels, show a shortened path or just "Parent"
  if (dir) {
    const parts = dir.split('/');
    return parts[parts.length - 1] || 'Parent';
  }
  return 'Parent';
}

/**
 * Get level info including type, colors, and label
 * @param {number} index
 * @param {number} total
 * @param {string} [dir]
 */
export function getLevelInfo(index, total, dir) {
  const type = getLevelType(index, total);
  return {
    type,
    colors: getLevelColors(type),
    label: getLevelLabel(index, total, dir)
  };
}
