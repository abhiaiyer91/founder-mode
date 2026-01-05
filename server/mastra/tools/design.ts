import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool for creating a design system
 */
export const createDesignSystem = createTool({
  id: 'create-design-system',
  description: 'Create a comprehensive design system with colors, typography, and spacing',
  inputSchema: z.object({
    brandName: z.string().describe('Name of the brand/product'),
    style: z.enum(['modern', 'minimal', 'playful', 'corporate', 'terminal']).describe('Design style'),
    primaryColor: z.string().optional().describe('Primary brand color (hex)'),
    darkMode: z.boolean().default(true).describe('Whether to include dark mode'),
  }),
  outputSchema: z.object({
    cssVariables: z.string(),
    colorPalette: z.record(z.string()),
    typography: z.object({
      fontFamily: z.string(),
      scale: z.array(z.string()),
    }),
    spacing: z.array(z.string()),
    recommendations: z.string(),
  }),
  execute: async ({ context }) => {
    const { brandName, style, primaryColor, darkMode } = context;
    
    const colors = style === 'terminal' ? {
      primary: primaryColor || '#00ff88',
      background: '#0a0e14',
      surface: '#0d1117',
      border: '#1f2430',
      text: '#e6edf3',
      textMuted: '#8b949e',
      success: '#3fb950',
      warning: '#d29922',
      error: '#f85149',
    } : {
      primary: primaryColor || '#6366f1',
      background: darkMode ? '#0f172a' : '#ffffff',
      surface: darkMode ? '#1e293b' : '#f8fafc',
      border: darkMode ? '#334155' : '#e2e8f0',
      text: darkMode ? '#f1f5f9' : '#0f172a',
      textMuted: darkMode ? '#94a3b8' : '#64748b',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
    };

    const cssVariables = `:root {
  /* ${brandName} Design System */
  
  /* Colors */
  --color-primary: ${colors.primary};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-border: ${colors.border};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.15);
}`;

    return {
      cssVariables,
      colorPalette: colors,
      typography: {
        fontFamily: style === 'terminal' ? 'IBM Plex Mono' : 'Inter',
        scale: ['0.75rem', '0.875rem', '1rem', '1.125rem', '1.25rem', '1.5rem', '2rem'],
      },
      spacing: ['0.25rem', '0.5rem', '0.75rem', '1rem', '1.5rem', '2rem', '3rem'],
      recommendations: `${brandName} uses a ${style} design language. ${darkMode ? 'Dark mode is the default.' : 'Light mode is preferred.'} Use ${style === 'terminal' ? 'monospace fonts' : 'clean sans-serif fonts'} for ${style === 'terminal' ? 'that hacker aesthetic' : 'readability'}.`,
    };
  },
});

/**
 * Tool for creating CSS for a component
 */
export const createComponentStyles = createTool({
  id: 'create-component-styles',
  description: 'Create CSS styles for a specific component',
  inputSchema: z.object({
    componentName: z.string().describe('Name of the component'),
    componentType: z.enum(['button', 'card', 'input', 'modal', 'nav', 'list', 'custom']),
    variants: z.array(z.string()).optional().describe('Style variants (e.g., primary, secondary)'),
    includeAnimations: z.boolean().default(true),
    includeResponsive: z.boolean().default(true),
  }),
  outputSchema: z.object({
    css: z.string(),
    usage: z.string(),
  }),
  execute: async ({ context }) => {
    const { componentName, componentType, variants = ['default'], includeAnimations, includeResponsive } = context;
    const className = componentName.toLowerCase().replace(/\s+/g, '-');
    
    let css = `/* ${componentName} Styles */\n`;
    
    // Base styles based on type
    if (componentType === 'button') {
      css += `.${className} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.${className}:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.${className}:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
      
      if (variants.includes('primary') || variants.includes('default')) {
        css += `
.${className}--primary {
  background: var(--color-primary);
  color: var(--color-background);
  border: none;
}

.${className}--primary:hover:not(:disabled) {
  filter: brightness(1.1);
}
`;
      }
    } else if (componentType === 'card') {
      css += `.${className} {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 0.2s ease;
}

.${className}:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.${className}__header {
  margin-bottom: var(--space-4);
}

.${className}__title {
  color: var(--color-text);
  font-weight: 600;
  margin: 0;
}

.${className}__content {
  color: var(--color-text-muted);
}
`;
    } else if (componentType === 'input') {
      css += `.${className} {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-family: var(--font-mono);
  transition: border-color 0.2s ease;
}

.${className}:focus {
  outline: none;
  border-color: var(--color-primary);
}

.${className}::placeholder {
  color: var(--color-text-muted);
}

.${className}:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
    } else {
      css += `.${className} {
  /* Base styles for ${componentName} */
}
`;
    }

    if (includeAnimations) {
      css += `
/* Animations */
@keyframes ${className}-fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.${className}--animated {
  animation: ${className}-fadeIn 0.2s ease-out;
}
`;
    }

    if (includeResponsive) {
      css += `
/* Responsive */
@media (max-width: 768px) {
  .${className} {
    /* Mobile adjustments */
  }
}
`;
    }

    return {
      css,
      usage: `<div className="${className}">\n  {/* ${componentName} content */}\n</div>`,
    };
  },
});

export const designTools = {
  createDesignSystem,
  createComponentStyles,
};
