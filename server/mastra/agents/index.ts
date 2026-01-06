export { engineerAgent } from './engineer';
export { pmAgent } from './pm';
export { designerAgent } from './designer';
export { marketerAgent } from './marketer';

import { engineerAgent } from './engineer';
import { pmAgent } from './pm';
import { designerAgent } from './designer';
import { marketerAgent } from './marketer';

export const agents = {
  engineer: engineerAgent,
  pm: pmAgent,
  designer: designerAgent,
  marketer: marketerAgent,
};

export type AgentRole = keyof typeof agents;

export function getAgent(role: AgentRole) {
  return agents[role];
}
