/**
 * Secure Storage for API Keys
 * 
 * Stores API keys separately from game state with basic obfuscation.
 * Note: For true security, users should use environment variables on server.
 */

const STORAGE_KEY = 'founder_mode_credentials';

interface StoredCredentials {
  openaiKey?: string;
  githubToken?: string;
  updatedAt: number;
}

// Basic obfuscation (not true encryption, but prevents casual inspection)
function obfuscate(value: string): string {
  return btoa(value.split('').reverse().join(''));
}

function deobfuscate(value: string): string {
  try {
    return atob(value).split('').reverse().join('');
  } catch {
    return '';
  }
}

export function saveApiKey(key: 'openai' | 'github', value: string): void {
  try {
    const stored = getStoredCredentials();
    
    if (key === 'openai') {
      stored.openaiKey = obfuscate(value);
    } else if (key === 'github') {
      stored.githubToken = obfuscate(value);
    }
    
    stored.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('Failed to save API key:', e);
  }
}

export function getApiKey(key: 'openai' | 'github'): string | null {
  try {
    const stored = getStoredCredentials();
    
    if (key === 'openai' && stored.openaiKey) {
      return deobfuscate(stored.openaiKey);
    } else if (key === 'github' && stored.githubToken) {
      return deobfuscate(stored.githubToken);
    }
    
    return null;
  } catch {
    return null;
  }
}

export function removeApiKey(key: 'openai' | 'github'): void {
  try {
    const stored = getStoredCredentials();
    
    if (key === 'openai') {
      delete stored.openaiKey;
    } else if (key === 'github') {
      delete stored.githubToken;
    }
    
    stored.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('Failed to remove API key:', e);
  }
}

export function clearAllCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear credentials:', e);
  }
}

function getStoredCredentials(): StoredCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse errors
  }
  return { updatedAt: 0 };
}

export function hasStoredKey(key: 'openai' | 'github'): boolean {
  return getApiKey(key) !== null;
}
