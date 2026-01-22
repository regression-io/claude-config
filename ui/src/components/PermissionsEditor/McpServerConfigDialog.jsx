import React, { useState, useMemo, useEffect } from 'react';
import {
  Plug, Plus, Trash2, Check, X, Shield, Info, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Alert, AlertDescription
} from "@/components/ui/alert";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

/**
 * MCP Server Configuration Dialog
 *
 * Allows configuring permissions for a specific MCP server:
 * - Toggle "Allow all tools" (mcp__servername__*)
 * - Select specific tools from discovered list
 * - Set allow/ask/deny for each tool
 */
export default function McpServerConfigDialog({
  open,
  onOpenChange,
  serverName,
  serverConfig = {},
  permissions = { allow: [], ask: [], deny: [] },
  onUpdatePermissions
}) {
  const [availableTools, setAvailableTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualToolName, setManualToolName] = useState('');

  // Fetch tools when dialog opens
  useEffect(() => {
    if (open && serverName) {
      fetchTools();
    }
  }, [open, serverName]);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getMcpServerTools(serverName);
      if (result.error) {
        setError(result.error);
        setAvailableTools([]);
      } else {
        setAvailableTools(result.tools || []);
      }
    } catch (err) {
      setError(err.message);
      setAvailableTools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await api.clearMcpToolsCache(serverName);
    await fetchTools();
  };

  // Get current permissions state for this server
  const serverPermissions = useMemo(() => {
    const prefix = `mcp__${serverName}__`;
    const wildcardPattern = `${prefix}*`;

    const result = {
      allowAll: permissions.allow?.includes(wildcardPattern) || false,
      toolPermissions: {} // toolName -> 'allow' | 'ask' | 'deny'
    };

    // Extract specific tool permissions
    permissions.allow?.forEach(rule => {
      if (rule.startsWith(prefix) && rule !== wildcardPattern) {
        result.toolPermissions[rule.replace(prefix, '')] = 'allow';
      }
    });
    permissions.ask?.forEach(rule => {
      if (rule.startsWith(prefix) && rule !== wildcardPattern) {
        result.toolPermissions[rule.replace(prefix, '')] = 'ask';
      }
    });
    permissions.deny?.forEach(rule => {
      if (rule.startsWith(prefix) && rule !== wildcardPattern) {
        result.toolPermissions[rule.replace(prefix, '')] = 'deny';
      }
    });

    return result;
  }, [serverName, permissions]);

  // Combine discovered tools with any manually configured tools
  const allTools = useMemo(() => {
    const toolSet = new Set();

    // Add discovered tools
    availableTools.forEach(t => toolSet.add(t.name));

    // Add any tools that have permissions but weren't discovered
    Object.keys(serverPermissions.toolPermissions).forEach(t => toolSet.add(t));

    return Array.from(toolSet).sort().map(name => {
      const discovered = availableTools.find(t => t.name === name);
      return {
        name,
        description: discovered?.description || '',
        discovered: !!discovered
      };
    });
  }, [availableTools, serverPermissions.toolPermissions]);

  // Toggle allow all
  const handleToggleAllowAll = (enabled) => {
    const pattern = `mcp__${serverName}__*`;
    onUpdatePermissions?.(serverName, pattern, enabled ? 'allow' : 'remove');
  };

  // Change tool permission
  const handleToolPermissionChange = (toolName, category) => {
    const pattern = `mcp__${serverName}__${toolName}`;
    const currentPermission = serverPermissions.toolPermissions[toolName];

    // If clicking the same category, remove the permission
    if (currentPermission === category) {
      onUpdatePermissions?.(serverName, pattern, 'remove');
    } else {
      onUpdatePermissions?.(serverName, pattern, category);
    }
  };

  // Add manual tool
  const handleAddManualTool = () => {
    const toolName = manualToolName.trim();
    if (!toolName) return;

    const pattern = `mcp__${serverName}__${toolName}`;
    onUpdatePermissions?.(serverName, pattern, 'allow');
    setManualToolName('');
  };

  // Remove tool permission
  const handleRemoveTool = (toolName) => {
    const pattern = `mcp__${serverName}__${toolName}`;
    onUpdatePermissions?.(serverName, pattern, 'remove');
  };

  const serverType = serverConfig?.command ? 'stdio' : serverConfig?.url ? 'sse' : 'unknown';

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="w-5 h-5 text-purple-600" />
              Configure {serverName}
            </DialogTitle>
            <DialogDescription>
              {serverType === 'stdio' && serverConfig.command && (
                <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {serverConfig.command} {serverConfig.args?.slice(0, 2).join(' ')}
                  {serverConfig.args?.length > 2 && '...'}
                </code>
              )}
              {serverType === 'sse' && serverConfig.url && (
                <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {serverConfig.url}
                </code>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
            {/* Allow All Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="font-medium">Allow all tools</Label>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Grant permission for all tools from this server
                  </p>
                </div>
              </div>
              <Switch
                checked={serverPermissions.allowAll}
                onCheckedChange={handleToggleAllowAll}
              />
            </div>

            {serverPermissions.allowAll && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  All tools are allowed. Individual tool settings below are informational only.
                </AlertDescription>
              </Alert>
            )}

            {/* Tools Section */}
            <div className="flex-1 overflow-hidden flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Available Tools</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="h-7"
                >
                  <RefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    {error}
                    <p className="text-xs mt-1 opacity-80">
                      You can still add tools manually below.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Discovering tools...</span>
                </div>
              )}

              {/* Tools List */}
              {!loading && (
                <ScrollArea className="flex-1 min-h-0 rounded-md border border-gray-200 dark:border-slate-700">
                  <div className="divide-y divide-gray-200 dark:divide-slate-700">
                    {allTools.length > 0 ? (
                      allTools.map((tool) => {
                        const permission = serverPermissions.toolPermissions[tool.name];
                        return (
                          <div
                            key={tool.name}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono truncate">{tool.name}</code>
                                {!tool.discovered && (
                                  <Badge variant="outline" className="text-xs">manual</Badge>
                                )}
                              </div>
                              {tool.description && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                  {tool.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Permission toggles */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={permission === 'allow' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn(
                                      "h-7 w-7 p-0",
                                      permission === 'allow' && "bg-green-600 hover:bg-green-700"
                                    )}
                                    onClick={() => handleToolPermissionChange(tool.name, 'allow')}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Allow</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={permission === 'ask' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn(
                                      "h-7 w-7 p-0",
                                      permission === 'ask' && "bg-amber-600 hover:bg-amber-700"
                                    )}
                                    onClick={() => handleToolPermissionChange(tool.name, 'ask')}
                                  >
                                    ?
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ask</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={permission === 'deny' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn(
                                      "h-7 w-7 p-0",
                                      permission === 'deny' && "bg-red-600 hover:bg-red-700"
                                    )}
                                    onClick={() => handleToolPermissionChange(tool.name, 'deny')}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Deny</TooltipContent>
                              </Tooltip>

                              {!tool.discovered && permission && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                      onClick={() => handleRemoveTool(tool.name)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                        <p className="text-sm">No tools discovered</p>
                        <p className="text-xs mt-1">Add tools manually below</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Manual tool entry */}
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                <Input
                  value={manualToolName}
                  onChange={(e) => setManualToolName(e.target.value)}
                  placeholder="Add tool manually..."
                  className="flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddManualTool();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddManualTool}
                  disabled={!manualToolName.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Permission Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-200 dark:border-slate-700">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-600" />
                Allow
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-600" />
                Ask
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-600" />
                Deny
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <span className="text-gray-400">Click again to remove</span>
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
