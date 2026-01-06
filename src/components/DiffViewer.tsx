/**
 * Code Diff Viewer Component
 * 
 * Shows side-by-side or unified code diffs from mission commits.
 * Uses @git-diff-view/react for beautiful GitHub-style diffs.
 */

import { useState, useMemo } from 'react';
import { DiffView, DiffModeEnum } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';
import './DiffViewer.css';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  fileName: string;
  language?: string;
  oldTitle?: string;
  newTitle?: string;
}

export function DiffViewer({ 
  oldCode, 
  newCode, 
  fileName,
  language = 'typescript',
  oldTitle = 'Before',
  newTitle = 'After'
}: DiffViewerProps) {
  const [mode, setMode] = useState<DiffModeEnum>(DiffModeEnum.Split);
  const [wrap, setWrap] = useState(true);

  // Calculate additions and deletions for stats
  const stats = useMemo(() => {
    const oldLines = oldCode.split('\n').length;
    const newLines = newCode.split('\n').length;
    return {
      additions: Math.max(0, newLines - oldLines),
      deletions: Math.max(0, oldLines - newLines),
    };
  }, [oldCode, newCode]);

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <div className="diff-file-name">
          <span className="file-icon">📄</span>
          <span className="file-path">{fileName}</span>
          <span className="file-lang">{language}</span>
        </div>
        
        <div className="diff-controls">
          <button 
            className={`diff-mode-btn ${mode === DiffModeEnum.Split ? 'active' : ''}`}
            onClick={() => setMode(DiffModeEnum.Split)}
            title="Side by side"
          >
            ⬛⬛
          </button>
          <button 
            className={`diff-mode-btn ${mode === DiffModeEnum.Unified ? 'active' : ''}`}
            onClick={() => setMode(DiffModeEnum.Unified)}
            title="Unified"
          >
            ⬛
          </button>
          <button 
            className={`diff-wrap-btn ${wrap ? 'active' : ''}`}
            onClick={() => setWrap(!wrap)}
            title="Wrap lines"
          >
            ↩️
          </button>
        </div>
      </div>

      <div className="diff-titles">
        <div className="diff-title old">{oldTitle}</div>
        {mode === DiffModeEnum.Split && (
          <div className="diff-title new">{newTitle}</div>
        )}
      </div>

      <div className="diff-content">
        <DiffView
          diffViewMode={mode}
          diffViewWrap={wrap}
          diffViewFontSize={13}
          diffViewHighlight
          data={{
            oldFile: {
              fileName: `a/${fileName}`,
              content: oldCode,
            },
            newFile: {
              fileName: `b/${fileName}`,
              content: newCode,
            },
            hunks: [],
          }}
        />
      </div>

      <div className="diff-stats">
        <span className="additions">+{stats.additions}</span>
        <span className="deletions">-{stats.deletions}</span>
      </div>
    </div>
  );
}

// Simplified diff viewer for quick previews
interface SimpleDiffProps {
  additions: string[];
  deletions: string[];
  fileName: string;
}

export function SimpleDiff({ additions, deletions, fileName }: SimpleDiffProps) {
  return (
    <div className="simple-diff">
      <div className="simple-diff-header">
        <span className="file-icon">📄</span>
        <span className="file-name">{fileName}</span>
        <div className="stats">
          <span className="additions">+{additions.length}</span>
          <span className="deletions">-{deletions.length}</span>
        </div>
      </div>
      <div className="simple-diff-content">
        {deletions.map((line, i) => (
          <div key={`del-${i}`} className="diff-line deletion">
            <span className="line-prefix">-</span>
            <span className="line-content">{line}</span>
          </div>
        ))}
        {additions.map((line, i) => (
          <div key={`add-${i}`} className="diff-line addition">
            <span className="line-prefix">+</span>
            <span className="line-content">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mission commit diff viewer
interface MissionCommitDiffProps {
  commit: {
    id: string;
    message: string;
    timestamp: number;
    files: Array<{
      path: string;
      oldContent: string;
      newContent: string;
    }>;
  };
}

export function MissionCommitDiff({ commit }: MissionCommitDiffProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  return (
    <div className="mission-commit-diff">
      <div className="commit-header">
        <div className="commit-info">
          <span className="commit-hash">{commit.id.slice(0, 7)}</span>
          <span className="commit-message">{commit.message}</span>
        </div>
        <div className="commit-meta">
          <span className="commit-time">
            {new Date(commit.timestamp).toLocaleString()}
          </span>
          <span className="commit-files">{commit.files.length} files</span>
        </div>
      </div>

      <div className="commit-files-list">
        {commit.files.map((file) => (
          <div key={file.path} className="commit-file">
            <button 
              className="file-toggle"
              onClick={() => setExpandedFile(expandedFile === file.path ? null : file.path)}
            >
              <span className="toggle-icon">{expandedFile === file.path ? '▼' : '▶'}</span>
              <span className="file-path">{file.path}</span>
            </button>
            
            {expandedFile === file.path && (
              <DiffViewer
                oldCode={file.oldContent}
                newCode={file.newContent}
                fileName={file.path}
                oldTitle="Before"
                newTitle="After"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiffViewer;
