/**
 * GitService - Manages a virtual git repository for the game
 * 
 * Every artifact becomes a commit. Users see their repo grow in real-time.
 * Can sync to a real GitHub repo when connected.
 */

import { v4 as uuidv4 } from 'uuid';

export interface GitCommit {
  id: string;
  hash: string; // Short hash like "a1b2c3d"
  message: string;
  author: string;
  authorAvatar: string;
  timestamp: number;
  files: GitFile[];
  branch: string;
  taskId?: string;
  artifactId?: string;
}

export interface GitFile {
  path: string;
  content: string;
  language: string;
  action: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
}

export interface GitBranch {
  name: string;
  isDefault: boolean;
  commits: number;
  lastCommit: GitCommit | null;
  missionId?: string; // If branch is tied to a mission
}

export interface GitRepo {
  name: string;
  description: string;
  defaultBranch: string;
  branches: GitBranch[];
  commits: GitCommit[];
  files: Map<string, string>; // path -> content
  remoteUrl: string | null;
  isConnected: boolean;
  stats: {
    totalCommits: number;
    totalFiles: number;
    totalLines: number;
    contributors: string[];
  };
}

export interface GitHubConnection {
  connected: boolean;
  username: string | null;
  repoName: string | null;
  repoUrl: string | null;
  lastPush: number | null;
  token: string | null;
}

// Generate a fake git hash
function generateHash(): string {
  return uuidv4().replace(/-/g, '').substring(0, 7);
}

// Count lines in content
function countLines(content: string): number {
  return content.split('\n').length;
}

// Detect language from file path
function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    py: 'python',
    go: 'go',
    rs: 'rust',
  };
  return langMap[ext] || 'plaintext';
}

// Create initial repo state
export function createRepo(name: string, description: string): GitRepo {
  const initialCommit: GitCommit = {
    id: uuidv4(),
    hash: generateHash(),
    message: '🎉 Initial commit - Project created with Founder Mode',
    author: 'Founder Mode',
    authorAvatar: '🤖',
    timestamp: Date.now(),
    files: [
      {
        path: 'README.md',
        content: `# ${name}\n\n${description}\n\n## Built with Founder Mode\n\nThis project was built using [Founder Mode](https://foundermode.app) - the RTS game where AI builds real software.\n`,
        language: 'markdown',
        action: 'added',
        additions: 7,
        deletions: 0,
      },
      {
        path: 'package.json',
        content: JSON.stringify({
          name: name.toLowerCase().replace(/\s+/g, '-'),
          version: '0.1.0',
          description,
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview',
          },
          dependencies: {},
          devDependencies: {
            typescript: '^5.0.0',
            vite: '^5.0.0',
          },
        }, null, 2),
        language: 'json',
        action: 'added',
        additions: 15,
        deletions: 0,
      },
    ],
    branch: 'main',
  };

  return {
    name,
    description,
    defaultBranch: 'main',
    branches: [
      {
        name: 'main',
        isDefault: true,
        commits: 1,
        lastCommit: initialCommit,
      },
    ],
    commits: [initialCommit],
    files: new Map([
      ['README.md', initialCommit.files[0].content],
      ['package.json', initialCommit.files[1].content],
    ]),
    remoteUrl: null,
    isConnected: false,
    stats: {
      totalCommits: 1,
      totalFiles: 2,
      totalLines: 22,
      contributors: ['Founder Mode'],
    },
  };
}

// Create a commit from an artifact
export function createCommitFromArtifact(
  repo: GitRepo,
  artifact: {
    title: string;
    content: string;
    filePath?: string;
    language?: string;
    type: string;
  },
  author: { name: string; avatar: string },
  taskTitle?: string,
  taskId?: string,
  artifactId?: string,
): GitCommit {
  // Determine file path
  let path = artifact.filePath;
  if (!path) {
    const safeName = artifact.title.replace(/[^a-zA-Z0-9]/g, '');
    if (artifact.type === 'design' || artifact.language === 'css') {
      path = `src/styles/${safeName}.css`;
    } else if (artifact.type === 'code') {
      path = `src/components/${safeName}.tsx`;
    } else {
      path = `src/${safeName}.txt`;
    }
  }
  
  // Remove leading slash if present
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  const existingContent = repo.files.get(path);
  const isNew = !existingContent;
  const additions = countLines(artifact.content);
  const deletions = existingContent ? countLines(existingContent) : 0;
  
  const file: GitFile = {
    path,
    content: artifact.content,
    language: artifact.language || detectLanguage(path),
    action: isNew ? 'added' : 'modified',
    additions,
    deletions: isNew ? 0 : deletions,
  };
  
  // Generate commit message
  const emoji = artifact.type === 'code' ? '✨' : artifact.type === 'design' ? '🎨' : '📝';
  const action = isNew ? 'Add' : 'Update';
  const message = taskTitle 
    ? `${emoji} ${action} ${artifact.title}\n\nTask: ${taskTitle}`
    : `${emoji} ${action} ${artifact.title}`;
  
  const commit: GitCommit = {
    id: uuidv4(),
    hash: generateHash(),
    message,
    author: author.name,
    authorAvatar: author.avatar,
    timestamp: Date.now(),
    files: [file],
    branch: repo.defaultBranch,
    taskId,
    artifactId,
  };
  
  return commit;
}

// Apply a commit to the repo
export function applyCommit(repo: GitRepo, commit: GitCommit): GitRepo {
  // Update files
  const newFiles = new Map(repo.files);
  commit.files.forEach(file => {
    if (file.action === 'deleted') {
      newFiles.delete(file.path);
    } else {
      newFiles.set(file.path, file.content);
    }
  });
  
  // Update branch
  const newBranches = repo.branches.map(branch => {
    if (branch.name === commit.branch) {
      return {
        ...branch,
        commits: branch.commits + 1,
        lastCommit: commit,
      };
    }
    return branch;
  });
  
  // Update stats
  let totalLines = 0;
  newFiles.forEach(content => {
    totalLines += countLines(content);
  });
  
  const contributors = new Set(repo.stats.contributors);
  contributors.add(commit.author);
  
  return {
    ...repo,
    commits: [...repo.commits, commit],
    files: newFiles,
    branches: newBranches,
    stats: {
      totalCommits: repo.stats.totalCommits + 1,
      totalFiles: newFiles.size,
      totalLines,
      contributors: Array.from(contributors),
    },
  };
}

// Create a branch (for missions)
export function createBranch(repo: GitRepo, name: string, missionId?: string): GitRepo {
  if (repo.branches.find(b => b.name === name)) {
    return repo; // Branch already exists
  }
  
  const mainBranch = repo.branches.find(b => b.isDefault);
  const newBranch: GitBranch = {
    name,
    isDefault: false,
    commits: mainBranch?.commits || 0,
    lastCommit: mainBranch?.lastCommit || null,
    missionId,
  };
  
  return {
    ...repo,
    branches: [...repo.branches, newBranch],
  };
}

// Generate GitHub push payload
export function generatePushPayload(repo: GitRepo): {
  files: Array<{ path: string; content: string }>;
  message: string;
} {
  const files: Array<{ path: string; content: string }> = [];
  repo.files.forEach((content, path) => {
    files.push({ path, content });
  });
  
  return {
    files,
    message: `🚀 Sync from Founder Mode (${repo.stats.totalCommits} commits)`,
  };
}

// Get recent commits
export function getRecentCommits(repo: GitRepo, limit = 10): GitCommit[] {
  return [...repo.commits]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// Get file tree
export function getFileTree(repo: GitRepo): Array<{ path: string; type: 'file' | 'folder' }> {
  const tree: Array<{ path: string; type: 'file' | 'folder' }> = [];
  const folders = new Set<string>();
  
  repo.files.forEach((_, path) => {
    // Add all parent folders
    const parts = path.split('/');
    let currentPath = '';
    parts.slice(0, -1).forEach(part => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!folders.has(currentPath)) {
        folders.add(currentPath);
        tree.push({ path: currentPath, type: 'folder' });
      }
    });
    
    // Add file
    tree.push({ path, type: 'file' });
  });
  
  return tree.sort((a, b) => {
    // Folders first, then alphabetical
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
}
