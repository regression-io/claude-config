// Aggregate all documentation content from per-section files
import { gettingStartedContent } from './getting-started';
import { projectsContent } from './projects';
import { fileExplorerContent } from './file-explorer';
import { workstreamsContent } from './workstreams';
import { pluginsContent } from './plugins';
import { mcpRegistryContent } from './mcp-registry';
import { memoryContent } from './memory';
import { claudeSettingsContent } from './claude-settings';
import { templatesContent } from './templates';
import { cliContent } from './cli';
import { multiToolContent } from './multi-tool';
import { keyboardContent } from './keyboard';
import { troubleshootingContent } from './troubleshooting';

const docContent = {
  ...gettingStartedContent,
  ...projectsContent,
  ...fileExplorerContent,
  ...workstreamsContent,
  ...pluginsContent,
  ...mcpRegistryContent,
  ...memoryContent,
  ...claudeSettingsContent,
  ...templatesContent,
  ...cliContent,
  ...multiToolContent,
  ...keyboardContent,
  ...troubleshootingContent,
};

export default docContent;
