// Export all tools
export { codeTools, generateReactComponent, generateApiEndpoint, fixBug } from './code';
export { productTools, breakdownProject, prioritizeTasks, writeUserStory } from './product';
export { designTools, createDesignSystem, createComponentStyles } from './design';
export { marketingTools, createLandingPageCopy, createSocialPost, createEmailCampaign } from './marketing';

import { codeTools } from './code';
import { productTools } from './product';
import { designTools } from './design';
import { marketingTools } from './marketing';

// Combined tools by category
export const allTools = {
  ...codeTools,
  ...productTools,
  ...designTools,
  ...marketingTools,
};

// Tools organized by agent role
export const toolsByRole = {
  engineer: codeTools,
  pm: productTools,
  designer: designTools,
  marketer: marketingTools,
};
