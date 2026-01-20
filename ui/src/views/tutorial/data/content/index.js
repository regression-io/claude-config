// Aggregate all tutorial content from per-section files
import { welcomeContent } from './welcome';
import { firstProjectContent } from './first-project';
import { rulesContent } from './rules';
import { mcpContent } from './mcp';
import { permissionsContent } from './permissions';
import { memoryContent } from './memory';
import { pluginsContent } from './plugins';
import { workstreamsContent } from './workstreams';
import { multiToolContent } from './multi-tool';
import { nextStepsContent } from './next-steps';

const tutorialContent = {
  ...welcomeContent,
  ...firstProjectContent,
  ...rulesContent,
  ...mcpContent,
  ...permissionsContent,
  ...memoryContent,
  ...pluginsContent,
  ...workstreamsContent,
  ...multiToolContent,
  ...nextStepsContent,
};

export default tutorialContent;
