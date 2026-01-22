import React, { useState, useMemo } from 'react';
import { Plug, Info, ChevronDown, Settings2, Check } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import McpServerConfigDialog from './McpServerConfigDialog';

/**
 * Quick MCP Permissions Toggle
 *
 * Shows all configured MCP servers and provides:
 * - A toggle to allow all tools for each server (mcp__servername__*)
 * - A configure button to open detailed permissions dialog
 */
export default function McpQuickPermissions({
  mcpServers = {},
  permissions = { allow: [], ask: [], deny: [] },
  onToggle,
  onUpdatePermission,
  readOnly = false
}) {
  const [open, setOpen] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);

  // Get server names from registry
  const serverNames = useMemo(() => {
    return Object.keys(mcpServers).sort();
  }, [mcpServers]);

  // Check if a server has "allow all" permission
  const isAllowed = (serverName) => {
    const pattern = `mcp__${serverName}__*`;
    return permissions.allow?.includes(pattern) || false;
  };

  // Count specific tool permissions for a server
  const getToolPermissionCount = (serverName) => {
    const prefix = `mcp__${serverName}__`;
    const wildcardPattern = `${prefix}*`;
    let count = 0;

    permissions.allow?.forEach(rule => {
      if (rule.startsWith(prefix) && rule !== wildcardPattern) count++;
    });
    permissions.ask?.forEach(rule => {
      if (rule.startsWith(prefix) && rule !== wildcardPattern) count++;
    });
    permissions.deny?.forEach(rule => {
      if (rule.startsWith(prefix) && rule !== wildcardPattern) count++;
    });

    return count;
  };

  // Handle toggle for a server (allow all)
  const handleToggle = (serverName, enabled) => {
    const pattern = `mcp__${serverName}__*`;
    onToggle?.(serverName, pattern, enabled);
  };

  // Open config dialog for a server
  const handleOpenConfig = (serverName, e) => {
    e.stopPropagation();
    setSelectedServer(serverName);
    setConfigDialogOpen(true);
  };

  if (serverNames.length === 0) {
    return null;
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Plug className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <span className="font-medium text-gray-900 dark:text-white">Quick MCP Permissions</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {serverNames.length} server{serverNames.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              open && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 rounded-lg border border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700">
            {serverNames.map((serverName) => {
              const allowed = isAllowed(serverName);
              const server = mcpServers[serverName];
              const serverType = server?.command ? 'stdio' : server?.url ? 'sse' : 'unknown';
              const toolCount = getToolPermissionCount(serverName);

              return (
                <div
                  key={serverName}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {serverName}
                        </span>
                        {allowed && (
                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            All
                          </Badge>
                        )}
                        {!allowed && toolCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {toolCount} tool{toolCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {serverType === 'stdio' && server.command}
                        {serverType === 'sse' && server.url}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(e) => handleOpenConfig(serverName, e)}
                      disabled={readOnly}
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Allow all
                      </span>
                      <Switch
                        checked={allowed}
                        onCheckedChange={(checked) => handleToggle(serverName, checked)}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Info footer */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/50 flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Click <Settings2 className="w-3 h-3 inline mx-0.5" /> to configure specific tool permissions
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Config Dialog */}
      {selectedServer && (
        <McpServerConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          serverName={selectedServer}
          serverConfig={mcpServers[selectedServer]}
          permissions={permissions}
          onUpdatePermissions={onUpdatePermission}
        />
      )}
    </>
  );
}
