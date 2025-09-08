import { writable, derived } from "svelte/store";
import { catEngine, type CatImage } from "../utils/CatEngine";
import { Magazine, type MagazineConfig } from "../utils/Magazine";

interface CatImageCache {
  [widgetId: string]: {
    image: CatImage;
    timestamp: number;
    isLoading: boolean;
    error?: string;
  };
}

interface CatStore {
  cache: CatImageCache;
  globalLoading: boolean;
  lastFetchTime: number;
  magazine: {
    count: number;
    lastUpdate: number;
    data: CatImage[]; // Store magazine data directly in the store
  };
}

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

const defaultCatStore: CatStore = {
  cache: {},
  globalLoading: false,
  lastFetchTime: 0,
  magazine: {
    count: 0,
    lastUpdate: 0,
    data: [],
  },
};

const STORAGE_KEY = "catStoreV1";
const OLD_MAGAZINE_KEY = "catImageMagazineV1";

// Migrate old magazine data if it exists
function migrateOldMagazineData(): CatImage[] {
  try {
    const oldMagazineData = localStorage.getItem(OLD_MAGAZINE_KEY);
    if (oldMagazineData) {
      const parsed = JSON.parse(oldMagazineData);
      if (Array.isArray(parsed)) {
        // Clean up old key
        localStorage.removeItem(OLD_MAGAZINE_KEY);
        console.info("Migrated cat magazine data from old storage key");
        return parsed.filter(
          (x) =>
            x &&
            typeof x.title === "string" &&
            typeof x.author === "string" &&
            typeof x.postUrl === "string" &&
            typeof x.subreddit === "string" &&
            (typeof x.imageUrl === "string" || typeof x.imageUrl === "undefined")
        ).map(item => ({
          ...item,
          source: item.subreddit || item.source || "reddit", // Add source field if missing
        }));
      }
    }
  } catch (error) {
    console.warn("Failed to migrate old magazine data:", error);
  }
  return [];
}

// Load initial state from localStorage
function loadFromStorage(): CatStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // If no store data exists, try to migrate old magazine data
      const migratedMagazineData = migrateOldMagazineData();
      return {
        ...defaultCatStore,
        magazine: {
          count: migratedMagazineData.length,
          lastUpdate: Date.now(),
          data: migratedMagazineData,
        },
      };
    }
    
    const parsed = JSON.parse(stored);
    // Validate the structure
    if (typeof parsed === 'object' && parsed.cache && typeof parsed.cache === 'object') {
      // Check if we need to migrate magazine data
      let magazineData = Array.isArray(parsed.magazine?.data) ? parsed.magazine.data : [];
      
      // If no magazine data in store but old magazine key exists, migrate it
      if (magazineData.length === 0) {
        const migratedMagazineData = migrateOldMagazineData();
        magazineData = migratedMagazineData;
      }
      
      return {
        cache: parsed.cache || {},
        globalLoading: false, // Never persist loading state
        lastFetchTime: parsed.lastFetchTime || 0,
        magazine: {
          count: parsed.magazine?.count || magazineData.length,
          lastUpdate: parsed.magazine?.lastUpdate || 0,
          data: magazineData,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to load cat store from localStorage:", error);
  }
  
  // Fallback: try to migrate old data
  const migratedMagazineData = migrateOldMagazineData();
  return {
    ...defaultCatStore,
    magazine: {
      count: migratedMagazineData.length,
      lastUpdate: Date.now(),
      data: migratedMagazineData,
    },
  };
}

const catStore = writable<CatStore>(loadFromStorage());

// Initialize the magazine with stored data
catStore.subscribe((value) => {
  // Sync magazine data with catEngine
  catEngine.setMagazineData(value.magazine.data);
});

let saveTimer: NodeJS.Timeout | null = null;

// Auto-save to localStorage with debouncing
catStore.subscribe((value) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const toSave = {
        cache: value.cache,
        lastFetchTime: value.lastFetchTime,
        magazine: value.magazine,
        // Don't save globalLoading as it should always start as false
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.warn("Failed to save cat store to localStorage:", error);
    }
  }, 500);
});

// Derived store for individual widget states
export const catImageStates = derived(catStore, ($catStore) => $catStore.cache);

// Derived store for global loading state
export const globalCatLoading = derived(catStore, ($catStore) => $catStore.globalLoading);

// Derived store for magazine status
export const catMagazineStatus = derived(catStore, ($catStore) => $catStore.magazine);

// Helper function to check if cached image is expired
function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_EXPIRATION;
}

// Actions
export const catStoreActions = {
  /**
   * Get or fetch a cat image for a specific widget
   */
  async getCatImage(widgetId: string, forceRefresh = false): Promise<CatImage> {
    return new Promise((resolve, reject) => {
      catStore.update(store => {
        const cached = store.cache[widgetId];
        
        // Return cached image if it exists and is not expired (unless forced refresh)
        if (!forceRefresh && cached && !isCacheExpired(cached.timestamp) && cached.image.imageUrl) {
          resolve(cached.image);
          return store;
        }

        // Set loading state
        store.cache[widgetId] = {
          ...cached,
          isLoading: true,
          error: undefined,
        };

        store.globalLoading = Object.values(store.cache).some(item => item.isLoading);
        
        return store;
      });

      // Fetch new image
      catEngine.getNextCatFromMagazine()
        .then((image) => {
          catStore.update(store => {
            store.cache[widgetId] = {
              image,
              timestamp: Date.now(),
              isLoading: false,
              error: undefined,
            };
            store.lastFetchTime = Date.now();
            
            // Update magazine status
            const magazineStatus = catEngine.getMagazineStatus();
            const magazineData = catEngine.getMagazineData();
            store.magazine = {
              count: magazineStatus.count,
              lastUpdate: Date.now(),
              data: magazineData,
            };
            
            store.globalLoading = Object.values(store.cache).some(item => item.isLoading);
            return store;
          });
          resolve(image);
        })
        .catch((error) => {
          catStore.update(store => {
            store.cache[widgetId] = {
              ...store.cache[widgetId],
              isLoading: false,
              error: error.message || "Failed to fetch cat image",
            };
            store.globalLoading = Object.values(store.cache).some(item => item.isLoading);
            return store;
          });
          reject(error);
        });
    });
  },

  /**
   * Refresh a specific widget's cat image
   */
  async refreshCatImage(widgetId: string): Promise<CatImage> {
    return this.getCatImage(widgetId, true);
  },

  /**
   * Remove a widget from the cache (when widget is deleted)
   */
  removeCatImage(widgetId: string) {
    catStore.update(store => {
      delete store.cache[widgetId];
      store.globalLoading = Object.values(store.cache).some(item => item.isLoading);
      return store;
    });
  },

  /**
   * Clear all cached images
   */
  clearAllCachedImages() {
    catStore.update(store => {
      store.cache = {};
      store.globalLoading = false;
      store.magazine = {
        count: 0,
        lastUpdate: Date.now(),
        data: [],
      };
      return store;
    });
    // Also clear the magazine cache
    catEngine.clearMagazine();
  },

  /**
   * Get the current cache status for a widget
   */
  getCacheStatus(widgetId: string) {
    let status: { exists: boolean; expired: boolean; isLoading: boolean; error?: string } = {
      exists: false,
      expired: false,
      isLoading: false,
    };

    catStore.subscribe(store => {
      const cached = store.cache[widgetId];
      if (cached) {
        status = {
          exists: true,
          expired: isCacheExpired(cached.timestamp),
          isLoading: cached.isLoading,
          error: cached.error,
        };
      }
    })(); // Immediately unsubscribe after reading

    return status;
  },

  /**
   * Preload images for better performance
   */
  async preloadImages(count = 3) {
    catStore.update(store => {
      store.globalLoading = true;
      return store;
    });

    try {
      const promises = Array.from({ length: count }, () => catEngine.getNextCatFromMagazine());
      await Promise.all(promises);
      
      // Update magazine status after preloading
      catStore.update(store => {
        const magazineStatus = catEngine.getMagazineStatus();
        const magazineData = catEngine.getMagazineData();
        store.magazine = {
          count: magazineStatus.count,
          lastUpdate: Date.now(),
          data: magazineData,
        };
        return store;
      });
    } catch (error) {
      console.warn("Failed to preload cat images:", error);
    } finally {
      catStore.update(store => {
        store.globalLoading = false;
        return store;
      });
    }
  },

  /**
   * Clear only the magazine cache (not widget caches)
   */
  clearMagazine() {
    catEngine.clearMagazine();
    catStore.update(store => {
      store.magazine = {
        count: 0,
        lastUpdate: Date.now(),
        data: [],
      };
      return store;
    });
  },

  /**
   * Get comprehensive magazine status including both engine status and store status
   */
  getMagazineStatus() {
    const engineStatus = catEngine.getMagazineStatus();
    
    // Also get current store magazine status
    let storeStatus = { count: 0, lastUpdate: 0 };
    catStore.subscribe(store => {
      storeStatus = store.magazine;
    })(); // Immediately unsubscribe after reading

    return {
      engine: engineStatus,
      store: storeStatus,
      combined: {
        ...engineStatus,
        storeLastUpdate: storeStatus.lastUpdate,
      }
    };
  },

  /**
   * Force refresh magazine status from engine
   */
  refreshMagazineStatus() {
    catStore.update(store => {
      const magazineStatus = catEngine.getMagazineStatus();
      const magazineData = catEngine.getMagazineData();
      store.magazine = {
        count: magazineStatus.count,
        lastUpdate: Date.now(),
        data: magazineData,
      };
      return store;
    });
  },
};

export default catStore;
