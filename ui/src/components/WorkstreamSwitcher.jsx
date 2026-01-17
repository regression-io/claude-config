import React, { useState, useEffect } from 'react';
import { ChevronDown, Workflow, Plus, Check, Settings2, Loader2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

export default function WorkstreamSwitcher({ onManageClick }) {
  const [workstreams, setWorkstreams] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadWorkstreams();
  }, []);

  const loadWorkstreams = async () => {
    try {
      const data = await api.getWorkstreams();
      setWorkstreams(data.workstreams || []);
      setActiveId(data.activeId);
    } catch (error) {
      console.error('Failed to load workstreams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (id) => {
    if (id === activeId) return;

    setSwitching(true);
    try {
      const result = await api.setActiveWorkstream(id);
      if (result.success) {
        setActiveId(id);
        toast.success(`Switched to: ${result.workstream.name}`);
      } else {
        toast.error(result.error || 'Failed to switch workstream');
      }
    } catch (error) {
      toast.error('Failed to switch workstream');
    } finally {
      setSwitching(false);
    }
  };

  const activeWorkstream = workstreams.find(ws => ws.id === activeId);

  // Don't show if no workstreams
  if (!loading && workstreams.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 max-w-[180px] h-9 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700"
          disabled={loading || switching}
        >
          {loading || switching ? (
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          ) : (
            <Workflow className="w-4 h-4 text-purple-500 flex-shrink-0" />
          )}
          <span className="truncate font-medium text-purple-700 dark:text-purple-400">
            {activeWorkstream?.name || 'No Workstream'}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-gray-500 dark:text-slate-400 font-normal">
          Workstreams
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {workstreams.length === 0 ? (
          <div className="px-3 py-6 text-sm text-gray-500 dark:text-slate-400 text-center">
            <Workflow className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p>No workstreams yet</p>
            <p className="text-xs mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {workstreams.map(ws => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleSwitch(ws.id)}
                className={`flex items-start gap-2 py-2 cursor-pointer ${
                  ws.id === activeId ? 'bg-purple-50 dark:bg-purple-950/30' : ''
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {ws.id === activeId ? (
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Workflow className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`truncate font-medium ${
                    ws.id === activeId ? 'text-purple-700 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {ws.name}
                  </div>
                  {ws.projects?.length > 0 && (
                    <div className="truncate text-xs text-gray-400 dark:text-slate-500">
                      {ws.projects.length} project{ws.projects.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {ws.rules && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-400" title="Has rules defined" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onManageClick} className="gap-2 cursor-pointer">
          <Settings2 className="w-4 h-4" />
          Manage Workstreams
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
