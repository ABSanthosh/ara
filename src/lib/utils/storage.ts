/**
 * Storage abstraction layer with hybrid approach:
 * - Critical settings (wallpaper, widgets) kept in localStorage for instant sync access
 * - All settings also synced to chrome.storage.local for persistence
 * - In development: uses localStorage only
 * - In production: uses both localStorage (instant reads) + chrome.storage.local (persistence)
 */

const isProd = import.meta.env.PROD;

// Keys that need instant synchronous access on page load
const INSTANT_ACCESS_KEYS = new Set(['settingStore']);

/**
 * Checks if a value is serializable to JSON
 */
function isSerializable(value: any): boolean {
  // Skip DOM elements
  if (value instanceof Element || value instanceof HTMLElement) {
    return false;
  }

  // Skip functions
  if (typeof value === "function") {
    return false;
  }

  // Allow null, primitives, objects, arrays
  return true;
}

/**
 * Custom JSON replacer that handles non-serializable types
 * - Skips DOM elements and functions
 * - Converts Sets to arrays with special marker
 */
function jsonReplacer(key: string, value: any): any {
  // Convert Date to ISO string with type marker
  if (value instanceof Date) {
    return {
      __type: "Date",
      __value: value.toISOString(),
    };
  }

  // Convert Set to array with type marker
  if (value instanceof Set) {
    return {
      __type: "Set",
      __value: Array.from(value),
    };
  }

  if (!isSerializable(value)) {
    return undefined;
  }

  return value;
}

/**
 * Custom JSON reviver that restores special types
 */
function jsonReviver(key: string, value: any): any {
  if (value && typeof value === "object") {
    // Restore Date from ISO string
    if (value.__type === "Date") {
      return new Date(value.__value);
    }

    // Restore Set from array
    if (value.__type === "Set") {
      return new Set(value.__value);
    }
  }

  return value;
}

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }
}

class ChromeStorageAdapter implements StorageAdapter {
  private listenerInitialized = false;

  constructor() {
    this.initSyncListener();
  }

  /**
   * Initialize listener to sync chrome.storage changes to localStorage
   * This listener catches changes from OTHER contexts (background scripts, other tabs, etc.)
   * Note: chrome.storage.onChanged doesn't fire for changes made in the same context
   */
  private initSyncListener() {
    if (this.listenerInitialized) return;
    this.listenerInitialized = true;
    
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('[Storage] chrome.storage API not available yet, sync listener not initialized');
      return;
    }
    
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;

      // Sync instant-access keys to localStorage from other contexts
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (INSTANT_ACCESS_KEYS.has(key)) {
          try {
            if (newValue !== undefined) {
              window.localStorage.setItem(key, newValue as string);
              console.debug(`🔄 [Storage] Synced ${key} from other context`);
            } else {
              window.localStorage.removeItem(key);
              console.debug(`🗑️ [Storage] Removed ${key} from other context`);
            }
          } catch (e) {
            console.warn(`❌ [Storage] Failed to sync ${key}:`, e);
          }
        }
      }
    });
  }

  async getItem(key: string): Promise<string | null> {
    // For instant-access keys, try localStorage first (synchronous)
    if (INSTANT_ACCESS_KEYS.has(key)) {
      try {
        const localValue = window.localStorage.getItem(key);
        if (localValue !== null) {
          return localValue;
        }
      } catch (e) {
        console.warn('[Storage] localStorage read failed:', e);
      }
    }

    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('[Storage] chrome.storage.local not available, falling back to localStorage');
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error('[Storage] All storage methods failed:', e);
        return null;
      }
    }

    // Fall back to chrome.storage.local
    try {
      const result = await chrome.storage.local.get(key);
      const value = (result[key] as string) ?? null;

      // If found in chrome.storage but not in localStorage, sync it
      if (value !== null && INSTANT_ACCESS_KEYS.has(key)) {
        try {
          window.localStorage.setItem(key, value);
          console.debug(`🔄 [Storage] Synced ${key} from chrome.storage`);
        } catch (e) {
          console.warn('[Storage] Failed to sync to localStorage:', e);
        }
      }

      return value;
    } catch (e) {
      console.error('[Storage] chrome.storage.local.get failed:', e);
      // Final fallback to localStorage
      try {
        return window.localStorage.getItem(key);
      } catch (localError) {
        console.error('[Storage] localStorage fallback failed:', localError);
        return null;
      }
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    // For instant-access keys, write to localStorage immediately (synchronous, fast)
    if (INSTANT_ACCESS_KEYS.has(key)) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn('[Storage] Failed to sync to localStorage:', e);
      }
    }
    
    // Write to chrome.storage.local for persistence if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.set({ [key]: value });
      } catch (e) {
        console.error('[Storage] chrome.storage.local.set failed:', e);
        // Fallback to localStorage
        if (!INSTANT_ACCESS_KEYS.has(key)) {
          try {
            window.localStorage.setItem(key, value);
          } catch (localError) {
            console.error('[Storage] localStorage fallback failed:', localError);
          }
        }
      }
    } else {
      // Chrome storage not available, use localStorage as fallback
      if (!INSTANT_ACCESS_KEYS.has(key)) {
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {
          console.error('[Storage] localStorage fallback failed:', e);
        }
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    // For instant-access keys, also remove from localStorage immediately
    if (INSTANT_ACCESS_KEYS.has(key)) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn('[Storage] Failed to remove from localStorage:', e);
      }
    }
    
    // Remove from chrome.storage.local if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.remove(key);
      } catch (e) {
        console.error('[Storage] chrome.storage.local.remove failed:', e);
        // Fallback to localStorage
        if (!INSTANT_ACCESS_KEYS.has(key)) {
          try {
            window.localStorage.removeItem(key);
          } catch (localError) {
            console.error('[Storage] localStorage fallback failed:', localError);
          }
        }
      }
    } else {
      // Chrome storage not available, use localStorage as fallback
      if (!INSTANT_ACCESS_KEYS.has(key)) {
        try {
          window.localStorage.removeItem(key);
        } catch (e) {
          console.error('[Storage] localStorage fallback failed:', e);
        }
      }
    }
  }
}

// Select the appropriate adapter based on environment
const storageAdapter: StorageAdapter = isProd
  ? new ChromeStorageAdapter()
  : new LocalStorageAdapter();

/**
 * Unified storage API that works in both development and production
 */
export const storage = {
  /**
   * Get an item from storage
   */
  async getItem(key: string): Promise<string | null> {
    return storageAdapter.getItem(key);
  },

  /**
   * Set an item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    return storageAdapter.setItem(key, value);
  },

  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    return storageAdapter.removeItem(key);
  },

  /**
   * Get a JSON object from storage
   * Uses custom reviver to restore Sets and other special types
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await storageAdapter.getItem(key);
    return value ? JSON.parse(value, jsonReviver) : null;
  },

  /**
   * Set a JSON object in storage
   * Uses custom replacer to handle Sets and skip non-serializable values
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    return storageAdapter.setItem(key, JSON.stringify(value, jsonReplacer));
  },
};
