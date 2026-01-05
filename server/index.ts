import express, { type Express } from 'express';
import cors from 'cors';
import { agents, allTools } from './mastra';
import type { AgentRole } from './mastra';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'founder-mode-mastra' });
});

// List available agents
app.get('/api/agents', (req, res) => {
  const agentList = Object.entries(agents).map(([role, agent]) => ({
    role,
    name: agent.name,
  }));
  res.json({ agents: agentList });
});

// Generate with an agent
app.post('/api/agents/:role/generate', async (req, res) => {
  try {
    const role = req.params.role as AgentRole;
    const { prompt, context } = req.body;

    if (!agents[role]) {
      return res.status(404).json({ error: `Agent '${role}' not found` });
    }

    const agent = agents[role];
    
    console.log(`[${role}] Generating response for: ${prompt.slice(0, 100)}...`);
    
    const result = await agent.generate(prompt, {
      // Pass context if provided
      ...(context && { context }),
    });

    res.json({
      role,
      text: result.text,
      toolCalls: result.toolCalls,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Agent generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List available tools
app.get('/api/tools', (_req, res) => {
  const toolList = Object.keys(allTools);
  res.json({ tools: toolList });
});

// Execute a specific tool
app.post('/api/tools/:toolId/execute', async (req, res) => {
  try {
    const { toolId } = req.params;
    const { input } = req.body;

    // Get tool from our tools registry
    if (!(toolId in allTools)) {
      return res.status(404).json({ error: `Tool '${toolId}' not found` });
    }

    console.log(`[tool:${toolId}] Executing with input:`, input);
    
    // Execute the tool - cast to any to handle the union type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tool = (allTools as any)[toolId];
    const result = await tool.execute({ context: input });

    res.json({
      toolId,
      result,
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({ 
      error: 'Failed to execute tool',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Engineer: Work on a task
app.post('/api/engineer/work', async (req, res) => {
  try {
    const { task, projectContext } = req.body;
    
    const prompt = `Work on this development task:

**Task:** ${task.title}
**Type:** ${task.type}
**Description:** ${task.description || 'No additional description'}

**Project Context:** ${projectContext}

Use the appropriate tool to generate the code needed. If it's a feature, use generateReactComponent. If it's a bug, use fixBug. If it's an API task, use generateApiEndpoint.`;

    const result = await agents.engineer.generate(prompt);
    
    res.json({
      success: true,
      code: result.text,
      toolCalls: result.toolCalls,
    });
  } catch (error) {
    console.error('Engineer work error:', error);
    res.status(500).json({ error: 'Failed to complete engineering task' });
  }
});

// PM: Generate tasks from idea
app.post('/api/pm/breakdown', async (req, res) => {
  try {
    const { projectIdea, existingTasks, teamSize } = req.body;
    
    const prompt = `Break down this project idea into tasks:

**Project Idea:** ${projectIdea}

**Current Team:**
- ${teamSize?.engineers || 0} engineers
- ${teamSize?.designers || 0} designers
- ${teamSize?.marketers || 0} marketers

**Existing Tasks (avoid duplicates):** ${existingTasks?.join(', ') || 'None yet'}

Use the breakdownProject tool to create a structured task list with milestones.`;

    const result = await agents.pm.generate(prompt);
    
    res.json({
      success: true,
      response: result.text,
      toolCalls: result.toolCalls,
    });
  } catch (error) {
    console.error('PM breakdown error:', error);
    res.status(500).json({ error: 'Failed to breakdown project' });
  }
});

// Designer: Create design
app.post('/api/designer/create', async (req, res) => {
  try {
    const { componentName, componentType, description } = req.body;
    
    const prompt = `Create styles for this component:

**Component:** ${componentName}
**Type:** ${componentType || 'custom'}
**Description:** ${description}

Use the createComponentStyles tool to generate CSS following our terminal/TUI design system.`;

    const result = await agents.designer.generate(prompt);
    
    res.json({
      success: true,
      css: result.text,
      toolCalls: result.toolCalls,
    });
  } catch (error) {
    console.error('Designer create error:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

// Marketer: Create content
app.post('/api/marketer/create', async (req, res) => {
  try {
    const { contentType, productName, productDescription, targetAudience } = req.body;
    
    let prompt = '';
    
    if (contentType === 'landing-page') {
      prompt = `Create landing page copy for:

**Product:** ${productName}
**Description:** ${productDescription}
**Target Audience:** ${targetAudience || 'founders and developers'}

Use the createLandingPageCopy tool to generate compelling copy.`;
    } else if (contentType === 'social-media') {
      prompt = `Create a social media post about:

**Product:** ${productName}
**Topic:** ${productDescription}

Use the createSocialPost tool to generate an engaging post.`;
    } else {
      prompt = `Create an email campaign for:

**Product:** ${productName}
**Message:** ${productDescription}

Use the createEmailCampaign tool.`;
    }

    const result = await agents.marketer.generate(prompt);
    
    res.json({
      success: true,
      content: result.text,
      toolCalls: result.toolCalls,
    });
  } catch (error) {
    console.error('Marketer create error:', error);
    res.status(500).json({ error: 'Failed to create marketing content' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Founder Mode Mastra Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Running on http://localhost:${PORT}
🤖 Agents loaded: ${Object.keys(agents).join(', ')}

Endpoints:
  GET  /health              - Health check
  GET  /api/agents          - List agents
  POST /api/agents/:role/generate - Generate with agent
  POST /api/tools/:id/execute     - Execute tool directly
  
  POST /api/engineer/work   - Engineer works on task
  POST /api/pm/breakdown    - PM breaks down project
  POST /api/designer/create - Designer creates styles
  POST /api/marketer/create - Marketer creates content
`);
});

export default app;
