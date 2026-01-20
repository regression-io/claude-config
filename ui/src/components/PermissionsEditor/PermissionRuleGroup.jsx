import React, { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PermissionRuleChip from './PermissionRuleChip';

const TYPE_CONFIG = {
  Bash: { label: 'Bash', color: 'text-purple-600 dark:text-purple-400' },
  Read: { label: 'Read', color: 'text-blue-600 dark:text-blue-400' },
  Edit: { label: 'Edit', color: 'text-orange-600 dark:text-orange-400' },
  Write: { label: 'Write', color: 'text-green-600 dark:text-green-400' },
  WebFetch: { label: 'WebFetch', color: 'text-cyan-600 dark:text-cyan-400' },
  WebSearch: { label: 'WebSearch', color: 'text-teal-600 dark:text-teal-400' },
  mcp: { label: 'MCP', color: 'text-indigo-600 dark:text-indigo-400' },
  other: { label: 'Other', color: 'text-gray-600 dark:text-gray-400' },
};

export default function PermissionRuleGroup({
  type,
  rules,
  category,
  onEdit,
  onDelete,
  onAddRule,
  readOnly,
  defaultExpanded = false
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || rules.length <= 5);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.other;

  if (rules.length === 0) return null;

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-left",
          "bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800",
          "transition-colors"
        )}
      >
        <ChevronRight className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          expanded && "rotate-90"
        )} />
        <span className={cn("font-medium text-sm", config.color)}>
          {config.label}
        </span>
        <Badge variant="secondary" className="text-xs">
          {rules.length}
        </Badge>

        {!expanded && rules.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-slate-500 truncate flex-1 ml-2">
            {rules.slice(0, 3).join(', ')}{rules.length > 3 && '...'}
          </span>
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-3 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap gap-2">
            {rules.map(rule => (
              <PermissionRuleChip
                key={rule}
                rule={rule}
                category={category}
                onEdit={() => onEdit(rule)}
                onDelete={() => onDelete(rule)}
                readOnly={readOnly}
              />
            ))}

            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onAddRule}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
