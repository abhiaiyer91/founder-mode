/**
 * Secure Storage for API Keys
 * 
 * Stores API keys separately from game state with basic obfuscation.
 * Note: For true security, users should use environment variables on server.
 */

const STORAGE_KEY = 'founder_mode_credentials';

// Supported AI providers
export type AIProviderKey = 'openai' | 'anthropic' | 'google' | 'groq';
export type CredentialKey = AIProviderKey | 'github';

interface StoredCredentials {
  // Legacy keys (kept for backwards compat)
  openaiKey?: string;
  githubToken?: string;
  // Provider keys by name
  providerKeys?: Record<string, string>;
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

export function saveApiKey(key: CredentialKey, value: string): void {
  try {
    const stored = getStoredCredentials();
    
    // Store in provider keys
    if (!stored.providerKeys) {
      stored.providerKeys = {};
    }
    stored.providerKeys[key] = obfuscate(value);
    
    // Also store in legacy keys for backwards compat
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

export function getApiKey(key: CredentialKey): string | null {
  try {
    const stored = getStoredCredentials();
    
    // First try new provider keys
    if (stored.providerKeys && stored.providerKeys[key]) {
      return deobfuscate(stored.providerKeys[key]);
    }
    
    // Fall back to legacy keys
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

export function removeApiKey(key: CredentialKey): void {
  try {
    const stored = getStoredCredentials();
    
    // Remove from provider keys
    if (stored.providerKeys) {
      delete stored.providerKeys[key];
    }
    
    // Also remove legacy keys
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

export function hasStoredKey(key: CredentialKey): boolean {
  return getApiKey(key) !== null;
}

/** Get all configured provider keys */
export function getConfiguredProviders(): AIProviderKey[] {
  const providers: AIProviderKey[] = ['openai', 'anthropic', 'google', 'groq'];
  return providers.filter(p => hasStoredKey(p));
}
