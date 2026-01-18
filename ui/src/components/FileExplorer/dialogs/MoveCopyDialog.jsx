import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Folder, Home, Copy, Move } from 'lucide-react';

export default function MoveCopyDialog({ open, onClose, item, intermediatePaths, onMove }) {
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
          <DialogDescription>Select a destination for this file</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'copy' ? 'default' : 'outline'} size="sm" onClick={() => setMode('copy')}>
              <Copy className="w-4 h-4 mr-1" /> Copy
            </Button>
            <Button variant={mode === 'move' ? 'default' : 'outline'} size="sm" onClick={() => setMode('move')}>
              <Move className="w-4 h-4 mr-1" /> Move
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {intermediatePaths?.map((p) => (
              <div
                key={p.dir}
                className={cn(
                  'flex items-center justify-between p-2 rounded border cursor-pointer',
                  selectedPath === p.dir ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                )}
                onClick={() => { setSelectedPath(p.dir); setCustomPath(''); }}
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
              onChange={(e) => { setCustomPath(e.target.value); setSelectedPath(null); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={merge} onCheckedChange={setMerge} />
            <span className="text-sm">Merge if target exists</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{mode === 'copy' ? 'Copy' : 'Move'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
