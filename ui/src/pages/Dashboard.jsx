import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, FolderTree, Plug, Package, FileText, Zap,
  Layout, Lock, ChevronRight, Plus, Save, Trash2,
  RefreshCw, Rocket, Edit3, ExternalLink, Search,
  Home, Folder, FileCode, Terminal as TerminalIcon, Copy,
  Check, X, MoreVertical, Eye, Upload, Loader2,
  Github, Star, Globe, Wand2, Play, Square, FolderOpen, Clipboard,
  Brain, Clock, AlertCircle, BookOpen
} from 'lucide-react';
import TerminalComponent from "@/components/Terminal";
import FileExplorer from "@/components/FileExplorer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ConfigEditor, { MarkdownEditor } from "@/components/ConfigEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { getLevelType, getLevelColors, getLevelLabel, getLevelInfo } from "@/lib/levelColors";

const navItems = [
  { id: 'explorer', label: 'File Explorer', icon: FolderOpen, section: 'Projects' },
  { id: 'subprojects', label: 'Sub-Projects', icon: Folder, section: 'Projects', badge: 'subprojects' },
  { id: 'registry', label: 'MCP Registry', icon: Package, section: 'Configuration' },
  { id: 'memory', label: 'Memory', icon: Brain, section: 'Configuration' },
  { id: 'templates', label: 'Templates', icon: Layout, section: 'Tools' },
  { id: 'env', label: 'Environment', icon: Lock, section: 'Tools' },
  { id: 'create-mcp', label: 'Create MCP', icon: Wand2, section: 'Developer' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
];

// Helper to get/set localStorage with JSON
const getStoredState = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(`claude-config-${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStoredState = (key, value) => {
  try {
    localStorage.setItem(`claude-config-${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

export default function Dashboard() {
  const [currentView, setCurrentView] = useState(() => getStoredState('currentView', 'explorer'));
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState({ dir: '', subprojects: [], hierarchy: [] });
  const [configs, setConfigs] = useState([]);
  const [registry, setRegistry] = useState({ mcpServers: {} });
  const [rules, setRules] = useState([]);
  const [commands, setCommands] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [fileHashes, setFileHashes] = useState({});

  // Persist currentView to localStorage
  useEffect(() => {
    setStoredState('currentView', currentView);
  }, [currentView]);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [projectData, configsData, registryData, rulesData, commandsData, templatesData] = await Promise.all([
        api.getProject(),
        api.getConfigs(),
        api.getRegistry(),
        api.getRules(),
        api.getCommands(),
        api.getTemplates(),
      ]);

      setProject(projectData);
      setConfigs(configsData);
      setRegistry(registryData);
      setRules(rulesData);
      setCommands(commandsData);
      setTemplates(templatesData);

      // Select the project-level config by default
      if (configsData.length > 0 && !selectedConfig) {
        setSelectedConfig(configsData[configsData.length - 1]);
      }
    } catch (error) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedConfig]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // File change detection polling
  useEffect(() => {
    const checkFileChanges = async () => {
      try {
        const { hashes } = await api.getFileHashes();
        const oldHashes = fileHashes;

        // Check if any hashes changed
        const hasChanges = Object.keys(hashes).some(
          key => oldHashes[key] !== hashes[key]
        ) || Object.keys(oldHashes).some(
          key => !hashes[key]
        );

        if (hasChanges && Object.keys(oldHashes).length > 0) {
          toast.info('Files changed externally, reloading...');
          await loadData();
        }

        setFileHashes(hashes);
      } catch (error) {
        // Ignore polling errors
      }
    };

    const interval = setInterval(checkFileChanges, 2000);
    checkFileChanges(); // Initial check

    return () => clearInterval(interval);
  }, [fileHashes, loadData]);

  // Calculate unique enabled MCPs (not counting duplicates across levels)
  const uniqueEnabledMcps = new Set();
  configs.forEach(c => {
    (c.config?.include || []).forEach(name => uniqueEnabledMcps.add(name));
    Object.keys(c.config?.mcpServers || {}).forEach(name => uniqueEnabledMcps.add(name));
  });

  const badges = {
    subprojects: project.subprojects?.length || 0,
    mcps: uniqueEnabledMcps.size,
    rules: rules.length,
    commands: commands.length,
  };

  const handleApplyConfig = async () => {
    try {
      await api.applyConfig(project.dir);
      toast.success('Configuration applied successfully!');
    } catch (error) {
      toast.error('Failed to apply config: ' + error.message);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
    toast.success('Data refreshed');
  };

  const openModal = (title, type, content = '') => {
    setModalContent({ title, type });
    setEditorContent(content);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'explorer':
        return <FileExplorer onRefresh={loadData} />;
      case 'subprojects':
        return <SubprojectsView project={project} onRefresh={handleRefresh} />;
      case 'registry':
        return <RegistryView registry={registry} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onUpdate={loadData} />;
      case 'memory':
        return <MemoryView project={project} onUpdate={loadData} />;
      case 'templates':
        return <TemplatesView templates={templates} project={project} onApply={loadData} />;
      case 'env':
        return <EnvView project={project} configs={configs} />;
      case 'create-mcp':
        return <CreateMcpView project={project} />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Claude <span className="text-indigo-600">Config</span>
                </h1>
              </div>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col">
              <code className="text-xs text-gray-600 font-mono">{project.dir}</code>
              <span className="text-[10px] text-gray-400">Run from your project directory</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleApplyConfig}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
            >
              <Rocket className="w-4 h-4" />
              Apply Config
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 h-[calc(100vh-64px)] border-r border-gray-200 bg-white sticky top-16">
          <ScrollArea className="h-full py-4">
            {['Projects', 'Configuration', 'Content', 'Tools', 'Developer'].map((section) => (
              <div key={section} className="mb-6">
                <h3 className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {section}
                </h3>
                <div className="space-y-0.5">
                  {navItems.filter(item => item.section === section).map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 border-l-2 ${
                          isActive
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {badges[item.badge]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-auto",
          currentView === 'explorer' ? "h-[calc(100vh-64px)]" : "p-6"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={currentView === 'explorer' ? "h-full" : ""}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// Hierarchy View
function HierarchyView({ configs, project, registry, selectedConfig, setSelectedConfig, onConfigUpdate }) {
  const [editedConfig, setEditedConfig] = useState('');
  const [saving, setSaving] = useState(false);
  const [copyMoveDialog, setCopyMoveDialog] = useState({ open: false, source: null, mode: 'copy', customPath: '' });

  useEffect(() => {
    if (selectedConfig) {
      setEditedConfig(JSON.stringify(selectedConfig.config, null, 2));
    }
  }, [selectedConfig]);

  // Copy config to another level (existing or new path)
  const handleCopyMove = async (targetDir) => {
    const { source, mode } = copyMoveDialog;
    if (!source || !targetDir) return;

    try {
      setSaving(true);
      // Get target config if it exists
      const targetConfig = configs.find(c => c.dir === targetDir);
      const mergedConfig = {
        ...(targetConfig?.config || {}),
        ...source.config,
        // Merge arrays (include, mcpServers)
        include: [...new Set([...(targetConfig?.config?.include || []), ...(source.config?.include || [])])],
        mcpServers: { ...(targetConfig?.config?.mcpServers || {}), ...(source.config?.mcpServers || {}) }
      };

      await api.updateConfig(targetDir, mergedConfig);

      if (mode === 'move') {
        // Clear the source config
        await api.updateConfig(source.dir, { include: [], mcpServers: {} });
        toast.success(`Config moved to ${targetDir}`);
      } else {
        toast.success(`Config copied to ${targetDir}`);
      }

      setCopyMoveDialog({ open: false, source: null, mode: 'copy', customPath: '' });
      onConfigUpdate();
    } catch (error) {
      toast.error(`Failed to ${mode}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle custom path submission
  const handleCustomPathSubmit = () => {
    const path = copyMoveDialog.customPath.trim();
    if (!path) {
      toast.error('Please enter a path');
      return;
    }
    handleCopyMove(path);
  };

  // Clear/delete config at a level
  const handleClearConfig = async (item) => {
    try {
      setSaving(true);
      await api.updateConfig(item.dir, { include: [], mcpServers: {} });
      toast.success(`Cleared config at ${item.label || item.dir}`);
      onConfigUpdate();
    } catch (error) {
      toast.error('Failed to clear: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    try {
      setSaving(true);
      const config = JSON.parse(editedConfig);
      await api.updateConfig(selectedConfig.dir, config);
      toast.success('Configuration saved!');
      onConfigUpdate();
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            Configuration Hierarchy
          </h2>
        </div>

        <div className="p-4 mx-4 mb-4 mt-4 bg-blue-50 rounded-lg border-l-4 border-indigo-500">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-indigo-700">📍 Project:</span>{' '}
            <code className="text-gray-600 bg-white px-2 py-0.5 rounded">{project.dir}</code>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Configs inherit top → bottom. Click to edit. MCPs from parent levels are inherited.
          </p>
        </div>

        {/* Simplified single-line per config */}
        <div className="px-4 pb-4 space-y-2">
          {configs.map((item, index) => {
            const isSelected = selectedConfig?.dir === item.dir;
            const isFirst = index === 0;
            const isLast = index === configs.length - 1;
            const mcpCount = (item.config?.include?.length || 0) + Object.keys(item.config?.mcpServers || {}).length;

            return (
              <motion.div
                key={item.dir}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedConfig(item)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-100 border-2 border-indigo-400'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                {/* Level indicator */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                  isFirst ? 'bg-indigo-500' : isLast ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  {isFirst ? '~' : isLast ? '.' : index}
                </div>

                {/* Path info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {item.dir}
                    </span>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${
                      isFirst ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      isLast ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {isFirst ? 'Global' : isLast ? 'Project' : 'Parent'}
                    </Badge>
                  </div>
                  <code className="text-xs text-gray-500">.claude/mcps.json</code>
                </div>

                {/* MCP count */}
                <div className="text-right shrink-0">
                  <div className={`text-lg font-bold ${mcpCount > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {mcpCount}
                  </div>
                  <div className="text-[10px] text-gray-500">MCPs</div>
                </div>

                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setCopyMoveDialog({ open: true, source: item, mode: 'copy' });
                    }}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to...
                    </DropdownMenuItem>
                    {mcpCount > 0 && (
                      <>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setCopyMoveDialog({ open: true, source: item, mode: 'move' });
                        }}>
                          <ChevronRight className="w-4 h-4 mr-2" />
                          Move to...
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearConfig(item);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear config
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Arrow indicator */}
                {!isLast && (
                  <div className="absolute -bottom-2 left-10 text-gray-300 z-10">↓</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedConfig && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedConfig.label}/.claude/mcps.json
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedConfig.dir}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
          <div className="p-4">
            <ConfigEditor
              value={editedConfig}
              onChange={setEditedConfig}
              registry={registry}
              height="400px"
            />
          </div>
        </motion.div>
      )}

      {/* Copy/Move Dialog */}
      <Dialog open={copyMoveDialog.open} onOpenChange={(open) => setCopyMoveDialog({ ...copyMoveDialog, open })}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {copyMoveDialog.mode === 'copy' ? (
                <><Copy className="w-5 h-5 text-blue-600" /> Copy Config</>
              ) : (
                <><ChevronRight className="w-5 h-5 text-amber-600" /> Move Config</>
              )}
            </DialogTitle>
            <DialogDescription>
              {copyMoveDialog.mode === 'copy'
                ? `Copy MCPs from "${copyMoveDialog.source?.label}" to another level. Existing configs will be merged.`
                : `Move MCPs from "${copyMoveDialog.source?.label}" to another level. Source will be cleared.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm font-medium text-gray-700">Select existing level:</label>
            {configs.filter(c => c.dir !== copyMoveDialog.source?.dir).map((config, index) => {
              const isFirst = index === 0;
              const isLast = index === configs.length - 2; // -2 because we filtered one out
              return (
                <Button
                  key={config.dir}
                  variant="outline"
                  className={`w-full justify-start gap-3 ${
                    isFirst ? 'border-indigo-200 hover:bg-indigo-50' :
                    isLast ? 'border-green-200 hover:bg-green-50' :
                    'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCopyMove(config.dir)}
                  disabled={saving}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${
                    isFirst ? 'bg-indigo-500' : isLast ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    {isFirst ? '~' : isLast ? '.' : index + 1}
                  </div>
                  <span className="truncate">{config.label || config.dir}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {isFirst ? 'Global' : isLast ? 'Project' : 'Parent'}
                  </Badge>
                </Button>
              );
            })}

            <div className="pt-3 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700">Or enter a new path:</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={copyMoveDialog.customPath}
                  onChange={(e) => setCopyMoveDialog({ ...copyMoveDialog, customPath: e.target.value })}
                  placeholder="/path/to/new/location"
                  className="flex-1 font-mono text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomPathSubmit()}
                />
                <Button
                  onClick={handleCustomPathSubmit}
                  disabled={saving || !copyMoveDialog.customPath.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : copyMoveDialog.mode === 'copy' ? 'Copy' : 'Move'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Creates .claude/mcps.json at the specified path
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCopyMoveDialog({ open: false, source: null, mode: 'copy', customPath: '' })}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subprojects View
function SubprojectsView({ project, onRefresh }) {
  const handleSwitchProject = async (dir) => {
    try {
      await api.switchProject(dir);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to switch project: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-500" />
            Sub-Projects
          </h2>
          <Button variant="outline" size="sm" onClick={onRefresh} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="p-4 mx-4 mb-4 mt-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-amber-700">📍 Current Directory:</span>{' '}
            <code className="text-gray-600 bg-white px-2 py-0.5 rounded">{project.dir}</code>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Found {project.subprojects?.length || 0} sub-project{(project.subprojects?.length || 0) !== 1 ? 's' : ''} with .git directories.
          </p>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(project.subprojects || []).map((proj, index) => (
            <motion.div
              key={proj.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleSwitchProject(proj.dir)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                <div className="flex gap-1">
                  {proj.markers?.git && <span title="Git">🔀</span>}
                  {proj.markers?.npm && <span title="NPM">📦</span>}
                  {proj.markers?.python && <span title="Python">🐍</span>}
                  {proj.markers?.claude && <span title="Claude Config">⚙️</span>}
                </div>
              </div>
              <code className="text-xs text-gray-500 block mb-3">{proj.relativePath || proj.name}</code>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={proj.hasConfig
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
                }>
                  {proj.hasConfig ? `✓ ${proj.mcpCount} MCPs` : 'No config'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-500 hover:text-gray-900 opacity-0 group-hover:opacity-100">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
          {(!project.subprojects || project.subprojects.length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No sub-projects found in this directory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MCPs View - Shows all registry MCPs with toggle controls
function McpsView({ configs, registry, selectedConfig, project, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [targetLevel, setTargetLevel] = useState(project.dir);

  // Get target config based on selected level
  const targetConfig = configs.find(c => c.dir === targetLevel) || configs[configs.length - 1];
  const targetIncludes = new Set(targetConfig?.config?.include || []);

  // Get project-level custom MCPs
  const projectConfig = configs.find(c => c.dir === project.dir) || configs[configs.length - 1];
  const projectCustomMcps = projectConfig?.config?.mcpServers || {};

  // Build map of which MCPs are enabled and from which level
  const enabledMcps = new Map();
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const levelType = getLevelType(i, configs.length);
    for (const name of config.config?.include || []) {
      if (!enabledMcps.has(name)) {
        enabledMcps.set(name, {
          source: config.label,
          sourceDir: config.dir,
          levelType,
          isAtTargetLevel: config.dir === targetLevel
        });
      }
    }
  }

  // Get level info for target
  const targetIndex = configs.findIndex(c => c.dir === targetLevel);
  const targetLevelType = getLevelType(targetIndex, configs.length);
  const targetColors = getLevelColors(targetLevelType);

  // Toggle MCP for selected level
  const toggleMcp = async (mcpName, enabled) => {
    setSaving(true);
    try {
      const newIncludes = enabled
        ? [...targetIncludes, mcpName]
        : [...targetIncludes].filter(n => n !== mcpName);

      const newConfig = {
        ...targetConfig.config,
        include: newIncludes
      };

      const levelLabel = getLevelLabel(targetIndex, configs.length);
      await api.updateConfig(targetLevel, newConfig);
      toast.success(enabled ? `Added ${mcpName} to ${levelLabel}` : `Removed ${mcpName} from ${levelLabel}`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // All registry MCPs
  const registryMcps = Object.entries(registry.mcpServers || {});
  const customMcps = Object.entries(projectCustomMcps);
  const totalEnabled = enabledMcps.size;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plug className="w-5 h-5 text-green-600" />
            MCP Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Toggle MCPs on/off. Select which level to save changes to.
          </p>
        </div>

        <div className="p-4 flex gap-4">
          <div className="flex-1 bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{totalEnabled}</div>
            <div className="text-sm text-green-600">Enabled MCPs</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{registryMcps.length}</div>
            <div className="text-sm text-blue-600">In Registry</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-700">{registryMcps.length - enabledMcps.size}</div>
            <div className="text-sm text-gray-600">Available to Enable</div>
          </div>
        </div>
      </div>

      {/* Level Selector */}
      <div className={`rounded-xl border-2 overflow-hidden shadow-sm ${targetColors.border} ${targetColors.bg}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${targetColors.bgSolid}`}>
              {targetLevelType === 'global' ? '~' : targetLevelType === 'project' ? '.' : '↑'}
            </div>
            <div>
              <div className={`font-semibold ${targetColors.text}`}>Save toggles to:</div>
              <div className="text-sm text-gray-500">Changes will be saved to this level</div>
            </div>
          </div>
          <Select value={targetLevel} onValueChange={setTargetLevel}>
            <SelectTrigger className={`w-[250px] ${targetColors.border} ${targetColors.bg}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {configs.map((config, index) => {
                const levelType = getLevelType(index, configs.length);
                const colors = getLevelColors(levelType);
                const label = getLevelLabel(index, configs.length, config.dir);
                const mcpCount = (config.config?.include?.length || 0);
                return (
                  <SelectItem key={config.dir} value={config.dir}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors.bgSolid}`} />
                      <span>{label}</span>
                      <span className="text-gray-400 text-xs">({mcpCount} MCPs)</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registry MCPs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Registry MCPs</h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {registryMcps.length} available
          </Badge>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registryMcps.map(([name, mcp], index) => {
            const enabledInfo = enabledMcps.get(name);
            const isEnabled = !!enabledInfo;
            const isAtTargetLevel = targetIncludes.has(name);
            const sourceColors = enabledInfo ? getLevelColors(enabledInfo.levelType) : null;

            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`rounded-lg border p-4 transition-all ${
                  isEnabled
                    ? `${sourceColors.bg} ${sourceColors.border}`
                    : 'bg-gray-50 border-gray-200 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {name}
                  </h3>
                  <Switch
                    checked={isAtTargetLevel}
                    disabled={saving}
                    onCheckedChange={(checked) => toggleMcp(name, checked)}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-2">{mcp.description || 'MCP server'}</p>
                <code className="text-xs text-gray-500 block mb-3 truncate bg-white/50 px-2 py-1 rounded">
                  {mcp.command} {mcp.args?.slice(0, 3).join(' ')}
                </code>
                <div className="flex items-center justify-between">
                  {isEnabled ? (
                    <Badge variant="outline" className={sourceColors.badge}>
                      {enabledInfo.source}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
                      Disabled
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Inline MCPs Notice */}
      {customMcps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900">
                {customMcps.length} MCP{customMcps.length > 1 ? 's' : ''} defined inline
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                These MCPs are defined directly in your mcps.json file: {customMcps.map(([name]) => name).join(', ')}.
                Consider moving them to the <strong>MCP Registry</strong> for easier management.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Registry View - Manage MCP definitions and search for new ones
function RegistryView({ registry, searchQuery, setSearchQuery, onUpdate }) {
  const [searchMode, setSearchModeState] = useState(() => getStoredState('registrySearchMode', 'local'));
  const setSearchMode = (mode) => {
    setSearchModeState(mode);
    setStoredState('registrySearchMode', mode);
  };
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, name: '', mcp: null, isNew: false });
  const [mcpForm, setMcpForm] = useState({ name: '', command: 'npx', args: '', env: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [discoveredTools, setDiscoveredTools] = useState([]);
  const [toolsDir, setToolsDir] = useState('');
  const [importDialog, setImportDialog] = useState({ open: false, url: '', showTerminal: false, localTool: null, pastedConfig: '' });

  const mcps = Object.entries(registry.mcpServers || {});
  const filtered = mcps.filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load discovered tools from ~/reg/tools
  useEffect(() => {
    const loadTools = async () => {
      try {
        const result = await api.getMcpTools();
        setDiscoveredTools(result.tools || []);
        setToolsDir(result.dir || '');
      } catch (e) {
        console.error('Failed to load MCP tools:', e);
      }
    };
    loadTools();
  }, []);

  // Filter discovered tools that aren't already in registry
  const filteredTools = discoveredTools.filter(tool =>
    !registry.mcpServers?.[tool.name] &&
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open edit dialog with existing MCP
  const openEditDialog = (name, mcp) => {
    setMcpForm({
      name,
      command: mcp.command || 'npx',
      args: JSON.stringify(mcp.args || [], null, 2),
      env: JSON.stringify(mcp.env || {}, null, 2),
      description: mcp.description || ''
    });
    setEditDialog({ open: true, name, mcp, isNew: false });
  };

  // Open add dialog
  const openAddDialog = () => {
    setMcpForm({ name: '', command: 'npx', args: '["-y", ""]', env: '{}', description: '' });
    setEditDialog({ open: true, name: '', mcp: null, isNew: true });
  };

  // Add from search result
  const addFromSearch = (result) => {
    const mcpName = result.name
      .replace('@modelcontextprotocol/server-', '')
      .replace('mcp-server-', '')
      .replace('mcp-', '')
      .replace(/-/g, '_');

    setMcpForm({
      name: mcpName,
      command: result.suggestedCommand || 'npx',
      args: JSON.stringify(result.suggestedArgs || ['-y', result.name], null, 2),
      env: '{}',
      description: result.description || ''
    });
    setEditDialog({ open: true, name: '', mcp: null, isNew: true });
  };

  // Add discovered tool from local ~/reg/tools directory
  const addFromDiscovered = (tool) => {
    // Generate command based on tool type
    let command, args;
    if (tool.type === 'python') {
      command = 'uv';
      args = ['run', '--directory', tool.path, 'python', tool.entryPoint || 'mcp_server.py'];
    } else {
      command = 'node';
      args = [tool.path + '/index.js'];
    }

    setMcpForm({
      name: tool.name,
      command,
      args: JSON.stringify(args, null, 2),
      env: '{}',
      description: tool.description || ''
    });
    setEditDialog({ open: true, name: '', mcp: null, isNew: true });
  };

  // Start importing from URL
  const startImport = () => {
    if (!importDialog.url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    setImportDialog(prev => ({ ...prev, showTerminal: true }));
  };

  // Get import command for Claude Code
  const getImportCommand = () => {
    // Local tool import - use single quotes and escape properly for zsh
    if (importDialog.localTool) {
      const tool = importDialog.localTool;
      // Use a simpler prompt that avoids special characters
      const prompt = `Analyze the MCP server at ${tool.path}. Read the README and source files to understand how to run it. Output a JSON config block with name, command, args array, and description for the MCP registry. Be specific about the exact command needed.`;
      return `cd '${tool.path}' && claude '${prompt}'`;
    }

    // URL import
    const url = importDialog.url.trim();
    const prompt = `Clone ${url} into ~/reg/tools. Read the README, determine if Python or Node MCP server, and output a JSON config block with name, command, args, and description.`;
    return `cd ~/reg/tools && claude '${prompt}'`;
  };

  // Start importing local tool with Claude
  const importLocalTool = (tool) => {
    setImportDialog({ open: true, url: '', showTerminal: true, localTool: tool, pastedConfig: '' });
  };

  // Handle import terminal exit
  const handleImportExit = (exitCode) => {
    if (exitCode === 0) {
      toast.success('Import completed! Paste the JSON config below to add it to the registry.');
      // Refresh discovered tools
      api.getMcpTools().then(result => {
        setDiscoveredTools(result.tools || []);
      });
    }
    // Don't close the dialog - let user paste the config
  };

  // Add pasted config to registry
  const handleAddPastedConfig = async () => {
    if (!importDialog.pastedConfig.trim()) {
      toast.error('Please paste the JSON config first');
      return;
    }

    try {
      // Try to parse as full config format: { "mcpServers": { "name": {...} } }
      // or as simple format: { "name": { "command": "...", "args": [...] } }
      let parsed;
      try {
        parsed = JSON.parse(importDialog.pastedConfig);
      } catch (e) {
        toast.error('Invalid JSON format');
        return;
      }

      // Determine the format and extract MCPs
      let mcpsToAdd = {};
      if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
        // Full format: { "mcpServers": { "name": {...} } }
        mcpsToAdd = parsed.mcpServers;
      } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Check if it looks like a direct MCP config (has "command" key but no name wrapper)
        const keys = Object.keys(parsed);
        if (keys.includes('command')) {
          toast.error('JSON is missing the MCP name. Expected format: { "name": { "command": "...", "args": [...] } }');
          return;
        } else {
          // Simple format: { "name": { "command": "...", "args": [...] } }
          mcpsToAdd = parsed;
        }
      }

      if (Object.keys(mcpsToAdd).length === 0) {
        toast.error('No MCP configurations found in the pasted JSON');
        return;
      }

      // Validate each MCP has required fields
      for (const [name, mcp] of Object.entries(mcpsToAdd)) {
        if (!mcp.command) {
          toast.error(`MCP "${name}" is missing required "command" field`);
          return;
        }
      }

      // Add to registry
      const updatedRegistry = { ...registry };
      if (!updatedRegistry.mcpServers) updatedRegistry.mcpServers = {};

      for (const [name, mcp] of Object.entries(mcpsToAdd)) {
        updatedRegistry.mcpServers[name] = mcp;
      }

      await api.updateRegistry(updatedRegistry);
      const count = Object.keys(mcpsToAdd).length;
      toast.success(`Added ${count} MCP${count > 1 ? 's' : ''} to registry!`);
      setImportDialog({ open: false, url: '', showTerminal: false, localTool: null, pastedConfig: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add config: ' + error.message);
    }
  };

  // Save MCP to registry
  const handleSave = async () => {
    setSaving(true);
    try {
      let args, env;
      try {
        args = JSON.parse(mcpForm.args);
        env = JSON.parse(mcpForm.env);
      } catch (e) {
        toast.error('Invalid JSON in args or env');
        setSaving(false);
        return;
      }

      const updatedRegistry = { ...registry };
      if (!updatedRegistry.mcpServers) updatedRegistry.mcpServers = {};

      const mcpData = {
        command: mcpForm.command,
        args,
        ...(Object.keys(env).length > 0 && { env }),
        ...(mcpForm.description && { description: mcpForm.description })
      };

      if (editDialog.isNew) {
        if (!mcpForm.name.trim()) {
          toast.error('Name is required');
          setSaving(false);
          return;
        }
        updatedRegistry.mcpServers[mcpForm.name] = mcpData;
      } else {
        updatedRegistry.mcpServers[editDialog.name] = mcpData;
      }

      await api.updateRegistry(updatedRegistry);
      toast.success(editDialog.isNew ? 'MCP added to registry' : 'MCP updated');
      setEditDialog({ open: false, name: '', mcp: null, isNew: false });
      onUpdate();
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete MCP from registry
  const handleDelete = async (name) => {
    try {
      const updatedRegistry = { ...registry };
      delete updatedRegistry.mcpServers[name];
      await api.updateRegistry(updatedRegistry);
      toast.success(`Removed ${name} from registry`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  // Remote search
  const handleRemoteSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = searchMode === 'github'
        ? await api.searchGithub(searchQuery)
        : await api.searchNpm(searchQuery);
      setSearchResults(results.results || []);
    } catch (error) {
      toast.error('Search failed: ' + error.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Trigger search when mode changes or enter is pressed
  useEffect(() => {
    if (searchMode !== 'local') {
      setSearchResults([]);
    }
  }, [searchMode]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              MCP Registry
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialog({ open: true, url: '', showTerminal: false, localTool: null, pastedConfig: '' })}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Import URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openAddDialog}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add MCP
              </Button>
            </div>
          </div>

          {/* Search Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={searchMode === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('local')}
              className={searchMode === 'local' ? 'bg-blue-600' : ''}
            >
              <Package className="w-4 h-4 mr-2" />
              Registry ({mcps.length})
            </Button>
            <Button
              variant={searchMode === 'tools' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('tools')}
              className={searchMode === 'tools' ? 'bg-purple-600' : ''}
            >
              <Folder className="w-4 h-4 mr-2" />
              Tools ({discoveredTools.length})
            </Button>
            <Button
              variant={searchMode === 'github' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('github')}
              className={searchMode === 'github' ? 'bg-gray-800' : ''}
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            <Button
              variant={searchMode === 'npm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('npm')}
              className={searchMode === 'npm' ? 'bg-red-600' : ''}
            >
              <Globe className="w-4 h-4 mr-2" />
              npm
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !['local', 'tools'].includes(searchMode) && handleRemoteSearch()}
                placeholder={searchMode === 'local' ? 'Filter registry...' : searchMode === 'tools' ? 'Filter discovered tools...' : `Search ${searchMode} for MCPs...`}
                className="pl-9 bg-white border-gray-300"
              />
            </div>
            {!['local', 'tools'].includes(searchMode) && (
              <Button onClick={handleRemoteSearch} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            )}
          </div>
        </div>

        {/* Local Registry */}
        {searchMode === 'local' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(([name, mcp], index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openEditDialog(name, mcp)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(name)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-600 mb-3">{mcp.description || 'MCP server'}</p>
                <code className="text-xs text-gray-500 block truncate bg-gray-50 px-2 py-1 rounded">
                  {mcp.command} {mcp.args?.join(' ')}
                </code>
                {mcp.env && Object.keys(mcp.env).length > 0 && (
                  <div className="mt-2 text-xs text-amber-600">
                    Requires: {Object.keys(mcp.env).join(', ')}
                  </div>
                )}
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchQuery ? 'No MCPs match your search.' : 'Registry is empty. Add MCPs or search online.'}
              </div>
            )}
          </div>
        )}

        {/* Discovered Tools from ~/reg/tools */}
        {searchMode === 'tools' && (
          <div className="p-4">
            {toolsDir && (
              <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Scanning: {toolsDir}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool, index) => (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-purple-50 rounded-lg border border-purple-200 p-4 hover:border-purple-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-purple-900">{tool.name}</h3>
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      {tool.type === 'python' ? 'Python' : 'Node'}
                    </Badge>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">{tool.description || 'MCP tool'}</p>
                  <code className="text-xs text-purple-600 block truncate bg-purple-100 px-2 py-1 rounded mb-3">
                    {tool.path}
                  </code>
                  {tool.framework && (
                    <div className="text-xs text-purple-500 mb-3">Framework: {tool.framework}</div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addFromDiscovered(tool)}
                      className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Quick
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => importLocalTool(tool)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Wand2 className="w-4 h-4 mr-1" />
                      Smart
                    </Button>
                  </div>
                </motion.div>
              ))}
              {filteredTools.length === 0 && discoveredTools.length > 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  All discovered tools are already in the registry.
                </div>
              )}
              {discoveredTools.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No MCP tools found in {toolsDir}. Create one using the Developer &gt; Create MCP view.
                </div>
              )}
            </div>
          </div>
        )}

        {/* GitHub/npm Search Results */}
        {!['local', 'tools'].includes(searchMode) && (
          <div className="p-4">
            {searching ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">Searching {searchMode}...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((result, index) => (
                  <motion.div
                    key={result.name || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{result.name}</h3>
                      {result.stars !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Star className="w-3 h-3" />
                          {result.stars}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{result.description || 'No description'}</p>
                    <code className="text-xs text-gray-500 block truncate bg-gray-50 px-2 py-1 rounded mb-3">
                      {result.suggestedCommand} {result.suggestedArgs?.join(' ')}
                    </code>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addFromSearch(result)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add to Registry
                      </Button>
                      {result.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(result.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No results found. Try a different search term.' : `Enter a search term to find MCPs on ${searchMode}.`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit MCP Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editDialog.isNew ? 'Add MCP to Registry' : 'Edit MCP'}</DialogTitle>
            <DialogDescription>
              {editDialog.isNew ? 'Add a new MCP server definition to your registry.' : 'Edit the MCP server configuration.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <Input
                value={mcpForm.name}
                onChange={(e) => setMcpForm({ ...mcpForm, name: e.target.value })}
                disabled={!editDialog.isNew}
                placeholder="my-mcp-server"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input
                value={mcpForm.description}
                onChange={(e) => setMcpForm({ ...mcpForm, description: e.target.value })}
                placeholder="What does this MCP do?"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Command</label>
              <Input
                value={mcpForm.command}
                onChange={(e) => setMcpForm({ ...mcpForm, command: e.target.value })}
                placeholder="npx"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Args (JSON array)</label>
              <Textarea
                value={mcpForm.args}
                onChange={(e) => setMcpForm({ ...mcpForm, args: e.target.value })}
                placeholder='["-y", "@modelcontextprotocol/server-xxx"]'
                className="mt-1 font-mono text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Environment Variables (JSON object)</label>
              <Textarea
                value={mcpForm.env}
                onChange={(e) => setMcpForm({ ...mcpForm, env: e.target.value })}
                placeholder='{"API_KEY": "${API_KEY}"}'
                className="mt-1 font-mono text-sm"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Use ${`{VAR_NAME}`} syntax for variables from .env file</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialog({ ...editDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editDialog.isNew ? 'Add to Registry' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog (URL or Local Tool) */}
      <Dialog open={importDialog.open} onOpenChange={(open) => setImportDialog({ open, url: '', showTerminal: false, localTool: null, pastedConfig: '' })}>
        <DialogContent className={`bg-white ${importDialog.showTerminal ? 'max-w-4xl h-[80vh] max-h-[800px]' : 'max-w-lg'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importDialog.localTool ? (
                <><Wand2 className="w-5 h-5 text-purple-600" /> Configure {importDialog.localTool.name}</>
              ) : (
                <><ExternalLink className="w-5 h-5 text-purple-600" /> Import MCP from URL</>
              )}
            </DialogTitle>
            <DialogDescription>
              {importDialog.localTool
                ? `Claude Code will analyze ${importDialog.localTool.name} and generate the correct configuration.`
                : 'Enter a GitHub repository URL. Claude Code will clone it, read the README, and help configure it.'
              }
            </DialogDescription>
          </DialogHeader>

          {!importDialog.showTerminal && !importDialog.localTool ? (
            <>
              <div className="py-4">
                <label className="text-sm font-medium text-gray-700">Repository URL</label>
                <Input
                  value={importDialog.url}
                  onChange={(e) => setImportDialog({ ...importDialog, url: e.target.value })}
                  placeholder="https://github.com/user/mcp-server-example"
                  className="mt-1"
                  onKeyDown={(e) => e.key === 'Enter' && startImport()}
                />
                <p className="text-xs text-gray-500 mt-2">
                  The repository will be cloned to ~/reg/tools
                </p>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setImportDialog({ open: false, url: '', showTerminal: false, localTool: null, pastedConfig: '' })}>
                  Cancel
                </Button>
                <Button onClick={startImport} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Import with Claude
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {importDialog.localTool && (
                <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Folder className="w-4 h-4 text-purple-600" />
                    <code className="text-purple-700">{importDialog.localTool.path}</code>
                  </div>
                </div>
              )}
              <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
                <TerminalComponent
                  cwd={importDialog.localTool?.path || toolsDir || '~/reg/tools'}
                  initialCommand={getImportCommand()}
                  onExit={handleImportExit}
                  height="100%"
                />
              </div>

              {/* Config paste area */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clipboard className="w-4 h-4" />
                  Paste MCP Config JSON
                </label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Copy the JSON config from the terminal output above and paste it here to add to your registry.
                </p>
                <Textarea
                  value={importDialog.pastedConfig}
                  onChange={(e) => setImportDialog({ ...importDialog, pastedConfig: e.target.value })}
                  placeholder={'{\n  "mcpServers": {\n    "example": {\n      "command": "npx",\n      "args": ["-y", "@example/mcp-server"]\n    }\n  }\n}'}
                  className="font-mono text-sm bg-white"
                  rows={6}
                />
              </div>

              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={() => setImportDialog({ open: false, url: '', showTerminal: false, localTool: null, pastedConfig: '' })}>
                  Close
                </Button>
                <Button
                  onClick={handleAddPastedConfig}
                  disabled={!importDialog.pastedConfig.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Registry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Memory View - Manage preferences, corrections, facts, patterns, decisions, issues
function MemoryView({ project, onUpdate }) {
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addEntry, setAddEntry] = useState({
    open: false,
    type: 'preference',
    // Structured fields for different types
    name: '',
    description: '',
    wrong: '',
    right: '',
    category: '',
    details: '',
    title: '',
    context: '',
    decision: '',
    rationale: '',
    content: '' // fallback for free-form
  });

  // Load memory data
  useEffect(() => {
    loadMemory();
  }, []);

  const loadMemory = async () => {
    try {
      setLoading(true);
      const data = await api.getMemory();
      setMemory(data);
    } catch (error) {
      toast.error('Failed to load memory');
    } finally {
      setLoading(false);
    }
  };

  // Load file content when selected
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile.path);
    }
  }, [selectedFile]);

  const loadFileContent = async (path) => {
    try {
      const data = await api.getMemoryFile(path);
      setContent(data.content || '');
    } catch (error) {
      toast.error('Failed to load file');
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await api.saveMemoryFile(selectedFile.path, content);
      toast.success('Saved!');
      loadMemory();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api.searchMemory(searchQuery);
      setSearchResults(data.results || []);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleAddEntry = async () => {
    // Format content based on type
    let formattedContent = '';
    const { type } = addEntry;

    switch (type) {
      case 'preference':
        if (!addEntry.name.trim()) {
          toast.error('Name required');
          return;
        }
        formattedContent = `**${addEntry.name}**: ${addEntry.description}`;
        break;
      case 'correction':
        if (!addEntry.wrong.trim() || !addEntry.right.trim()) {
          toast.error('Both "wrong" and "right" are required');
          return;
        }
        formattedContent = `**Wrong**: ${addEntry.wrong}\n**Right**: ${addEntry.right}`;
        break;
      case 'fact':
        if (!addEntry.category.trim()) {
          toast.error('Category required');
          return;
        }
        formattedContent = `**${addEntry.category}**: ${addEntry.details}`;
        break;
      case 'pattern':
        if (!addEntry.name.trim()) {
          toast.error('Name required');
          return;
        }
        formattedContent = `**${addEntry.name}**\n${addEntry.description}`;
        break;
      case 'decision':
        if (!addEntry.title.trim()) {
          toast.error('Title required');
          return;
        }
        formattedContent = `**${addEntry.title}**\n\n**Context**: ${addEntry.context}\n\n**Decision**: ${addEntry.decision}\n\n**Rationale**: ${addEntry.rationale}`;
        break;
      case 'issue':
        if (!addEntry.title.trim()) {
          toast.error('Title required');
          return;
        }
        formattedContent = `**${addEntry.title}**\n\n${addEntry.description}`;
        break;
      case 'history':
      case 'context':
      default:
        if (!addEntry.content.trim()) {
          toast.error('Content required');
          return;
        }
        formattedContent = addEntry.content;
        break;
    }

    try {
      const scope = ['pattern', 'decision', 'issue', 'history', 'context'].includes(type) ? 'project' : 'global';
      await api.addMemoryEntry(type, formattedContent, scope);
      toast.success(`Added ${type} entry`);
      setAddEntry({
        open: false, type: 'preference',
        name: '', description: '', wrong: '', right: '',
        category: '', details: '', title: '', context: '',
        decision: '', rationale: '', content: ''
      });
      loadMemory();
    } catch (error) {
      toast.error('Failed to add entry');
    }
  };

  const handleInitProject = async () => {
    try {
      await api.initProjectMemory(project.dir);
      toast.success('Project memory initialized!');
      loadMemory();
    } catch (error) {
      toast.error(error.message || 'Failed to initialize');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const entryTypes = {
    global: [
      { id: 'preference', label: 'Preference', icon: Settings, desc: 'User preferences (tools, style, etc.)' },
      { id: 'correction', label: 'Correction', icon: AlertCircle, desc: 'Mistakes to avoid' },
      { id: 'fact', label: 'Fact', icon: BookOpen, desc: 'Facts about your environment' },
    ],
    project: [
      { id: 'context', label: 'Context', icon: FileText, desc: 'Project overview and conventions' },
      { id: 'pattern', label: 'Pattern', icon: FileCode, desc: 'Code patterns in this project' },
      { id: 'decision', label: 'Decision', icon: Zap, desc: 'Architecture decisions' },
      { id: 'issue', label: 'Issue', icon: AlertCircle, desc: 'Known issues and workarounds' },
      { id: 'history', label: 'History', icon: Clock, desc: 'Session work log' },
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header with search and add */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Memory System
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddEntry({
                open: true, type: 'preference',
                name: '', description: '', wrong: '', right: '',
                category: '', details: '', title: '', context: '',
                decision: '', rationale: '', content: ''
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
            <div className="space-y-2">
              {searchResults.map((result, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={result.scope === 'global' ? 'default' : 'secondary'}>
                      {result.scope}
                    </Badge>
                    <span className="font-medium">{result.file}</span>
                  </div>
                  {result.matches.map((match, j) => (
                    <div key={j} className="ml-4 text-gray-600 text-xs mt-1">
                      Line {match.line}: {match.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['global', 'project', 'sync'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-white border border-b-white border-gray-200 -mb-[1px] text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Memory
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">
              {activeTab === 'global' && 'Global Memory Files'}
              {activeTab === 'project' && 'Project Memory Files'}
              {activeTab === 'sync' && 'Sync State'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {activeTab === 'global' && '~/.claude/memory/'}
              {activeTab === 'project' && `${project.dir}/.claude/memory/`}
              {activeTab === 'sync' && '~/.claude/sync/'}
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {activeTab === 'global' && memory?.global?.files.map((file) => (
              <button
                key={file.name}
                onClick={() => file.exists && setSelectedFile(file)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedFile?.path === file.path ? 'bg-indigo-50' : ''
                } ${!file.exists ? 'opacity-50' : ''}`}
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                  <div className="text-xs text-gray-500">{file.type}</div>
                </div>
                {file.exists ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-xs text-gray-400">Not created</span>
                )}
              </button>
            ))}

            {activeTab === 'project' && (
              <>
                {!memory?.project?.initialized ? (
                  <div className="p-6 text-center">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-4">Project memory not initialized</p>
                    <Button onClick={handleInitProject} className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Initialize Project Memory
                    </Button>
                  </div>
                ) : (
                  memory?.project?.files.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => file.exists && setSelectedFile(file)}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedFile?.path === file.path ? 'bg-indigo-50' : ''
                      } ${!file.exists ? 'opacity-50' : ''}`}
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                        <div className="text-xs text-gray-500">{file.type}</div>
                      </div>
                      {file.exists ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-gray-400">Not created</span>
                      )}
                    </button>
                  ))
                )}
              </>
            )}

            {activeTab === 'sync' && (
              <div className="p-4">
                {memory?.sync?.state ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Current State</h4>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-48">
                        {JSON.stringify(memory.sync.state, null, 2)}
                      </pre>
                    </div>
                    {memory.sync.history.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">History ({memory.sync.history.length})</h4>
                        <div className="space-y-1">
                          {memory.sync.history.map((h, i) => (
                            <div key={i} className="text-xs text-gray-600 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {h.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No sync state</p>
                    <p className="text-xs text-gray-400 mt-1">State is created by session hooks</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              {selectedFile ? selectedFile.name : 'Select a file'}
            </h3>
            {selectedFile && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            )}
          </div>
          <div className="p-4">
            {selectedFile ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm min-h-[400px]"
                placeholder="File content..."
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={addEntry.open} onOpenChange={(open) => setAddEntry({ ...addEntry, open })}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Memory Entry</DialogTitle>
            <DialogDescription>
              Add a new entry to the appropriate memory file.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Entry Type</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[...entryTypes.global, ...entryTypes.project].map((type) => {
                  const Icon = type.icon;
                  const isGlobal = entryTypes.global.some(t => t.id === type.id);
                  return (
                    <button
                      key={type.id}
                      onClick={() => setAddEntry({ ...addEntry, type: type.id })}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        addEntry.type === type.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{isGlobal ? 'Global' : 'Project'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type-specific fields */}
            {addEntry.type === 'preference' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <Input
                    value={addEntry.name}
                    onChange={(e) => setAddEntry({ ...addEntry, name: e.target.value })}
                    placeholder="e.g., package-manager"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Input
                    value={addEntry.description}
                    onChange={(e) => setAddEntry({ ...addEntry, description: e.target.value })}
                    placeholder="e.g., Always use pnpm instead of npm"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {addEntry.type === 'correction' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Wrong (what to avoid)</label>
                  <Textarea
                    value={addEntry.wrong}
                    onChange={(e) => setAddEntry({ ...addEntry, wrong: e.target.value })}
                    placeholder="e.g., Using npm install"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Right (what to do instead)</label>
                  <Textarea
                    value={addEntry.right}
                    onChange={(e) => setAddEntry({ ...addEntry, right: e.target.value })}
                    placeholder="e.g., Use pnpm install"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {addEntry.type === 'fact' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <Input
                    value={addEntry.category}
                    onChange={(e) => setAddEntry({ ...addEntry, category: e.target.value })}
                    placeholder="e.g., shell, editor, system"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Details</label>
                  <Textarea
                    value={addEntry.details}
                    onChange={(e) => setAddEntry({ ...addEntry, details: e.target.value })}
                    placeholder="e.g., Using zsh with oh-my-zsh"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {addEntry.type === 'pattern' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Pattern Name</label>
                  <Input
                    value={addEntry.name}
                    onChange={(e) => setAddEntry({ ...addEntry, name: e.target.value })}
                    placeholder="e.g., API Response Format"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={addEntry.description}
                    onChange={(e) => setAddEntry({ ...addEntry, description: e.target.value })}
                    placeholder="Describe the pattern and when to use it..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {addEntry.type === 'decision' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <Input
                    value={addEntry.title}
                    onChange={(e) => setAddEntry({ ...addEntry, title: e.target.value })}
                    placeholder="e.g., Use React Query for data fetching"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Context</label>
                  <Textarea
                    value={addEntry.context}
                    onChange={(e) => setAddEntry({ ...addEntry, context: e.target.value })}
                    placeholder="What problem were we solving?"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Decision</label>
                  <Textarea
                    value={addEntry.decision}
                    onChange={(e) => setAddEntry({ ...addEntry, decision: e.target.value })}
                    placeholder="What did we decide?"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Rationale</label>
                  <Textarea
                    value={addEntry.rationale}
                    onChange={(e) => setAddEntry({ ...addEntry, rationale: e.target.value })}
                    placeholder="Why this choice over alternatives?"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {addEntry.type === 'issue' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Issue Title</label>
                  <Input
                    value={addEntry.title}
                    onChange={(e) => setAddEntry({ ...addEntry, title: e.target.value })}
                    placeholder="e.g., Memory leak in useEffect"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description / Workaround</label>
                  <Textarea
                    value={addEntry.description}
                    onChange={(e) => setAddEntry({ ...addEntry, description: e.target.value })}
                    placeholder="Describe the issue and any workarounds..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {(addEntry.type === 'history' || addEntry.type === 'context') && (
              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <Textarea
                  value={addEntry.content}
                  onChange={(e) => setAddEntry({ ...addEntry, content: e.target.value })}
                  placeholder={addEntry.type === 'history' ? "What work was done this session?" : "Project context and overview..."}
                  className="mt-1"
                  rows={4}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddEntry({ ...addEntry, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Rules View
function RulesView({ rules, project, selectedFile, setSelectedFile, onUpdate }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [aiAssist, setAiAssist] = useState({ open: false, prompt: '' });

  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile.fullPath);
    }
  }, [selectedFile]);

  const loadFileContent = async (path) => {
    try {
      const data = await api.getRule(path);
      setContent(data.content || '');
    } catch (error) {
      toast.error('Failed to load rule');
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await api.saveRule(selectedFile.fullPath, content);
      toast.success('Rule saved!');
    } catch (error) {
      toast.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.createRule(project.dir, newName.trim());
      toast.success('Rule created!');
      setCreating(false);
      setNewName('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to create rule');
    }
  };

  const handleDelete = async (path) => {
    try {
      await api.deleteRule(path);
      toast.success('Rule deleted!');
      setSelectedFile(null);
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  // AI Assist command
  const getAiCommand = () => {
    const rulesDir = `${project.dir}/.claude/rules`;
    const prompt = aiAssist.prompt || 'Create a helpful rule for this project';
    return `cd "${project.dir}" && claude "Create a new rule file in ${rulesDir}. ${prompt}. The rule should be a markdown file with clear instructions for Claude Code."`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Rules
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiAssist({ open: true, prompt: '' })}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreating(true)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {rules.map((rule, index) => (
              <motion.div
                key={rule.fullPath}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedFile(rule)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                  selectedFile?.fullPath === rule.fullPath ? 'bg-amber-50' : 'hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span className="flex-1 text-gray-900">{rule.file}</span>
                <code className="text-xs text-gray-500">{rule.source}</code>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedFile(rule)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(rule.fullPath)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
            {rules.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No rules defined yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedFile ? selectedFile.file : 'Select a rule'}
            </h2>
            {selectedFile && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            )}
          </div>
          <div className="p-4">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              height="400px"
              readOnly={!selectedFile}
            />
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Create New Rule</DialogTitle>
            <DialogDescription>Enter a name for the new rule file.</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="rule-name.md"
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assist Dialog */}
      <Dialog open={aiAssist.open} onOpenChange={(open) => setAiAssist({ ...aiAssist, open })}>
        <DialogContent className="bg-white max-w-4xl h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              Create Rule with AI
            </DialogTitle>
            <DialogDescription>
              Describe what rule you want to create. Claude Code will generate it.
            </DialogDescription>
          </DialogHeader>

          {!aiAssist.showTerminal ? (
            <>
              <div className="py-4">
                <label className="text-sm font-medium text-gray-700">What should this rule do?</label>
                <Textarea
                  value={aiAssist.prompt}
                  onChange={(e) => setAiAssist({ ...aiAssist, prompt: e.target.value })}
                  placeholder="e.g., Enforce TypeScript best practices and consistent code style..."
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAiAssist({ open: false, prompt: '' })}>Cancel</Button>
                <Button
                  onClick={() => setAiAssist({ ...aiAssist, showTerminal: true })}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate with Claude
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                <TerminalComponent
                  cwd={project.dir}
                  initialCommand={getAiCommand()}
                  onExit={() => {
                    setAiAssist({ open: false, prompt: '' });
                    onUpdate();
                  }}
                  height="100%"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => { setAiAssist({ open: false, prompt: '' }); onUpdate(); }}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Commands View
function CommandsView({ commands, project, selectedFile, setSelectedFile, onUpdate }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [aiAssist, setAiAssist] = useState({ open: false, prompt: '' });

  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile.fullPath);
    }
  }, [selectedFile]);

  const loadFileContent = async (path) => {
    try {
      const data = await api.getCommand(path);
      setContent(data.content || '');
    } catch (error) {
      toast.error('Failed to load command');
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await api.saveCommand(selectedFile.fullPath, content);
      toast.success('Command saved!');
    } catch (error) {
      toast.error('Failed to save command');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.createCommand(project.dir, newName.trim());
      toast.success('Command created!');
      setCreating(false);
      setNewName('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to create command');
    }
  };

  const handleDelete = async (path) => {
    try {
      await api.deleteCommand(path);
      toast.success('Command deleted!');
      setSelectedFile(null);
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete command');
    }
  };

  // AI Assist command
  const getAiCommand = () => {
    const commandsDir = `${project.dir}/.claude/commands`;
    const prompt = aiAssist.prompt || 'Create a useful slash command for this project';
    return `cd "${project.dir}" && claude "Create a new command file in ${commandsDir}. ${prompt}. The command should be a markdown file that defines a slash command for Claude Code with clear instructions."`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Commands
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiAssist({ open: true, prompt: '' })}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreating(true)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Command
              </Button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {commands.map((command, index) => (
              <motion.div
                key={command.fullPath}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedFile(command)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                  selectedFile?.fullPath === command.fullPath ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
              >
                <Terminal className="w-4 h-4 text-purple-600" />
                <span className="flex-1 text-gray-900">{command.file}</span>
                <code className="text-xs text-gray-500">{command.source}</code>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedFile(command)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(command.fullPath)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
            {commands.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No commands defined yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedFile ? selectedFile.file : 'Select a command'}
            </h2>
            {selectedFile && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            )}
          </div>
          <div className="p-4">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              height="400px"
              readOnly={!selectedFile}
            />
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Create New Command</DialogTitle>
            <DialogDescription>Enter a name for the new command file.</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="command-name.md"
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assist Dialog */}
      <Dialog open={aiAssist.open} onOpenChange={(open) => setAiAssist({ ...aiAssist, open })}>
        <DialogContent className="bg-white max-w-4xl h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              Create Command with AI
            </DialogTitle>
            <DialogDescription>
              Describe what slash command you want to create. Claude Code will generate it.
            </DialogDescription>
          </DialogHeader>

          {!aiAssist.showTerminal ? (
            <>
              <div className="py-4">
                <label className="text-sm font-medium text-gray-700">What should this command do?</label>
                <Textarea
                  value={aiAssist.prompt}
                  onChange={(e) => setAiAssist({ ...aiAssist, prompt: e.target.value })}
                  placeholder="e.g., A /deploy command that builds and deploys to production..."
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAiAssist({ open: false, prompt: '' })}>Cancel</Button>
                <Button
                  onClick={() => setAiAssist({ ...aiAssist, showTerminal: true })}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate with Claude
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                <TerminalComponent
                  cwd={project.dir}
                  initialCommand={getAiCommand()}
                  onExit={() => {
                    setAiAssist({ open: false, prompt: '' });
                    onUpdate();
                  }}
                  height="100%"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => { setAiAssist({ open: false, prompt: '' }); onUpdate(); }}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Templates View
function TemplatesView({ templates, project, onApply }) {
  const [applying, setApplying] = useState(null);

  const handleApply = async (templateName) => {
    setApplying(templateName);
    try {
      await api.applyTemplate(templateName, project.dir);
      toast.success(`Template "${templateName}" applied!`);
      onApply();
    } catch (error) {
      toast.error('Failed to apply template: ' + error.message);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layout className="w-5 h-5 text-cyan-600" />
            Templates
          </h2>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Apply a template to quickly set up rules, commands, and MCP configurations for your project.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <motion.div
                key={template.fullName || template.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:border-cyan-300 hover:shadow-lg transition-all group"
              >
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 mb-3 text-[10px] uppercase tracking-wider">
                  {template.category}
                </Badge>
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description || 'Project template'}</p>
                {template.mcpDefaults?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs text-gray-500">MCPs: </span>
                    <span className="text-xs text-gray-700">{template.mcpDefaults.join(', ')}</span>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => handleApply(template.fullName || `${template.category}/${template.name}`)}
                  disabled={applying === (template.fullName || template.name)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {applying === (template.fullName || template.name) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Apply Template
                </Button>
              </motion.div>
            ))}
            {templates.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No templates available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Environment View
function EnvView({ project, configs }) {
  const [showValues, setShowValues] = useState({});
  const [envContent, setEnvContent] = useState('');
  const [envVars, setEnvVars] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEnv();
  }, [project.dir]);

  const loadEnv = async () => {
    try {
      const data = await api.getEnv(project.dir);
      setEnvContent(data.content || '');
      // Parse env content into key-value pairs
      const vars = {};
      (data.content || '').split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          vars[match[1]] = match[2];
        }
      });
      setEnvVars(vars);
    } catch (error) {
      // Ignore - file may not exist
    }
  };

  const toggleShow = (key) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveEnv(project.dir, envContent);
      toast.success('Environment saved!');
    } catch (error) {
      toast.error('Failed to save environment');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (value) => {
    navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-600" />
            Environment Variables
          </h2>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Environment variables are stored in <code className="bg-gray-100 px-1 rounded">.claude/.env</code> and used for MCP server configuration.
          </p>

          {Object.keys(envVars).length > 0 ? (
            <div className="space-y-3 mb-4">
              {Object.entries(envVars).map(([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center gap-4"
                >
                  <code className="text-indigo-600 font-semibold min-w-[200px]">{key}</code>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type={showValues[key] ? 'text' : 'password'}
                      value={value}
                      className="bg-white border-gray-300 text-gray-900 font-mono"
                      readOnly
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShow(key)}
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(value)}
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 mb-4">
              No environment variables defined.
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Edit .env file</h3>
            <Textarea
              value={envContent}
              onChange={(e) => setEnvContent(e.target.value)}
              placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
              className="min-h-[200px] font-mono text-sm bg-gray-50 border-gray-300 text-gray-900 mb-4"
            />
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Environment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// MCP tools repository directory
const MCP_TOOLS_DIR = '~/reg/tools';

// Create MCP View with embedded terminal
function CreateMcpView({ project }) {
  const [mcpName, setMcpName] = useState('');
  const [mcpDescription, setMcpDescription] = useState('');
  const [outputDir, setOutputDir] = useState(MCP_TOOLS_DIR);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalCommand, setTerminalCommand] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!mcpName.trim()) {
      toast.error('Please enter an MCP name');
      return;
    }

    // Generate scaffold command for Claude Code
    const scaffoldPrompt = `Create a new MCP server project called "${mcpName}" with the following:
- Use Python with uv for package management
- Use FastMCP framework
- Description: ${mcpDescription || 'A custom MCP server'}
- Create a single mcp_server.py file with basic structure
- Include a pyproject.toml configured for uv
- Add a README.md with usage instructions`;

    // Start terminal with claude command
    setTerminalCommand(`cd "${outputDir}" && claude "${scaffoldPrompt}"`);
    setShowTerminal(true);
    setIsCreating(true);
  };

  const handleTerminalReady = (sessionId) => {
    console.log('Terminal session ready:', sessionId);
  };

  const handleTerminalExit = (exitCode, signal) => {
    console.log('Terminal exited:', exitCode, signal);
    setIsCreating(false);
    if (exitCode === 0) {
      toast.success('MCP project created successfully!');
    }
  };

  const resetForm = () => {
    setShowTerminal(false);
    setTerminalCommand(null);
    setIsCreating(false);
    setMcpName('');
    setMcpDescription('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wand2 className="w-7 h-7 text-purple-600" />
              Create MCP Server
            </h1>
            <p className="text-gray-500 mt-1">
              Generate a new MCP server project with Claude Code assistance
            </p>
          </div>
          {showTerminal && (
            <Button
              variant="outline"
              onClick={resetForm}
              className="text-gray-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left panel - Form */}
        <div className={`${showTerminal ? 'w-1/3 border-r border-gray-200' : 'w-full max-w-2xl mx-auto'} p-6 overflow-auto`}>
          <div className="space-y-6">
            {/* MCP Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MCP Name *
              </label>
              <Input
                value={mcpName}
                onChange={(e) => setMcpName(e.target.value)}
                placeholder="my-awesome-mcp"
                className="bg-white border-gray-300"
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be the project folder name
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={mcpDescription}
                onChange={(e) => setMcpDescription(e.target.value)}
                placeholder="Describe what your MCP server will do..."
                className="bg-white border-gray-300 min-h-[100px]"
                disabled={isCreating}
              />
            </div>

            {/* Output Directory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Directory
              </label>
              <Input
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="/path/to/projects"
                className="bg-white border-gray-300 font-mono text-sm"
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Where to create the new MCP project
              </p>
            </div>

            {/* Template Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-900 mb-2">
                What will be created:
              </h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Python project with uv package manager
                </li>
                <li className="flex items-center gap-2">
                  <Plug className="w-4 h-4" />
                  FastMCP framework setup
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  mcp_server.py with basic structure
                </li>
                <li className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  pyproject.toml configured for uv
                </li>
              </ul>
            </div>

            {/* Create Button */}
            {!showTerminal && (
              <Button
                onClick={handleCreate}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!mcpName.trim()}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Create & Launch Claude Code
              </Button>
            )}
          </div>
        </div>

        {/* Right panel - Terminal */}
        {showTerminal && (
          <div className="flex-1 flex flex-col bg-gray-900">
            <div className="flex-none px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Claude Code Terminal</span>
              </div>
              <div className="flex items-center gap-2">
                {isCreating && (
                  <Badge variant="outline" className="bg-green-900/50 text-green-400 border-green-700">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Running
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex-1">
              <TerminalComponent
                cwd={outputDir}
                initialCommand={terminalCommand}
                onReady={handleTerminalReady}
                onExit={handleTerminalExit}
                height="100%"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Settings View - User preferences and configuration
function SettingsView() {
  const [config, setConfig] = useState(null);
  const [configPath, setConfigPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getConfig();
      setConfig(data.config);
      setConfigPath(data.path);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveConfig(config);
      toast.success('Settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedConfig = (parent, key, value) => {
    setConfig(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Settings
          </h2>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Configuration stored in: <code className="bg-gray-100 px-2 py-0.5 rounded">{configPath}</code>
        </p>

        <div className="space-y-6">
          {/* Directories Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Directories
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">MCP Tools Directory</label>
                <p className="text-xs text-gray-500 mb-2">
                  Where local MCP tool repositories are stored for discovery
                </p>
                <Input
                  value={config?.toolsDir || ''}
                  onChange={(e) => updateConfig('toolsDir', e.target.value)}
                  placeholder="~/mcp-tools"
                  className="font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Global Registry Path</label>
                <p className="text-xs text-gray-500 mb-2">
                  Path to the global MCP registry file
                </p>
                <Input
                  value={config?.registryPath || ''}
                  onChange={(e) => updateConfig('registryPath', e.target.value)}
                  placeholder="~/.claude/registry.json"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* UI Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Layout className="w-4 h-4" />
              User Interface
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Default Port</label>
                <p className="text-xs text-gray-500 mb-2">
                  Port for the web UI server
                </p>
                <Input
                  type="number"
                  value={config?.ui?.port || 3333}
                  onChange={(e) => updateNestedConfig('ui', 'port', parseInt(e.target.value) || 3333)}
                  placeholder="3333"
                  className="w-32"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Open Browser on Start</label>
                  <p className="text-xs text-gray-500">
                    Automatically open browser when starting the UI
                  </p>
                </div>
                <Switch
                  checked={config?.ui?.openBrowser ?? true}
                  onCheckedChange={(checked) => updateNestedConfig('ui', 'openBrowser', checked)}
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              About
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Documentation</span>
                <a
                  href="https://github.com/regression-io/claude-config"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
