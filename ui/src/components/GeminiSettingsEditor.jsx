import React, { useState } from 'react';
import { Settings, Save, Loader2, Palette, Monitor, Terminal, Shield, Sparkles, Server, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const THEMES = [
  { id: 'Default', name: 'Default' },
  { id: 'GitHub', name: 'GitHub' },
  { id: 'Monokai', name: 'Monokai' },
  { id: 'SolarizedDark', name: 'Solarized Dark' },
  { id: 'SolarizedLight', name: 'Solarized Light' },
];

export default function GeminiSettingsEditor({ settings, onSave, loading, settingsPath }) {
  const [localSettings, setLocalSettings] = useState(settings || {});
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('rich'); // 'rich' or 'json'
  const [jsonText, setJsonText] = useState(JSON.stringify(settings || {}, null, 2));
  const [addMcpDialog, setAddMcpDialog] = useState({ open: false, name: '', json: '' });
  const [expandedMcps, setExpandedMcps] = useState({});

  const handleSave = async () => {
    setSaving(true);
    try {
      if (viewMode === 'json') {
        try {
          const parsed = JSON.parse(jsonText);
          await onSave(parsed);
          setLocalSettings(parsed);
        } catch (e) {
          toast.error('Invalid JSON');
          setSaving(false);
          return;
        }
      } else {
        await onSave(localSettings);
        setJsonText(JSON.stringify(localSettings, null, 2));
      }
      toast.success('Settings saved');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const getSetting = (category, key, defaultValue = false) => {
    return localSettings?.[category]?.[key] ?? defaultValue;
  };

  // MCP management
  const mcpServers = localSettings.mcpServers || {};

  const addMcp = () => {
    const { name, json } = addMcpDialog;
    if (!name.trim()) {
      toast.error('Please enter a name for the MCP');
      return;
    }

    let config;
    try {
      config = JSON.parse(json);
    } catch (e) {
      toast.error('Invalid JSON configuration');
      return;
    }

    if (!config.command) {
      toast.error('MCP config must have a "command" field');
      return;
    }

    setLocalSettings(prev => ({
      ...prev,
      mcpServers: {
        ...prev.mcpServers,
        [name.trim()]: config
      }
    }));

    setAddMcpDialog({ open: false, name: '', json: '' });
    toast.success(`Added MCP: ${name}`);
  };

  const removeMcp = (name) => {
    setLocalSettings(prev => {
      const { [name]: _, ...rest } = prev.mcpServers || {};
      return { ...prev, mcpServers: rest };
    });
    toast.success(`Removed MCP: ${name}`);
  };

  const toggleMcpExpanded = (name) => {
    setExpandedMcps(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Gemini CLI Settings
              <Badge variant="outline" className="text-xs font-normal text-blue-600 border-blue-300 dark:border-blue-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Google
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Stored in: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{settingsPath}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'rich' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('rich')}
            >
              Settings
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'json' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => {
                setJsonText(JSON.stringify(localSettings, null, 2));
                setViewMode('json');
              }}
            >
              JSON
            </button>
          </div>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      {viewMode === 'json' ? (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="font-mono text-sm min-h-[500px] border-0 rounded-none resize-none"
            placeholder="{ }"
          />
        </div>
      ) : (
      <>

      {/* MCP Servers Section */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" />
            MCP Servers
            <Badge variant="secondary" className="text-xs">{Object.keys(mcpServers).length}</Badge>
          </h3>
          <Button size="sm" variant="outline" onClick={() => setAddMcpDialog({ open: true, name: '', json: '{\n  "command": "npx",\n  "args": ["-y", "@example/mcp-server"]\n}' })}>
            <Plus className="w-4 h-4 mr-1" />
            Add MCP
          </Button>
        </div>
        <div className="space-y-2">
          {Object.keys(mcpServers).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No MCP servers configured</p>
          ) : (
            Object.entries(mcpServers).map(([name, config]) => (
              <Collapsible key={name} open={expandedMcps[name]} onOpenChange={() => toggleMcpExpanded(name)}>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background group">
                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                    {expandedMcps[name] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <Server className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm">{name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{config.command}</span>
                  </CollapsibleTrigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={() => removeMcp(name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CollapsibleContent>
                  <div className="mt-2 ml-6 p-3 rounded-lg bg-muted/50 border">
                    <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </div>

      {/* Theme Section */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-blue-500" />
          Appearance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Theme</label>
              <p className="text-xs text-muted-foreground">Color theme for the CLI interface</p>
            </div>
            <Select
              value={getSetting('theme', 'name', 'Default')}
              onValueChange={(value) => updateSetting('theme', 'name', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map(theme => (
                  <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Output Format</label>
              <p className="text-xs text-muted-foreground">Format for CLI output</p>
            </div>
            <Select
              value={getSetting('core', 'outputFormat', 'text')}
              onValueChange={(value) => updateSetting('core', 'outputFormat', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* UI Display Options */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-blue-500" />
          Display Options
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Update Window Title</label>
              <p className="text-xs text-muted-foreground">Show status icons in terminal title</p>
            </div>
            <Switch
              checked={getSetting('ui', 'updateWindowTitle', true)}
              onCheckedChange={(checked) => updateSetting('ui', 'updateWindowTitle', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Show Line Numbers</label>
              <p className="text-xs text-muted-foreground">Display line numbers in chat</p>
            </div>
            <Switch
              checked={getSetting('ui', 'showLineNumbers', false)}
              onCheckedChange={(checked) => updateSetting('ui', 'showLineNumbers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Show Citations</label>
              <p className="text-xs text-muted-foreground">Show citations for generated text</p>
            </div>
            <Switch
              checked={getSetting('ui', 'showCitations', false)}
              onCheckedChange={(checked) => updateSetting('ui', 'showCitations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Hide Context Summary</label>
              <p className="text-xs text-muted-foreground">Hide GEMINI.md and MCP servers above input</p>
            </div>
            <Switch
              checked={getSetting('ui', 'hideContextSummary', false)}
              onCheckedChange={(checked) => updateSetting('ui', 'hideContextSummary', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Hide Working Directory</label>
              <p className="text-xs text-muted-foreground">Hide current directory path in footer</p>
            </div>
            <Switch
              checked={getSetting('ui', 'hideWorkingDirectory', false)}
              onCheckedChange={(checked) => updateSetting('ui', 'hideWorkingDirectory', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Hide Model Info</label>
              <p className="text-xs text-muted-foreground">Hide model name and context usage in footer</p>
            </div>
            <Switch
              checked={getSetting('ui', 'hideModelInfo', false)}
              onCheckedChange={(checked) => updateSetting('ui', 'hideModelInfo', checked)}
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-500" />
          Advanced
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Vim Keybindings</label>
              <p className="text-xs text-muted-foreground">Use Vim keybindings in the prompt editor</p>
            </div>
            <Switch
              checked={getSetting('core', 'enableVimKeybindings', false)}
              onCheckedChange={(checked) => updateSetting('core', 'enableVimKeybindings', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Auto-Compress History</label>
              <p className="text-xs text-muted-foreground">Compress conversation when context exceeds threshold</p>
            </div>
            <Switch
              checked={getSetting('core', 'autoCompressHistory', true)}
              onCheckedChange={(checked) => updateSetting('core', 'autoCompressHistory', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Sandbox Mode</label>
              <p className="text-xs text-muted-foreground">Run tool executions in isolated container</p>
            </div>
            <Switch
              checked={getSetting('sandbox', 'enabled', false)}
              onCheckedChange={(checked) => updateSetting('sandbox', 'enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                YOLO Mode
                <Badge variant="destructive" className="text-xs">Dangerous</Badge>
              </label>
              <p className="text-xs text-muted-foreground">Auto-approve all tool calls without confirmation</p>
            </div>
            <Switch
              checked={getSetting('core', 'yoloMode', false)}
              onCheckedChange={(checked) => updateSetting('core', 'yoloMode', checked)}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          Privacy
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Usage Statistics</label>
              <p className="text-xs text-muted-foreground">Allow collection of anonymous usage data</p>
            </div>
            <Switch
              checked={getSetting('privacy', 'usageStatisticsEnabled', true)}
              onCheckedChange={(checked) => updateSetting('privacy', 'usageStatisticsEnabled', checked)}
            />
          </div>
        </div>
      </div>
      </>
      )}

      {/* Add MCP Dialog */}
      <Dialog open={addMcpDialog.open} onOpenChange={(open) => setAddMcpDialog({ ...addMcpDialog, open })}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Add a new MCP server to Gemini CLI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={addMcpDialog.name}
                onChange={(e) => setAddMcpDialog({ ...addMcpDialog, name: e.target.value })}
                placeholder="my-mcp-server"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Configuration (JSON)</label>
              <Textarea
                value={addMcpDialog.json}
                onChange={(e) => setAddMcpDialog({ ...addMcpDialog, json: e.target.value })}
                className="mt-1 font-mono text-sm"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddMcpDialog({ open: false, name: '', json: '' })}>
              Cancel
            </Button>
            <Button onClick={addMcp}>
              <Plus className="w-4 h-4 mr-2" />
              Add MCP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
