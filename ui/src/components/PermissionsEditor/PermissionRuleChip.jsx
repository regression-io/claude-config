import React, { useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { parsePermissionRule, getPermissionTypeConfig } from './utils';

export default function PermissionRuleChip({
  rule,
  category,
  onEdit,
  onDelete,
  readOnly
}) {
  const [showActions, setShowActions] = useState(false);
  const parsed = parsePermissionRule(rule);
  const typeConfig = getPermissionTypeConfig(parsed.type);

  // Truncate long rules for display
  const displayRule = rule.length > 30 ? rule.substring(0, 27) + '...' : rule;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="secondary"
          className={cn(
            "relative cursor-pointer transition-all text-xs font-mono py-1 px-2 h-7",
            "hover:ring-2 hover:ring-offset-1",
            category === 'allow' && "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 hover:ring-green-400",
            category === 'ask' && "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:ring-amber-400",
            category === 'deny' && "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 hover:ring-red-400"
          )}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
          onClick={() => !readOnly && onEdit?.()}
        >
          <span className={cn(showActions && !readOnly && "opacity-50")}>
            {displayRule}
          </span>

          {showActions && !readOnly && (
            <span className="absolute inset-0 flex items-center justify-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm">
        <div className="space-y-1">
          <code className="text-xs break-all block">{rule}</code>
          <p className="text-xs text-gray-400">{parsed.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
