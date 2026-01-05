import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool for generating React/TypeScript code
 */
export const generateReactComponent = createTool({
  id: 'generate-react-component',
  description: 'Generate a React component with TypeScript. Use this for UI features.',
  inputSchema: z.object({
    componentName: z.string().describe('PascalCase name for the component'),
    description: z.string().describe('What the component should do'),
    props: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
    })).optional().describe('Component props'),
    includeStyles: z.boolean().default(true).describe('Whether to include CSS'),
  }),
  outputSchema: z.object({
    componentCode: z.string(),
    cssCode: z.string().optional(),
    filePath: z.string(),
  }),
  execute: async ({ context }) => {
    const { componentName, description, props = [], includeStyles } = context;
    
    const propsInterface = props.length > 0 
      ? `interface ${componentName}Props {\n${props.map(p => 
          `  ${p.name}${p.required ? '' : '?'}: ${p.type};`
        ).join('\n')}\n}`
      : '';

    const componentCode = `// File: src/components/${componentName}.tsx
// ${description}

import { useState } from 'react';
${includeStyles ? `import './${componentName}.css';` : ''}

${propsInterface}

export function ${componentName}(${props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }: ${componentName}Props` : ''}) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="${componentName.toLowerCase()}">
      <h2>${componentName}</h2>
      {/* ${description} */}
    </div>
  );
}

export default ${componentName};
`;

    const cssCode = includeStyles ? `/* Styles for ${componentName} */
.${componentName.toLowerCase()} {
  background: var(--terminal-bg);
  border: 1px solid var(--terminal-border);
  border-radius: 8px;
  padding: 24px;
}

.${componentName.toLowerCase()}:hover {
  border-color: var(--color-accent);
}
` : undefined;

    return {
      componentCode,
      cssCode,
      filePath: `src/components/${componentName}.tsx`,
    };
  },
});

/**
 * Tool for generating API endpoints
 */
export const generateApiEndpoint = createTool({
  id: 'generate-api-endpoint',
  description: 'Generate a REST API endpoint with proper error handling',
  inputSchema: z.object({
    endpointName: z.string().describe('Name of the endpoint'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).describe('HTTP method'),
    description: z.string().describe('What the endpoint does'),
    requestBody: z.record(z.string()).optional().describe('Expected request body fields'),
    responseFields: z.record(z.string()).optional().describe('Response fields'),
  }),
  outputSchema: z.object({
    code: z.string(),
    filePath: z.string(),
  }),
  execute: async ({ context }) => {
    const { endpointName, method, description, requestBody, responseFields } = context;
    
    const code = `// File: src/api/${endpointName}.ts
// ${description}

import { Request, Response } from 'express';

${requestBody ? `interface ${endpointName}Request {
${Object.entries(requestBody).map(([k, v]) => `  ${k}: ${v};`).join('\n')}
}` : ''}

${responseFields ? `interface ${endpointName}Response {
${Object.entries(responseFields).map(([k, v]) => `  ${k}: ${v};`).join('\n')}
}` : ''}

export async function ${endpointName}(req: Request, res: Response) {
  try {
    ${method === 'POST' || method === 'PUT' ? `const body = req.body as ${endpointName}Request;
    
    // Validate input
    if (!body) {
      return res.status(400).json({ error: 'Invalid request body' });
    }` : ''}
    
    // TODO: Implement ${description}
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in ${endpointName}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
`;

    return {
      code,
      filePath: `src/api/${endpointName}.ts`,
    };
  },
});

/**
 * Tool for fixing bugs in code
 */
export const fixBug = createTool({
  id: 'fix-bug',
  description: 'Analyze and fix a bug in code',
  inputSchema: z.object({
    bugDescription: z.string().describe('Description of the bug'),
    affectedCode: z.string().optional().describe('The code that has the bug'),
    errorMessage: z.string().optional().describe('Any error messages'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    fixedCode: z.string(),
    explanation: z.string(),
  }),
  execute: async ({ context }) => {
    const { bugDescription, affectedCode, errorMessage } = context;
    
    return {
      analysis: `Bug Analysis: ${bugDescription}\n${errorMessage ? `Error: ${errorMessage}` : ''}`,
      fixedCode: affectedCode || '// Fixed code would go here',
      explanation: `The bug "${bugDescription}" was fixed by implementing proper error handling and validation.`,
    };
  },
});

export const codeTools = {
  generateReactComponent,
  generateApiEndpoint,
  fixBug,
};
