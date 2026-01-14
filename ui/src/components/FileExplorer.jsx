import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Folder,
  FolderOpen,
  File,
  FileJson,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Copy,
  Move,
  Trash2,
  Edit3,
  RefreshCw,
  Home,
  Server,
  BookOpen,
  Terminal,
  Sparkles,
  Save,
  X,
} from 'lucide-react';

// File type icons and colors
const FILE_CONFIG = {
  mcps: {
    icon: Server,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'MCP Servers',
  },
  settings: {
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Settings',
  },
  command: {
    icon: Terminal,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Command',
  },
  rule: {
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Rule',
  },
  claudemd: {
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'CLAUDE.md',
  },
  folder: {
    icon: Folder,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Folder',
  },
};

// Level colors for hierarchy
const LEVEL_COLORS = {
  home: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  intermediate: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
  project: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
};

// Tree Item Component
function TreeItem({ item, level = 0, selectedPath, onSelect, onContextMenu, expandedFolders, onToggleFolder }) {
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
          'hover:bg-gray-100 transition-colors',
          isSelected && 'bg-blue-100 hover:bg-blue-100'
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

// Folder Header Component
function FolderHeader({ folder, isFirst, isLast, onCreateFile }) {
  const levelColor = isFirst ? LEVEL_COLORS.home : isLast ? LEVEL_COLORS.project : LEVEL_COLORS.intermediate;

  return (
    <div className={cn('flex items-center justify-between px-3 py-2 border-b', levelColor.bg, levelColor.border)}>
      <div className="flex items-center gap-2">
        {isFirst ? <Home className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
        <span className={cn('font-medium text-sm', levelColor.text)}>
          {folder.label}
        </span>
        {!folder.exists && (
          <Badge variant="outline" className="text-xs">no .claude</Badge>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onCreateFile(folder.dir, 'mcps')}>
            <Server className="w-4 h-4 mr-2" />
            mcps.json
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCreateFile(folder.dir, 'settings')}>
            <Settings className="w-4 h-4 mr-2" />
            settings.json
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onCreateFile(folder.dir, 'command')}>
            <Terminal className="w-4 h-4 mr-2" />
            New Command
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCreateFile(folder.dir, 'rule')}>
            <BookOpen className="w-4 h-4 mr-2" />
            New Rule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onCreateFile(folder.dir, 'claudemd')}>
            <FileText className="w-4 h-4 mr-2" />
            CLAUDE.md
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// MCP Editor Component
function McpEditor({ content, parsed, onSave, registry }) {
  const [localConfig, setLocalConfig] = useState(parsed || { include: [], mcpServers: {} });
  const [viewMode, setViewMode] = useState('rich'); // 'rich' or 'json'
  const [jsonText, setJsonText] = useState(JSON.stringify(parsed || {}, null, 2));
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(parsed || { include: [], mcpServers: {} });
    setJsonText(JSON.stringify(parsed || {}, null, 2));
    setHasChanges(false);
  }, [parsed]);

  const handleToggleInclude = (name) => {
    const newInclude = localConfig.include?.includes(name)
      ? localConfig.include.filter(n => n !== name)
      : [...(localConfig.include || []), name];
    setLocalConfig({ ...localConfig, include: newInclude });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (viewMode === 'json') {
      try {
        const parsed = JSON.parse(jsonText);
        onSave(JSON.stringify(parsed, null, 2));
      } catch (e) {
        toast.error('Invalid JSON');
        return;
      }
    } else {
      onSave(JSON.stringify(localConfig, null, 2));
    }
    setHasChanges(false);
  };

  const registryMcps = registry?.mcpServers ? Object.keys(registry.mcpServers) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList className="h-8">
            <TabsTrigger value="rich" className="text-xs px-3">Rich Editor</TabsTrigger>
            <TabsTrigger value="json" className="text-xs px-3">JSON</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          {hasChanges && (
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {viewMode === 'rich' ? (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Registry MCPs</h3>
              <div className="space-y-2">
                {registryMcps.length === 0 ? (
                  <p className="text-sm text-gray-500">No MCPs in registry</p>
                ) : (
                  registryMcps.map((name) => (
                    <div key={name} className="flex items-center justify-between p-2 rounded border bg-white">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{name}</span>
                      </div>
                      <Switch
                        checked={localConfig.include?.includes(name)}
                        onCheckedChange={() => handleToggleInclude(name)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {Object.keys(localConfig.mcpServers || {}).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Inline MCPs</h3>
                <div className="space-y-2">
                  {Object.entries(localConfig.mcpServers).map(([name, config]) => (
                    <div key={name} className="p-2 rounded border bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="outline" className="text-xs">inline</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {config.command} {config.args?.join(' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Textarea
            className="w-full h-full min-h-[400px] font-mono text-sm border-0 rounded-none resize-none"
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setHasChanges(true);
            }}
          />
        )}
      </ScrollArea>
    </div>
  );
}

// Markdown Editor Component
function MarkdownEditor({ content, onSave, fileType }) {
  const [text, setText] = useState(content || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setText(content || '');
    setHasChanges(false);
  }, [content]);

  const handleSave = () => {
    onSave(text);
    setHasChanges(false);
  };

  const config = FILE_CONFIG[fileType] || FILE_CONFIG.claudemd;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <config.icon className={cn('w-4 h-4', config.color)} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-1" />
            AI Assist
          </Button>
          {hasChanges && (
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>
      <Textarea
        className="flex-1 w-full font-mono text-sm border-0 rounded-none resize-none p-4"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setHasChanges(true);
        }}
        placeholder={`Enter ${config.label.toLowerCase()} content...`}
      />
    </div>
  );
}

// Settings Editor Component
function SettingsEditor({ content, parsed, onSave }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(parsed || {}, null, 2));
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setJsonText(JSON.stringify(parsed || {}, null, 2));
    setHasChanges(false);
  }, [parsed]);

  const handleSave = () => {
    try {
      JSON.parse(jsonText);
      onSave(jsonText);
      setHasChanges(false);
    } catch (e) {
      toast.error('Invalid JSON');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">Settings</span>
        </div>
        {hasChanges && (
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        )}
      </div>
      <Textarea
        className="flex-1 w-full font-mono text-sm border-0 rounded-none resize-none p-4"
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setHasChanges(true);
        }}
      />
    </div>
  );
}

// Move/Copy Dialog Component
function MoveCopyDialog({ open, onClose, item, intermediatePaths, onMove }) {
  const [mode, setMode] = useState('copy');
  const [selectedPath, setSelectedPath] = useState(null);
  const [customPath, setCustomPath] = useState('');
  const [merge, setMerge] = useState(false);

  const handleSubmit = () => {
    const targetDir = customPath.trim() || selectedPath;
    if (!targetDir) {
      toast.error('Please select or enter a target path');
      return;
    }
    onMove(item.path, targetDir, mode, merge);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'copy' ? 'Copy' : 'Move'} {item?.name}</DialogTitle>
          <DialogDescription>
            Select a destination for this file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'copy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('copy')}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            <Button
              variant={mode === 'move' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('move')}
            >
              <Move className="w-4 h-4 mr-1" />
              Move
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {intermediatePaths?.map((p) => (
              <div
                key={p.dir}
                className={cn(
                  'flex items-center justify-between p-2 rounded border cursor-pointer',
                  selectedPath === p.dir ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                )}
                onClick={() => {
                  setSelectedPath(p.dir);
                  setCustomPath('');
                }}
              >
                <div className="flex items-center gap-2">
                  {p.isHome ? <Home className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                  <span className="text-sm">{p.label}</span>
                </div>
                {p.hasClaudeFolder ? (
                  <Badge variant="secondary" className="text-xs">exists</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">create</Badge>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium">Or enter custom path:</label>
            <Input
              className="mt-1 font-mono text-sm"
              placeholder="/path/to/directory"
              value={customPath}
              onChange={(e) => {
                setCustomPath(e.target.value);
                setSelectedPath(null);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={merge} onCheckedChange={setMerge} />
            <span className="text-sm">Merge if target exists</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {mode === 'copy' ? 'Copy' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Create File Dialog Component
function CreateFileDialog({ open, onClose, dir, type, onCreate }) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName('');
  }, [open]);

  const handleCreate = () => {
    if ((type === 'command' || type === 'rule') && !name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    const finalName = type === 'command' || type === 'rule'
      ? (name.endsWith('.md') ? name : `${name}.md`)
      : name;
    onCreate(dir, finalName, type);
  };

  const config = FILE_CONFIG[type] || {};
  const needsName = type === 'command' || type === 'rule';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create {config.label || type}</DialogTitle>
        </DialogHeader>

        {needsName && (
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              className="mt-1"
              placeholder={type === 'command' ? 'my-command.md' : 'my-rule.md'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main FileExplorer Component
export default function FileExplorer({ onRefresh }) {
  const [folders, setFolders] = useState([]);
  const [intermediatePaths, setIntermediatePaths] = useState([]);
  const [registry, setRegistry] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [moveCopyDialog, setMoveCopyDialog] = useState({ open: false, item: null });
  const [createDialog, setCreateDialog] = useState({ open: false, dir: null, type: null });
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, item: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [foldersData, pathsData, registryData] = await Promise.all([
        api.getClaudeFolders(),
        api.getIntermediatePaths(),
        api.getRegistry(),
      ]);
      setFolders(foldersData);
      setIntermediatePaths(pathsData);
      setRegistry(registryData);
    } catch (error) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    try {
      const data = await api.getClaudeFile(item.path);
      setFileContent(data);
    } catch (error) {
      toast.error('Failed to load file: ' + error.message);
    }
  };

  const handleSaveFile = async (content) => {
    if (!selectedItem) return;
    try {
      await api.saveClaudeFile(selectedItem.path, content);
      toast.success('Saved');
      // Reload the file content to reflect changes
      const data = await api.getClaudeFile(selectedItem.path);
      setFileContent(data);
      loadData();
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    }
  };

  const handleToggleFolder = (path) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleCreateFile = (dir, type) => {
    if (type === 'command' || type === 'rule') {
      setCreateDialog({ open: true, dir, type });
    } else {
      doCreateFile(dir, type === 'mcps' ? 'mcps.json' : type === 'settings' ? 'settings.json' : 'CLAUDE.md', type);
    }
  };

  const doCreateFile = async (dir, name, type) => {
    try {
      await api.createClaudeFile(dir, name, type);
      toast.success('Created');
      setCreateDialog({ open: false, dir: null, type: null });
      loadData();
    } catch (error) {
      toast.error('Failed to create: ' + error.message);
    }
  };

  const handleCreateNewFolder = async (dir) => {
    try {
      // Create a mcps.json to initialize the .claude folder
      await api.createClaudeFile(dir, 'mcps.json', 'mcps');
      toast.success(`Created .claude folder at ${dir}`);
      setNewFolderDialog(false);
      loadData();
    } catch (error) {
      toast.error('Failed to create: ' + error.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await api.deleteClaudeFile(item.path);
      toast.success('Deleted');
      if (selectedItem?.path === item.path) {
        setSelectedItem(null);
        setFileContent(null);
      }
      loadData();
    } catch (error) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleMove = async (sourcePath, targetDir, mode, merge) => {
    try {
      await api.moveClaudeItem(sourcePath, targetDir, mode, merge);
      toast.success(mode === 'copy' ? 'Copied' : 'Moved');
      setMoveCopyDialog({ open: false, item: null });
      loadData();
    } catch (error) {
      toast.error('Failed: ' + error.message);
    }
  };

  // Render editor based on file type
  const renderEditor = () => {
    if (!selectedItem || !fileContent) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Select a file to edit</p>
          </div>
        </div>
      );
    }

    switch (selectedItem.type) {
      case 'mcps':
        return (
          <McpEditor
            content={fileContent.content}
            parsed={fileContent.parsed}
            onSave={handleSaveFile}
            registry={registry}
          />
        );
      case 'settings':
        return (
          <SettingsEditor
            content={fileContent.content}
            parsed={fileContent.parsed}
            onSave={handleSaveFile}
          />
        );
      case 'command':
      case 'rule':
      case 'claudemd':
        return (
          <MarkdownEditor
            content={fileContent.content}
            onSave={handleSaveFile}
            fileType={selectedItem.type}
          />
        );
      default:
        return (
          <MarkdownEditor
            content={fileContent.content}
            onSave={handleSaveFile}
            fileType="claudemd"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Tree View */}
      <div className="w-72 border-r flex flex-col bg-white">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="font-semibold text-sm">.claude Folders</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setNewFolderDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={loadData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {folders.map((folder, index) => (
            <div key={folder.dir}>
              <FolderHeader
                folder={folder}
                isFirst={index === 0}
                isLast={index === folders.length - 1}
                onCreateFile={handleCreateFile}
              />
              {folder.exists && folder.files.length > 0 ? (
                <div className="py-1">
                  {folder.files.map((file) => (
                    <TreeItem
                      key={file.path}
                      item={file}
                      selectedPath={selectedItem?.path}
                      onSelect={handleSelectItem}
                      onContextMenu={handleContextMenu}
                      expandedFolders={expandedFolders}
                      onToggleFolder={handleToggleFolder}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 italic">
                  {folder.exists ? 'Empty' : 'No .claude folder'}
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedItem && (
          <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-mono truncate max-w-md">
                {selectedItem.path}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMoveCopyDialog({ open: true, item: selectedItem })}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(selectedItem)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="flex-1">
          {renderEditor()}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.item && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu({ x: 0, y: 0, item: null })}
          />
          <div
            className="fixed z-50 bg-white rounded-md shadow-lg border py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              onClick={() => {
                setMoveCopyDialog({ open: true, item: contextMenu.item });
                setContextMenu({ x: 0, y: 0, item: null });
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to...
            </button>
            <button
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              onClick={() => {
                setMoveCopyDialog({ open: true, item: contextMenu.item });
                setContextMenu({ x: 0, y: 0, item: null });
              }}
            >
              <Move className="w-4 h-4 mr-2" />
              Move to...
            </button>
            <div className="border-t my-1" />
            <button
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center text-red-600"
              onClick={() => {
                handleDelete(contextMenu.item);
                setContextMenu({ x: 0, y: 0, item: null });
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Move/Copy Dialog */}
      <MoveCopyDialog
        open={moveCopyDialog.open}
        onClose={() => setMoveCopyDialog({ open: false, item: null })}
        item={moveCopyDialog.item}
        intermediatePaths={intermediatePaths}
        onMove={handleMove}
      />

      {/* Create File Dialog */}
      <CreateFileDialog
        open={createDialog.open}
        onClose={() => setCreateDialog({ open: false, dir: null, type: null })}
        dir={createDialog.dir}
        type={createDialog.type}
        onCreate={doCreateFile}
      />

      {/* New .claude Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New .claude Folder</DialogTitle>
            <DialogDescription>
              Select a location to create a new .claude configuration folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {intermediatePaths
              .filter(p => !folders.some(f => f.dir === p.dir))
              .map((p) => (
                <div
                  key={p.dir}
                  className="flex items-center justify-between p-3 rounded border hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCreateNewFolder(p.dir)}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-mono">{p.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">create</Badge>
                </div>
              ))}
            {intermediatePaths.filter(p => !folders.some(f => f.dir === p.dir)).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                All intermediate directories already have .claude folders
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewFolderDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
