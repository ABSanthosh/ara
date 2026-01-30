/**
 * Storage abstraction layer that uses:
 * - localStorage in development (synchronous, easier debugging)
 * - chrome.storage.local in production (recommended for extensions)
 */

const isProd = import.meta.env.PROD;

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
  // Convert Set to array with type marker
  if (value instanceof Set) {
    return {
      __type: "Set",
      __value: Array.from(value),
    };
  }

  // Skip non-serializable values
  if (!isSerializable(value)) {
    return undefined;
  }

  return value;
}

/**
 * Custom JSON reviver that restores special types
 * - Restores Sets from marked arrays
 */
function jsonReviver(key: string, value: any): any {
  // Restore Set from marked array
  if (value && typeof value === "object" && value.__type === "Set") {
    return new Set(value.__value);
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
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
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
