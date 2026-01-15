import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, RefreshCw, ExternalLink, FolderPlus, Trash2, ArrowLeft, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SubprojectsView({ project, rootProject, onRefresh }) {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, proj: null });

  // Use rootProject subprojects if available (sticky behavior)
  const subprojects = rootProject?.subprojects || project.subprojects || [];
  const isInSubproject = rootProject && project.dir !== rootProject.dir;

  const handleSwitchProject = async (dir) => {
    try {
      await api.switchProject(dir);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to switch project: ' + error.message);
    }
  };

  const handleBackToRoot = async () => {
    if (rootProject?.dir) {
      await handleSwitchProject(rootProject.dir);
    }
  };

  const handleInitClaudeFolder = async (proj, e) => {
    e.stopPropagation();
    try {
      const result = await api.initClaudeFolder(proj.dir);
      if (result.success) {
        toast.success(`Created .claude folder in ${proj.name}`);
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to create .claude folder');
      }
    } catch (error) {
      toast.error('Failed to create .claude folder: ' + error.message);
    }
  };

  const handleDeleteClaudeFolder = async () => {
    const proj = deleteDialog.proj;
    if (!proj) return;

    try {
      const result = await api.deleteClaudeFolder(proj.dir);
      if (result.success) {
        toast.success(`Deleted .claude folder from ${proj.name}`);
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to delete .claude folder');
      }
    } catch (error) {
      toast.error('Failed to delete .claude folder: ' + error.message);
    }
    setDeleteDialog({ open: false, proj: null });
  };

  const openDeleteDialog = (proj, e) => {
    e.stopPropagation();
    setDeleteDialog({ open: true, proj });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-500" />
            Sub-Projects
          </h2>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Current location info */}
        <div className={`p-4 mx-4 mb-4 mt-4 rounded-lg border-l-4 ${isInSubproject ? 'bg-blue-500/10 border-blue-500' : 'bg-amber-500/10 border-amber-500'}`}>
          {isInSubproject && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Currently in sub-project
              </p>
              <Button variant="outline" size="sm" onClick={handleBackToRoot} className="h-7">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back to Root
              </Button>
            </div>
          )}
          <p className="text-sm text-foreground">
            <span className="font-semibold">Current Directory:</span>{' '}
            <code className="text-muted-foreground bg-muted px-2 py-0.5 rounded">{project.dir}</code>
          </p>
          {rootProject && rootProject.dir !== project.dir && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold">Root Project:</span>{' '}
              <code className="bg-muted px-2 py-0.5 rounded">{rootProject.dir}</code>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Found {subprojects.length} sub-project{subprojects.length !== 1 ? 's' : ''} with .git directories.
          </p>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subprojects.map((proj, index) => {
            const isCurrentProject = proj.dir === project.dir;
            return (
              <motion.div
                key={proj.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-card rounded-lg border p-4 transition-all group ${
                  isCurrentProject
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:shadow-md cursor-pointer'
                }`}
                onClick={() => !isCurrentProject && handleSwitchProject(proj.dir)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{proj.name}</h3>
                    {isCurrentProject && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {proj.markers?.git && <span title="Git">🔀</span>}
                    {proj.markers?.npm && <span title="NPM">📦</span>}
                    {proj.markers?.python && <span title="Python">🐍</span>}
                    {proj.markers?.claude && <span title="Claude Config">⚙️</span>}
                  </div>
                </div>
                <code className="text-xs text-muted-foreground block mb-3">{proj.relativePath || proj.name}</code>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={proj.hasConfig
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                  }>
                    {proj.hasConfig ? `✓ ${proj.mcpCount || 0} MCPs` : 'No config'}
                  </Badge>
                  <div className="flex gap-1">
                    {!proj.hasConfig ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                        onClick={(e) => handleInitClaudeFolder(proj, e)}
                        title="Create .claude folder"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); handleSwitchProject(proj.dir); }}
                          title="Manage in Project Explorer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100"
                          onClick={(e) => openDeleteDialog(proj, e)}
                          title="Delete .claude folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {subprojects.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No sub-projects found in this directory.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, proj: deleteDialog.proj })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete .claude folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the .claude folder from <strong>{deleteDialog.proj?.name}</strong>, including all rules, commands, and configuration.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClaudeFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
