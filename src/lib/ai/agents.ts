/**
 * Agent Definitions for Founder Mode
 * 
 * These agents follow Mastra-style patterns but are browser-compatible.
 * When connected to a backend with full Mastra, these can be upgraded.
 */

import type { Employee, EmployeeRole } from '../../types';
import { ROLE_BASE_PROMPTS } from '../../types';

export interface AgentDefinition {
  name: string;
  role: EmployeeRole;
  systemPrompt: string;
}

// Default agents using role base prompts (for backwards compatibility)
export const engineerAgent: AgentDefinition = {
  name: 'Engineer',
  role: 'engineer',
  systemPrompt: ROLE_BASE_PROMPTS.engineer,
};

export const pmAgent: AgentDefinition = {
  name: 'Product Manager',
  role: 'pm',
  systemPrompt: ROLE_BASE_PROMPTS.pm,
};

export const designerAgent: AgentDefinition = {
  name: 'Designer',
  role: 'designer',
  systemPrompt: ROLE_BASE_PROMPTS.designer,
};

export const agents: Record<EmployeeRole, AgentDefinition> = {
  engineer: engineerAgent,
  pm: pmAgent,
  designer: designerAgent,
};

/**
 * Get the default agent definition for a role
 */
export function getAgent(role: EmployeeRole): AgentDefinition {
  return agents[role];
}

/**
 * Build the complete system prompt for an employee.
 * Combines the employee's base system prompt with any custom instructions.
 */
export function getEmployeeSystemPrompt(employee: Employee): string {
  const basePrompt = employee.systemPrompt || ROLE_BASE_PROMPTS[employee.role];
  const customPrompt = employee.customPrompt?.trim();
  
  if (customPrompt) {
    return `${basePrompt}\n\n## Additional Instructions from Founder:\n${customPrompt}`;
  }
  
  return basePrompt;
}

/**
 * Create an agent definition customized for a specific employee.
 * This allows per-employee AI personality and behavior.
 */
export function getAgentForEmployee(employee: Employee): AgentDefinition {
  return {
    name: employee.name,
    role: employee.role,
    systemPrompt: getEmployeeSystemPrompt(employee),
  };
}
