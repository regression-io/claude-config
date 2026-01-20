import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GraduationCap, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extracted data and utilities
import tutorialSections from './tutorial/data/tutorialSections';
import tutorialContent from './tutorial/data/tutorialContent';
import { formatMarkdown } from './docs/utils/markdown';

export default function TutorialView() {
  const [activeSection, setActiveSection] = useState('intro');
  const [expandedSections, setExpandedSections] = useState({ 'welcome': true });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const currentDoc = tutorialContent[activeSection];

  // Get flat list of all section IDs for navigation
  const allSectionIds = tutorialSections.flatMap(section =>
    section.subsections.length > 0
      ? section.subsections.map(s => s.id)
      : [section.id]
  );

  const currentIndex = allSectionIds.indexOf(activeSection);
  const prevSection = currentIndex > 0 ? allSectionIds[currentIndex - 1] : null;
  const nextSection = currentIndex < allSectionIds.length - 1 ? allSectionIds[currentIndex + 1] : null;

  // Find section title by ID
  const getSectionTitle = (id) => {
    for (const section of tutorialSections) {
      if (section.id === id) return section.title;
      const sub = section.subsections.find(s => s.id === id);
      if (sub) return sub.title;
    }
    return '';
  };

  // Content is from our own static files, not user input - safe to render as HTML
  const renderContent = (content) => {
    return { __html: formatMarkdown(content) };
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <GraduationCap className="w-5 h-5 text-primary" />
            Tutorial
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Step-by-step guide</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {tutorialSections.map((section, sectionIndex) => (
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
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {sectionIndex + 1}
                  </span>
                  <span className="flex-1">{section.title}</span>
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
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto p-8">
            {currentDoc ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={renderContent(currentDoc.content)}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a topic from the sidebar</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Navigation Footer */}
        <div className="border-t border-border p-4 bg-muted/30">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {prevSection ? (
              <Button
                variant="ghost"
                onClick={() => setActiveSection(prevSection)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {getSectionTitle(prevSection)}
              </Button>
            ) : (
              <div />
            )}

            {nextSection ? (
              <Button
                onClick={() => setActiveSection(nextSection)}
                className="flex items-center gap-2"
              >
                {getSectionTitle(nextSection)}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setActiveSection('intro')}
              >
                Start Over
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
