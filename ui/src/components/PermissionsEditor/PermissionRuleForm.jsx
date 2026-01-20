import React, { useState, useMemo, useEffect } from 'react';
import {
  Terminal, FileText, FileEdit, Pencil, Globe, Search, Plug,
  AlertCircle, Wand2, HelpCircle, Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PERMISSION_TYPES, PRESET_PATTERNS } from './constants';
import { parsePermissionRule, validateRule, buildRule } from './utils';

export default function PermissionRuleForm({
  open,
  onOpenChange,
  onSubmit,
  defaultCategory = 'allow',
  defaultRule = '',
  isEditing = false,
  existingRules = [] // To filter out already-added rules
}) {
  const [mode, setMode] = useState('preset');
  const [category, setCategory] = useState(defaultCategory);
  const [ruleType, setRuleType] = useState('Bash');
  const [ruleValue, setRuleValue] = useState('');
  const [freeformRule, setFreeformRule] = useState(defaultRule);
  const [selectedPresets, setSelectedPresets] = useState(new Set());
  const [presetSearch, setPresetSearch] = useState('');
  const [validationError, setValidationError] = useState(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setSelectedPresets(new Set());
      setPresetSearch('');
      if (defaultRule && isEditing) {
        const parsed = parsePermissionRule(defaultRule);
        setRuleType(parsed.type === 'unknown' ? 'Bash' : parsed.type);
        setRuleValue(parsed.value);
        setFreeformRule(defaultRule);
        setMode('builder');
      } else {
        setRuleType('Bash');
        setRuleValue('');
        setFreeformRule('');
        setMode('preset');
      }
    }
  }, [open, defaultRule, defaultCategory, isEditing]);

  // Toggle preset selection
  const togglePreset = (pattern) => {
    setSelectedPresets(prev => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  };

  // Select all visible presets
  const selectAllPresets = () => {
    const patterns = filteredPresets
      .filter(p => !existingRules.includes(p.pattern))
      .map(p => p.pattern);
    setSelectedPresets(new Set(patterns));
  };

  // Clear all selections
  const clearPresets = () => {
    setSelectedPresets(new Set());
  };

  // Build rule from components (for builder/freeform modes)
  const builtRule = useMemo(() => {
    if (mode === 'freeform') {
      return freeformRule;
    }
    if (mode === 'builder') {
      return buildRule(ruleType, ruleValue);
    }
    return '';
  }, [mode, ruleType, ruleValue, freeformRule]);

  // Validate on change (only for non-preset modes)
  useEffect(() => {
    if (mode !== 'preset') {
      const error = validateRule(builtRule);
      setValidationError(error);
    } else {
      setValidationError(null);
    }
  }, [builtRule, mode]);

  // Filter presets by search
  const filteredPresets = useMemo(() => {
    if (!presetSearch) return PRESET_PATTERNS;
    const search = presetSearch.toLowerCase();
    return PRESET_PATTERNS.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.pattern.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  }, [presetSearch]);

  // Group presets by category
  const groupedPresets = useMemo(() => {
    const groups = {};
    filteredPresets.forEach(preset => {
      if (!groups[preset.category]) {
        groups[preset.category] = [];
      }
      groups[preset.category].push(preset);
    });
    return groups;
  }, [filteredPresets]);

  const handleSubmit = () => {
    if (mode === 'preset') {
      // Submit all selected presets
      const rules = Array.from(selectedPresets);
      if (rules.length === 0) return;

      for (const rule of rules) {
        onSubmit(category, rule);
      }
      onOpenChange(false);
    } else {
      // Submit single rule from builder/freeform
      if (validationError || !builtRule) return;
      onSubmit(category, builtRule);
      onOpenChange(false);
    }
  };

  // Determine if submit is disabled
  const isSubmitDisabled = mode === 'preset'
    ? selectedPresets.size === 0
    : !builtRule || !!validationError;

  const quickExamples = getQuickExamples(ruleType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 text-indigo-600" />
                Edit Permission Rule
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-indigo-600" />
                Add Permission Rule
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Create a permission rule to control Claude Code's behavior.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Permission Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Allow - Execute without asking
                  </div>
                </SelectItem>
                <SelectItem value="ask">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    Ask - Require confirmation
                  </div>
                </SelectItem>
                <SelectItem value="deny">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Deny - Block entirely
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preset">
                <Wand2 className="w-4 h-4 mr-2" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="builder">
                <Terminal className="w-4 h-4 mr-2" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="freeform">
                <FileEdit className="w-4 h-4 mr-2" />
                Freeform
              </TabsTrigger>
            </TabsList>

            {/* Preset Selection */}
            <TabsContent value="preset" className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search presets..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPresets}
                  disabled={filteredPresets.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPresets}
                  disabled={selectedPresets.size === 0}
                >
                  Clear
                </Button>
              </div>

              {selectedPresets.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                  <Check className="w-4 h-4" />
                  {selectedPresets.size} preset{selectedPresets.size !== 1 ? 's' : ''} selected
                </div>
              )}

              <div className="border border-gray-200 dark:border-slate-700 rounded-lg max-h-[220px] overflow-auto">
                {Object.entries(groupedPresets).map(([cat, presets]) => (
                  <div key={cat} className="border-b border-gray-200 dark:border-slate-700 last:border-b-0">
                    <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 font-medium text-xs text-gray-600 dark:text-slate-300 sticky top-0">
                      {cat}
                    </div>
                    {presets.map(preset => {
                      const PresetIcon = preset.icon;
                      const isSelected = selectedPresets.has(preset.pattern);
                      const isExisting = existingRules.includes(preset.pattern);
                      return (
                        <label
                          key={preset.pattern}
                          className={cn(
                            "flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors",
                            isExisting
                              ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800"
                              : isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/50"
                                : "hover:bg-gray-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => !isExisting && togglePreset(preset.pattern)}
                            disabled={isExisting}
                            className="mt-0.5"
                          />
                          <PresetIcon className="w-4 h-4 mt-0.5 text-gray-400 dark:text-slate-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{preset.name}</span>
                              {isExisting && (
                                <Badge variant="secondary" className="text-xs">Added</Badge>
                              )}
                            </div>
                            <code className="text-xs text-gray-500 dark:text-slate-400 block truncate">
                              {preset.pattern}
                            </code>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Pattern Builder */}
            <TabsContent value="builder" className="space-y-4">
              <div className="space-y-2">
                <Label>Permission Type</Label>
                <Select value={ruleType} onValueChange={setRuleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_TYPES.map(type => {
                      const TypeIcon = type.icon;
                      return (
                        <SelectItem key={type.name} value={type.name}>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4" />
                            {type.name}
                            <span className="text-xs text-gray-400 dark:text-slate-500">- {type.description}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    {getValueLabel(ruleType)}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {getValueHint(ruleType)}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {ruleType === 'WebSearch' ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                    WebSearch does not require a value pattern.
                  </p>
                ) : (
                  <Input
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    placeholder={ruleType === 'Bash' ? 'command:arguments' : 'path/pattern'}
                    className="font-mono"
                  />
                )}
              </div>

              {/* Quick examples */}
              {quickExamples.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 dark:text-slate-400">Quick examples:</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickExamples.map(example => (
                      <Button
                        key={example.value}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setRuleValue(example.value)}
                      >
                        {example.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Freeform Input */}
            <TabsContent value="freeform" className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Pattern</Label>
                <Textarea
                  value={freeformRule}
                  onChange={(e) => setFreeformRule(e.target.value)}
                  placeholder="e.g., Bash(npm run build), Read(**/*.ts)"
                  className="font-mono text-sm"
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Enter the full permission pattern. Use * for wildcards and : for Bash argument separation.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview - only show for builder/freeform modes */}
          {mode !== 'preset' && (
            <div className="space-y-2">
              <Label>Generated Rule</Label>
              <div className={cn(
                "p-3 rounded-lg border font-mono text-sm",
                validationError
                  ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                  : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300"
              )}>
                {builtRule || <span className="text-gray-400 dark:text-slate-500">No rule configured</span>}
              </div>
              {validationError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {validationError}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isEditing
              ? 'Update Rule'
              : mode === 'preset' && selectedPresets.size > 1
                ? `Add ${selectedPresets.size} Rules`
                : 'Add Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getValueLabel(type) {
  const labels = {
    Bash: 'Command Pattern',
    Read: 'File Path Pattern',
    Edit: 'File Path Pattern',
    Write: 'File Path Pattern',
    WebFetch: 'URL Pattern',
    WebSearch: 'N/A',
    mcp: 'Tool Name'
  };
  return labels[type] || 'Value';
}

function getValueHint(type) {
  const hints = {
    Bash: 'Format: command:arguments. Use * for wildcards. Example: npm run:* matches npm run build, npm run test, etc.',
    Read: 'File path pattern. Use ** for recursive matching. Example: **/*.ts matches all TypeScript files.',
    Edit: 'File path pattern. Use ** for recursive matching.',
    Write: 'File path pattern. Use ** for recursive matching.',
    WebFetch: 'URL pattern. Example: https://api.github.com/* matches all GitHub API calls.',
    WebSearch: 'No value needed - this enables/disables web search entirely.',
    mcp: 'MCP tool name in format: mcp__server__tool'
  };
  return hints[type] || '';
}

function getQuickExamples(type) {
  const examples = {
    Bash: [
      { label: 'npm run *', value: 'npm run:*' },
      { label: 'git add *', value: 'git add:*' },
      { label: 'git commit *', value: 'git commit:*' },
      { label: 'ls *', value: 'ls:*' },
    ],
    Read: [
      { label: 'All files', value: '**' },
      { label: 'TypeScript', value: '**/*.ts' },
      { label: 'Source only', value: './src/**' },
    ],
    Edit: [
      { label: 'All files', value: '**' },
      { label: 'Source only', value: './src/**' },
    ],
    Write: [
      { label: 'All files', value: '**' },
    ],
    WebFetch: [
      { label: 'Any URL', value: '*' },
      { label: 'GitHub API', value: 'https://api.github.com/*' },
    ],
    mcp: [
      { label: 'Filesystem read', value: 'mcp__filesystem__read_file' },
      { label: 'GitHub PR', value: 'mcp__github__create_pull_request' },
    ],
  };
  return examples[type] || [];
}
