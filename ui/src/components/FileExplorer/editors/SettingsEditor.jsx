import React from 'react';
import ClaudeSettingsEditor from '@/components/ClaudeSettingsEditor';
import GeminiSettingsEditor from '@/components/GeminiSettingsEditor';

export default function SettingsEditor({ content, parsed, onSave, filePath }) {
  const handleSave = async (settings) => {
    const jsonContent = JSON.stringify(settings, null, 2);
    onSave(jsonContent);
  };

  const isGemini = filePath?.includes('.gemini') || filePath?.includes('/.gemini/');
  const isAntigravity = filePath?.includes('.agent') || filePath?.includes('/antigravity/');

  if (isGemini && !isAntigravity) {
    return (
      <div className="h-full overflow-auto p-4">
        <GeminiSettingsEditor
          settings={parsed || {}}
          onSave={handleSave}
          loading={false}
          settingsPath={filePath || '~/.gemini/settings.json'}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <ClaudeSettingsEditor
        settings={parsed || {}}
        onSave={handleSave}
        loading={false}
        settingsPath={filePath || '~/.claude/settings.json'}
      />
    </div>
  );
}
