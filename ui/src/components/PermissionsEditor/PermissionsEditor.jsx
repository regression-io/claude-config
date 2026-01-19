import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Download, Upload, AlertTriangle, RefreshCw,
  ChevronDown, HelpCircle, Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from "@/components/ui/tooltip";
import {
  Alert, AlertDescription
} from "@/components/ui/alert";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import PermissionRuleItem from './PermissionRuleItem';
import PermissionRuleForm from './PermissionRuleForm';
import ImportExportDialog from './ImportExportDialog';
import { getCategoryConfig, getCategoryTooltip } from './utils';

export default function PermissionsEditor({
  permissions: initialPermissions,
  onSave,
  loading,
  readOnly = false
}) {
  const [permissions, setPermissions] = useState({
    allow: [],
    ask: [],
    deny: []
  });
  const [activeTab, setActiveTab] = useState('allow');
  const [saving, setSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Dialog states
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [importExportMode, setImportExportMode] = useState('export');

  // Sync with prop
  useEffect(() => {
    if (initialPermissions) {
      setPermissions({
        allow: initialPermissions.allow || [],
        ask: initialPermissions.ask || [],
        deny: initialPermissions.deny || []
      });
    }
  }, [initialPermissions]);

  // Auto-save helper
  const autoSave = useCallback(async (newPermissions) => {
    if (!onSave || readOnly) return;
    setSaving(true);
    try {
      await onSave(newPermissions);
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [onSave, readOnly]);

  // Add rule
  const handleAddRule = useCallback((category, rule) => {
    setPermissions(prev => {
      // Check if rule already exists in any category
      const allRules = [...prev.allow, ...prev.ask, ...prev.deny];
      if (allRules.includes(rule)) {
        toast.error('This rule already exists');
        return prev;
      }

      const newPermissions = {
        ...prev,
        [category]: [...prev[category], rule]
      };
      autoSave(newPermissions);
      toast.success(`Rule added to ${category}`);
      return newPermissions;
    });
  }, [autoSave]);

  // Edit rule
  const handleEditRule = useCallback((category, oldRule, newCategory, newRule) => {
    setPermissions(prev => {
      const updated = { ...prev };

      // Remove from old category
      updated[category] = updated[category].filter(r => r !== oldRule);

      // Add to new category
      updated[newCategory] = [...updated[newCategory], newRule];

      autoSave(updated);
      toast.success('Rule updated');
      return updated;
    });
  }, [autoSave]);

  // Delete rule
  const handleDeleteRule = useCallback((category, rule) => {
    setPermissions(prev => {
      const newPermissions = {
        ...prev,
        [category]: prev[category].filter(r => r !== rule)
      };
      autoSave(newPermissions);
      toast.success('Rule deleted');
      return newPermissions;
    });
  }, [autoSave]);

  // Move rule between categories
  const handleMoveRule = useCallback((fromCategory, rule, toCategory) => {
    setPermissions(prev => {
      const newPermissions = {
        ...prev,
        [fromCategory]: prev[fromCategory].filter(r => r !== rule),
        [toCategory]: [...prev[toCategory], rule]
      };
      autoSave(newPermissions);
      toast.success(`Moved to ${toCategory}`);
      return newPermissions;
    });
  }, [autoSave]);

  // Import permissions
  const handleImport = useCallback((newPermissions) => {
    const normalized = {
      allow: newPermissions.allow || [],
      ask: newPermissions.ask || [],
      deny: newPermissions.deny || []
    };
    setPermissions(normalized);
    autoSave(normalized);
    toast.success('Permissions imported');
  }, [autoSave]);

  // Open add dialog
  const openAddDialog = (category) => {
    setEditingRule(null);
    setActiveTab(category);
    setRuleFormOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (category, rule) => {
    setEditingRule({ category, rule });
    setRuleFormOpen(true);
  };

  const totalRules = permissions.allow.length + permissions.ask.length + permissions.deny.length;

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Claude Code Permissions</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Configure what Claude Code can do automatically
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving && (
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </Badge>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportExportMode('export');
                  setImportExportOpen(true);
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export permissions</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportExportMode('import');
                  setImportExportOpen(true);
                }}
                disabled={readOnly}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import permissions</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Help Section */}
      <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-gray-500 dark:text-slate-400">
            <HelpCircle className="w-4 h-4 mr-2" />
            How permissions work
            <ChevronDown className={cn(
              "w-4 h-4 ml-2 transition-transform",
              helpOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Alert className="mt-2">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              <p className="mb-2">
                Permissions control what Claude Code can do automatically vs. what requires your approval.
                These settings are stored in <code className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">~/.claude/settings.json</code>.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 mb-1">Allow</Badge>
                  <p className="text-xs text-gray-600 dark:text-slate-400">Operations run without asking</p>
                </div>
                <div>
                  <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 mb-1">Ask</Badge>
                  <p className="text-xs text-gray-600 dark:text-slate-400">Prompts for confirmation each time</p>
                </div>
                <div>
                  <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 mb-1">Deny</Badge>
                  <p className="text-xs text-gray-600 dark:text-slate-400">Blocked entirely</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
                Use wildcards: <code className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">*</code> matches anything,{' '}
                <code className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">**</code> matches recursively in paths.
              </p>
            </AlertDescription>
          </Alert>
        </CollapsibleContent>
      </Collapsible>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && totalRules === 0 && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            No permission rules configured. Claude Code will use default behavior and ask for permission on sensitive operations.
            <Button
              variant="link"
              size="sm"
              className="ml-2 p-0 h-auto"
              onClick={() => openAddDialog('allow')}
            >
              Add your first rule
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {['allow', 'ask', 'deny'].map(category => {
              const config = getCategoryConfig(category);
              const count = permissions[category]?.length || 0;
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex items-center gap-2"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    category === 'allow' && "bg-green-500",
                    category === 'ask' && "bg-amber-500",
                    category === 'deny' && "bg-red-500"
                  )} />
                  {config.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {['allow', 'ask', 'deny'].map(category => {
            const config = getCategoryConfig(category);
            const rules = permissions[category] || [];

            return (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm text-gray-500 dark:text-slate-400 cursor-help">
                        {config.description}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {getCategoryTooltip(category)}
                    </TooltipContent>
                  </Tooltip>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAddDialog(category)}
                    disabled={readOnly}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Rule
                  </Button>
                </div>

                {rules.length === 0 ? (
                  <div className={cn(
                    "text-center py-8 rounded-lg border-2 border-dashed",
                    config.borderColor
                  )}>
                    <p className="text-gray-500 dark:text-slate-400">No rules in {category}</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => openAddDialog(category)}
                      disabled={readOnly}
                    >
                      Add a rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {rules.map(rule => (
                        <PermissionRuleItem
                          key={rule}
                          rule={rule}
                          category={category}
                          onEdit={() => openEditDialog(category, rule)}
                          onDelete={() => handleDeleteRule(category, rule)}
                          onMove={(toCategory) => handleMoveRule(category, rule, toCategory)}
                          readOnly={readOnly}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Add/Edit Rule Dialog */}
      <PermissionRuleForm
        open={ruleFormOpen}
        onOpenChange={setRuleFormOpen}
        onSubmit={(category, rule) => {
          if (editingRule) {
            handleEditRule(editingRule.category, editingRule.rule, category, rule);
          } else {
            handleAddRule(category, rule);
          }
        }}
        defaultCategory={editingRule?.category || activeTab}
        defaultRule={editingRule?.rule || ''}
        isEditing={!!editingRule}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        mode={importExportMode}
        permissions={permissions}
        onImport={handleImport}
      />
    </div>
    </TooltipProvider>
  );
}
