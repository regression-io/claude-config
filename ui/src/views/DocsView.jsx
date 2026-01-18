import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronRight } from 'lucide-react';

// Extracted data and utilities
import docSections from './docs/data/docSections';
import docContent from './docs/data/docContent';
import { formatMarkdown } from './docs/utils/markdown';

export default function DocsView() {
  const [activeSection, setActiveSection] = useState('installation');
  const [expandedSections, setExpandedSections] = useState({ 'getting-started': true });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const currentDoc = docContent[activeSection];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <BookOpen className="w-5 h-5" />
            Documentation
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {docSections.map((section) => (
              <div key={section.id} className="mb-1">
                <button
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-left",
                    (activeSection === section.id || section.subsections.some(s => s.id === activeSection)) && "bg-accent"
                  )}
                  onClick={() => {
                    if (section.subsections.length > 0) {
                      toggleSection(section.id);
                      if (!expandedSections[section.id]) {
                        setActiveSection(section.subsections[0].id);
                      }
                    } else {
                      setActiveSection(section.id);
                    }
                  }}
                >
                  <section.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">{section.title}</span>
                  {section.isNew && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                      new
                    </span>
                  )}
                  {section.subsections.length > 0 && (
                    <ChevronRight className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      expandedSections[section.id] && "rotate-90"
                    )} />
                  )}
                </button>
                {section.subsections.length > 0 && expandedSections[section.id] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.subsections.map((sub) => (
                      <button
                        key={sub.id}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-accent text-foreground",
                          activeSection === sub.id && "bg-accent text-primary font-medium"
                        )}
                        onClick={() => setActiveSection(sub.id)}
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto p-8">
            {currentDoc ? (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{
                  __html: formatMarkdown(currentDoc.content)
                }} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a topic from the sidebar</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
