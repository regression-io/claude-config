import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw } from 'lucide-react';
import { FILE_CONFIG } from '../fileConfig';

export default function MarkdownEditor({ content, onSave, fileType }) {
  const [text, setText] = useState(content || '');
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setText(content || '');
  }, [content]);

  // Debounced auto-save
  const debouncedSave = useCallback((newText) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await onSave(newText);
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [onSave]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    debouncedSave(newText);
  };

  const config = FILE_CONFIG[fileType] || FILE_CONFIG.claudemd;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <config.icon className={cn('w-4 h-4', config.color)} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <div className="flex gap-2">
          {saving && (
            <Badge variant="outline" className="text-xs text-blue-600">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </Badge>
          )}
        </div>
      </div>
      <Textarea
        className="flex-1 w-full font-mono text-sm border-0 rounded-none resize-none p-4"
        value={text}
        onChange={handleChange}
        placeholder={`Enter ${config.label.toLowerCase()} content...`}
      />
    </div>
  );
}
