/**
 * Storage abstraction layer that uses:
 * - localStorage in development (synchronous, easier debugging)
 * - chrome.storage.local in production (recommended for extensions)
 */

const isProd = import.meta.env.PROD;

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
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await storageAdapter.getItem(key);
    return value ? JSON.parse(value) : null;
  },

  /**
   * Set a JSON object in storage
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    return storageAdapter.setItem(key, JSON.stringify(value));
  },
};
