/**
 * Tests for GitService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRepo,
  createCommitFromArtifact,
  applyCommit,
  createBranch,
  getRecentCommits,
  getFileTree,
  generatePushPayload,
} from './gitService';
import type { GitRepo, GitCommit } from './gitService';

describe('GitService', () => {
  describe('createRepo', () => {
    it('creates a new repository with correct defaults', () => {
      const repo = createRepo('my-project', 'A test project');
      
      expect(repo.name).toBe('my-project');
      expect(repo.description).toBe('A test project');
      expect(repo.defaultBranch).toBe('main');
      expect(repo.branches).toHaveLength(1);
      expect(repo.branches[0].name).toBe('main');
      expect(repo.branches[0].isDefault).toBe(true);
      expect(repo.commits).toHaveLength(1); // Initial commit
      expect(repo.files).toBeInstanceOf(Map);
      expect(repo.stats.totalCommits).toBe(1);
      expect(repo.stats.totalFiles).toBe(2); // README.md + package.json
      expect(repo.stats.totalLines).toBeGreaterThan(0);
    });

    it('creates initial README.md file', () => {
      const repo = createRepo('test-repo', 'Test description');
      
      expect(repo.files.has('README.md')).toBe(true);
      const readme = repo.files.get('README.md');
      expect(readme).toContain('# test-repo');
      expect(readme).toContain('Test description');
    });

    it('creates initial package.json file', () => {
      const repo = createRepo('test-repo', 'Test description');
      
      expect(repo.files.has('package.json')).toBe(true);
      const pkg = repo.files.get('package.json');
      expect(pkg).toContain('"name": "test-repo"');
    });

    it('creates initial commit with both files', () => {
      const repo = createRepo('test-repo', 'Test');
      
      expect(repo.commits).toHaveLength(1);
      const initialCommit = repo.commits[0];
      expect(initialCommit.message).toContain('Initial commit');
      expect(initialCommit.author).toBe('Founder Mode');
      expect(initialCommit.files).toHaveLength(2);
      expect(initialCommit.files.find(f => f.path === 'README.md')).toBeDefined();
      expect(initialCommit.files.find(f => f.path === 'package.json')).toBeDefined();
    });
  });

  describe('createCommitFromArtifact', () => {
    let repo: GitRepo;

    beforeEach(() => {
      repo = createRepo('test-repo', 'Test');
    });

    it('creates a commit from a code artifact', () => {
      const artifact = {
        title: 'Button Component',
        content: 'export function Button() { return <button>Click</button>; }',
        filePath: 'src/components/Button.tsx',
        language: 'typescript',
        type: 'code',
      };
      const author = { name: 'Alice Developer', avatar: '👩‍💻' };

      const commit = createCommitFromArtifact(repo, artifact, author, 'Create Button');

      expect(commit.message).toContain('Create Button');
      expect(commit.author).toBe('Alice Developer');
      expect(commit.authorAvatar).toBe('👩‍💻');
      expect(commit.files).toHaveLength(1);
      expect(commit.files[0].path).toBe('src/components/Button.tsx');
      expect(commit.files[0].action).toBe('added');
      expect(commit.files[0].additions).toBeGreaterThan(0);
    });

    it('uses artifact filePath if provided', () => {
      const artifact = {
        title: 'Test',
        content: 'test content',
        filePath: 'custom/path/file.ts',
        type: 'code',
      };
      const author = { name: 'Bob', avatar: '👨‍💻' };

      const commit = createCommitFromArtifact(repo, artifact, author, 'Custom path');

      expect(commit.files[0].path).toBe('custom/path/file.ts');
    });

    it('generates filePath from title if not provided', () => {
      const artifact = {
        title: 'UserService',
        content: 'class UserService {}',
        type: 'code',
        language: 'typescript',
      };
      const author = { name: 'Charlie', avatar: '🧑‍💻' };
      
      const commit = createCommitFromArtifact(repo, artifact, author, 'Add service');

      expect(commit.files[0].path).toContain('UserService');
    });

    it('calculates line counts correctly', () => {
      const artifact = {
        title: 'Multi',
        content: 'line1\nline2\nline3\nline4\nline5',
        filePath: 'src/test.ts',
        type: 'code',
      };
      const author = { name: 'Dev', avatar: '💻' };
      
      const commit = createCommitFromArtifact(repo, artifact, author, 'Multi-line');

      expect(commit.files[0].additions).toBe(5);
      expect(commit.files[0].deletions).toBe(0);
    });

    it('generates unique commit ID and hash', () => {
      const artifact = {
        title: 'Test',
        content: 'content',
        filePath: 'src/test.ts',
        type: 'code',
      };
      const author = { name: 'Dev', avatar: '💻' };

      const commit1 = createCommitFromArtifact(repo, artifact, author, 'Commit 1');
      const commit2 = createCommitFromArtifact(repo, artifact, author, 'Commit 2');

      expect(commit1.id).not.toBe(commit2.id);
      expect(commit1.hash).not.toBe(commit2.hash);
    });

    it('marks file as modified if it already exists', () => {
      // First add a file
      repo.files.set('src/existing.ts', 'old content');
      
      const artifact = {
        title: 'Existing',
        content: 'new content',
        filePath: 'src/existing.ts',
        type: 'code',
      };
      const author = { name: 'Dev', avatar: '💻' };

      const commit = createCommitFromArtifact(repo, artifact, author, 'Update file');

      expect(commit.files[0].action).toBe('modified');
      expect(commit.files[0].deletions).toBeGreaterThan(0);
    });
  });

  describe('applyCommit', () => {
    let repo: GitRepo;
    let commit: GitCommit;

    beforeEach(() => {
      repo = createRepo('test-repo', 'Test');
      commit = {
        id: 'commit-1',
        hash: 'abc1234',
        message: 'Add new file',
        author: 'Test',
        authorAvatar: '🧪',
        timestamp: Date.now(),
        branch: 'main',
        files: [
          {
            path: 'src/index.ts',
            action: 'added' as const,
            additions: 10,
            deletions: 0,
            content: 'console.log("hello");',
          },
        ],
      };
    });

    it('adds commit to repository', () => {
      const initialCount = repo.commits.length;
      const updatedRepo = applyCommit(repo, commit);

      expect(updatedRepo.commits.length).toBe(initialCount + 1);
      expect(updatedRepo.commits[updatedRepo.commits.length - 1].id).toBe(commit.id);
    });

    it('updates file in repository', () => {
      const content = 'console.log("hello");';
      commit.files[0].content = content;
      
      const updatedRepo = applyCommit(repo, commit);

      expect(updatedRepo.files.has('src/index.ts')).toBe(true);
      expect(updatedRepo.files.get('src/index.ts')).toBe(content);
    });

    it('updates commit count in stats', () => {
      const initialCommits = repo.stats.totalCommits;
      
      const updatedRepo = applyCommit(repo, commit);

      expect(updatedRepo.stats.totalCommits).toBe(initialCommits + 1);
    });

    it('updates file count in stats', () => {
      const initialFiles = repo.stats.totalFiles;
      
      const updatedRepo = applyCommit(repo, commit);

      expect(updatedRepo.stats.totalFiles).toBe(initialFiles + 1);
    });

    it('handles modified files', () => {
      // First add the file
      repo.files.set('src/existing.ts', 'old content\nline 2');

      commit.files = [
        {
          path: 'src/existing.ts',
          action: 'modified' as const,
          additions: 5,
          deletions: 2,
          content: 'new content\nnew line 2\nnew line 3',
        },
      ];

      const updatedRepo = applyCommit(repo, commit);

      expect(updatedRepo.files.get('src/existing.ts')).toBe('new content\nnew line 2\nnew line 3');
    });

    it('handles deleted files', () => {
      repo.files.set('src/to-delete.ts', 'will be deleted');
      const initialFiles = repo.files.size;

      commit.files = [
        {
          path: 'src/to-delete.ts',
          action: 'deleted' as const,
          additions: 0,
          deletions: 1,
        },
      ];

      const updatedRepo = applyCommit(repo, commit);

      expect(updatedRepo.files.has('src/to-delete.ts')).toBe(false);
      expect(updatedRepo.stats.totalFiles).toBe(initialFiles - 1);
    });
  });

  describe('createBranch', () => {
    let repo: GitRepo;

    beforeEach(() => {
      repo = createRepo('test-repo', 'Test');
    });

    it('creates a new branch', () => {
      const updatedRepo = createBranch(repo, 'feature/new-feature');

      expect(updatedRepo.branches).toHaveLength(2);
      expect(updatedRepo.branches.find(b => b.name === 'feature/new-feature')).toBeDefined();
    });

    it('returns same repo if branch already exists', () => {
      const updatedRepo = createBranch(repo, 'main');

      expect(updatedRepo.branches.filter(b => b.name === 'main')).toHaveLength(1);
    });

    it('new branch is not default', () => {
      const updatedRepo = createBranch(repo, 'feature/test');
      const newBranch = updatedRepo.branches.find(b => b.name === 'feature/test');

      expect(newBranch?.isDefault).toBe(false);
    });

    it('new branch can have mission ID', () => {
      const updatedRepo = createBranch(repo, 'feature/mission-1', 'mission-123');
      const newBranch = updatedRepo.branches.find(b => b.name === 'feature/mission-1');

      expect(newBranch?.missionId).toBe('mission-123');
    });
  });

  describe('getRecentCommits', () => {
    let repo: GitRepo;

    beforeEach(() => {
      repo = createRepo('test-repo', 'Test');
      // Add more commits
      for (let i = 0; i < 15; i++) {
        const commit: GitCommit = {
          id: `commit-${i}`,
          hash: `hash${i}`,
          message: `Commit ${i}`,
          author: 'Test',
          authorAvatar: '🧪',
          timestamp: Date.now() + i * 1000,
          branch: 'main',
          files: [],
        };
        repo.commits.push(commit);
      }
    });

    it('returns commits in reverse chronological order', () => {
      const commits = getRecentCommits(repo, 5);

      expect(commits).toHaveLength(5);
      // Most recent first
      for (let i = 0; i < commits.length - 1; i++) {
        expect(commits[i].timestamp).toBeGreaterThanOrEqual(commits[i + 1].timestamp);
      }
    });

    it('limits number of commits returned', () => {
      const commits = getRecentCommits(repo, 3);
      expect(commits).toHaveLength(3);
    });

    it('returns all commits if limit exceeds count', () => {
      const commits = getRecentCommits(repo, 100);
      expect(commits).toHaveLength(repo.commits.length);
    });
  });

  describe('getFileTree', () => {
    let repo: GitRepo;

    beforeEach(() => {
      repo = createRepo('test-repo', 'Test');
      repo.files.set('src/index.ts', 'content');
      repo.files.set('src/components/Button.tsx', 'content');
      repo.files.set('src/components/Input.tsx', 'content');
      repo.files.set('src/utils/helpers.ts', 'content');
      repo.files.set('package.json', 'content');
    });

    it('returns all file paths', () => {
      const tree = getFileTree(repo);
      const filePaths = tree.filter(t => t.type === 'file').map(t => t.path);

      expect(filePaths).toContain('README.md');
      expect(filePaths).toContain('src/index.ts');
      expect(filePaths).toContain('src/components/Button.tsx');
      expect(filePaths).toContain('src/components/Input.tsx');
      expect(filePaths).toContain('src/utils/helpers.ts');
      expect(filePaths).toContain('package.json');
    });

    it('includes folders in tree', () => {
      const tree = getFileTree(repo);
      const folderPaths = tree.filter(t => t.type === 'folder').map(t => t.path);

      expect(folderPaths).toContain('src');
      expect(folderPaths).toContain('src/components');
      expect(folderPaths).toContain('src/utils');
    });

    it('returns folders before files at same level', () => {
      const tree = getFileTree(repo);
      
      // Find the first folder and first file
      const firstFolder = tree.findIndex(t => t.type === 'folder');
      const firstFile = tree.findIndex(t => t.type === 'file');
      
      expect(firstFolder).toBeLessThan(firstFile);
    });
  });

  describe('generatePushPayload', () => {
    let repo: GitRepo;

    beforeEach(() => {
      repo = createRepo('test-repo', 'Test');
      repo.commits.push({
        id: 'commit-2',
        hash: 'abc1234',
        message: 'Second commit',
        author: 'Test',
        authorAvatar: '🧪',
        timestamp: Date.now(),
        branch: 'main',
        files: [{ path: 'src/new.ts', action: 'added' as const, additions: 5, deletions: 0 }],
      });
    });

    it('generates payload with files array', () => {
      const payload = generatePushPayload(repo);

      expect(payload.files).toBeDefined();
      expect(Array.isArray(payload.files)).toBe(true);
    });

    it('generates payload with message', () => {
      const payload = generatePushPayload(repo);

      expect(payload.message).toBeDefined();
      expect(payload.message).toContain('Founder Mode');
    });

    it('includes file contents in payload', () => {
      repo.files.set('src/test.ts', 'test content');
      const payload = generatePushPayload(repo);

      const testFile = payload.files.find(f => f.path === 'src/test.ts');
      expect(testFile).toBeDefined();
      expect(testFile?.content).toBe('test content');
    });

    it('includes all repository files', () => {
      repo.files.set('src/a.ts', 'a');
      repo.files.set('src/b.ts', 'b');
      
      const payload = generatePushPayload(repo);
      
      // Should have README + the 2 new files
      expect(payload.files.length).toBeGreaterThanOrEqual(3);
    });
  });
});
