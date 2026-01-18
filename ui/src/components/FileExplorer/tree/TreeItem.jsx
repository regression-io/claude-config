import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { FILE_CONFIG } from '../fileConfig';

export default function TreeItem({
  item,
  level = 0,
  selectedPath,
  onSelect,
  onContextMenu,
  expandedFolders,
  onToggleFolder
}) {
  const config = FILE_CONFIG[item.type] || FILE_CONFIG.folder;
  const Icon = config.icon;
  const isSelected = selectedPath === item.path;
  const isFolder = item.type === 'folder';
  const isExpanded = expandedFolders[item.path];

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm',
          'hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors',
          isSelected && 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/30'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => isFolder ? onToggleFolder(item.path) : onSelect(item)}
        onContextMenu={(e) => onContextMenu(e, item)}
      >
        {isFolder && (
          <span className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
        {!isFolder && <span className="w-4" />}
        <Icon className={cn('w-4 h-4', config.color)} />
        <span className="flex-1 truncate">{item.name}</span>
        {item.mcpCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {item.mcpCount}
          </Badge>
        )}
      </div>

      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <TreeItem
              key={child.path}
              item={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
