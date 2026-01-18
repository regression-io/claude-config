import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { FILE_CONFIG } from '../fileConfig';

export default function MarkdownEditor({ content, onSave, fileType }) {
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
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <config.icon className={cn('w-4 h-4', config.color)} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <div className="flex gap-2">
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
