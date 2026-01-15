import React, { useState, useEffect } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import PathPicker from './PathPicker';
import api from "@/lib/api";
import { toast } from "sonner";

export default function AddProjectDialog({ open, onOpenChange, onAdded }) {
  const [projectPath, setProjectPath] = useState('');
  const [name, setName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setProjectPath('');
      setName('');
    }
  }, [open]);

  // Auto-fill name from path
  useEffect(() => {
    if (projectPath && !name) {
      const folderName = projectPath.split('/').pop();
      setName(folderName || '');
    }
  }, [projectPath]);

  const handlePathSelect = (selectedPath) => {
    setProjectPath(selectedPath);
    setPickerOpen(false);
  };

  const handleAdd = async () => {
    if (!projectPath) {
      toast.error('Please select a project path');
      return;
    }

    setAdding(true);
    try {
      const result = await api.addProject(projectPath, name || undefined);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Added project: ${result.project.name}`);
        onAdded?.(result.project);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Failed to add project: ' + error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-500" />
              Add Project
            </DialogTitle>
            <DialogDescription>
              Register a project folder to quickly switch between projects in the UI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="path">Project Path</Label>
              <div className="flex gap-2">
                <Input
                  id="path"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="/path/to/project"
                  className="font-mono text-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPickerOpen(true)}
                  title="Browse"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Auto-filled from folder name"
              />
              <p className="text-xs text-gray-500">
                Optional. Leave empty to use folder name.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={adding || !projectPath}>
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PathPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePathSelect}
        type="directory"
        initialPath="~"
        title="Select Project Folder"
      />
    </>
  );
}
