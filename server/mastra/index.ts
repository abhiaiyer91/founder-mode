import { Mastra } from '@mastra/core';
import { agents } from './agents';

// Initialize Mastra with all agents
export const mastra = new Mastra({
  agents,
});

// Export everything for easy access
export { agents, getAgent } from './agents';
export type { AgentRole } from './agents';
export { allTools, toolsByRole } from './tools';
