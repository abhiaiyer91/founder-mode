/**
 * GitTimeline - Shows real-time git commit history
 * 
 * Displays commits as they happen, like a Lovable-style git feed.
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GitCommit } from '../types';
import './GitTimeline.css';

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function CommitItem({ commit, isLatest }: { commit: GitCommit; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
  const messageLines = commit.message.split('\n');
  const title = messageLines[0];
  const body = messageLines.slice(1).join('\n').trim();
  
  const totalAdditions = commit.files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = commit.files.reduce((sum, f) => sum + f.deletions, 0);
  
  return (
    <div className={`commit-item ${isLatest ? 'latest' : ''}`}>
      <div className="commit-dot">
        {isLatest && <span className="pulse" />}
      </div>
      
      <div className="commit-content">
        <div className="commit-header" onClick={() => setExpanded(!expanded)}>
          <span className="commit-hash">{commit.hash}</span>
          <span className="commit-title">{title}</span>
          <span className="commit-time">{formatTimeAgo(commit.timestamp)}</span>
        </div>
        
        <div className="commit-meta">
          <span className="commit-author">
            <span className="author-avatar">{commit.authorAvatar}</span>
            {commit.author}
          </span>
          <span className="commit-stats">
            {totalAdditions > 0 && <span className="additions">+{totalAdditions}</span>}
            {totalDeletions > 0 && <span className="deletions">-{totalDeletions}</span>}
          </span>
        </div>
        
        {expanded && (
          <div className="commit-details">
            {body && <p className="commit-body">{body}</p>}
            
            <div className="commit-files">
              {commit.files.map((file, i) => (
                <div key={i} className={`file-item ${file.action}`}>
                  <span className="file-action">
                    {file.action === 'added' ? '+' : file.action === 'deleted' ? '-' : '~'}
                  </span>
                  <span className="file-path">{file.path}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface GitTimelineProps {
  maxCommits?: number;
  compact?: boolean;
}

export function GitTimeline({ maxCommits = 10, compact = false }: GitTimelineProps) {
  const { gitRepo, gitHubConnection, pushToGitHub, project } = useGameStore();
  const [pushing, setPushing] = useState(false);
  
  if (!gitRepo) {
    return (
      <div className="git-timeline empty">
        <div className="empty-state">
          <span className="empty-icon">🐙</span>
          <p>Start a project to see git history</p>
        </div>
      </div>
    );
  }
  
  const commits = [...gitRepo.commits]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxCommits);
  
  const handlePush = async () => {
    setPushing(true);
    await pushToGitHub();
    setPushing(false);
  };
  
  if (compact) {
    return (
      <div className="git-timeline compact">
        <div className="timeline-header-compact">
          <span className="branch-name">
            <span className="branch-icon">🌿</span>
            {gitRepo.defaultBranch}
          </span>
          <span className="commit-count">{gitRepo.stats.totalCommits} commits</span>
        </div>
        
        <div className="commits-compact">
          {commits.slice(0, 3).map((commit) => (
            <div key={commit.id} className="commit-compact">
              <span className="commit-hash">{commit.hash}</span>
              <span className="commit-msg">{commit.message.split('\n')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="git-timeline">
      <div className="timeline-header">
        <div className="header-left">
          <h3>
            <span className="git-icon">🐙</span>
            Git History
          </h3>
          <span className="repo-name">{project?.name || 'Repository'}</span>
        </div>
        
        <div className="header-right">
          <div className="repo-stats">
            <span className="stat">
              <strong>{gitRepo.stats.totalCommits}</strong> commits
            </span>
            <span className="stat">
              <strong>{gitRepo.stats.totalFiles}</strong> files
            </span>
            <span className="stat">
              <strong>{gitRepo.stats.totalLines}</strong> lines
            </span>
          </div>
          
          {gitHubConnection.connected ? (
            <button 
              className="push-btn connected"
              onClick={handlePush}
              disabled={pushing}
            >
              {pushing ? '⏳ Pushing...' : '🚀 Push to GitHub'}
            </button>
          ) : (
            <button 
              className="push-btn"
              onClick={() => useGameStore.getState().setScreen('settings')}
            >
              🔗 Connect GitHub
            </button>
          )}
        </div>
      </div>
      
      {gitHubConnection.connected && (
        <div className="github-status">
          <span className="status-dot connected" />
          <span>Connected to</span>
          <a href={gitHubConnection.repoUrl || '#'} target="_blank" rel="noopener noreferrer">
            {gitHubConnection.username}/{gitHubConnection.repoName}
          </a>
          {gitHubConnection.lastPush && (
            <span className="last-push">
              Last pushed {formatTimeAgo(gitHubConnection.lastPush)}
            </span>
          )}
        </div>
      )}
      
      <div className="branch-info">
        <span className="branch-icon">🌿</span>
        <span className="branch-name">{gitRepo.defaultBranch}</span>
        {gitRepo.branches.length > 1 && (
          <span className="branch-count">+{gitRepo.branches.length - 1} branches</span>
        )}
      </div>
      
      <div className="commits-list">
        {commits.length === 0 ? (
          <div className="no-commits">
            <p>No commits yet. Assign tasks to your team!</p>
          </div>
        ) : (
          commits.map((commit, i) => (
            <CommitItem 
              key={commit.id} 
              commit={commit} 
              isLatest={i === 0}
            />
          ))
        )}
      </div>
      
      {gitRepo.stats.totalCommits > maxCommits && (
        <div className="show-more">
          <span>+ {gitRepo.stats.totalCommits - maxCommits} more commits</span>
        </div>
      )}
    </div>
  );
}

export default GitTimeline;
