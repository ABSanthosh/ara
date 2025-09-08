/**
 * Generic Magazine class for managing image caching and preloading
 * Can be used for any type of image content (cats, wallpapers, etc.)
 */

export interface ImageItem {
  title: string;
  author: string;
  postUrl: string;
  imageUrl: string | undefined;
  source: string; // e.g., subreddit name, API source, etc.
}

export type ImageFetcher<T extends ImageItem> = () => Promise<T>;

export interface MagazineConfig {
  storageKey?: string; // Optional - if not provided, no internal storage
  targetPreload: number;
  initialFill: number;
  preloadLookahead: number;
}

export class Magazine<T extends ImageItem> {
  private readonly config: MagazineConfig;
  private readonly fetcher: ImageFetcher<T>;
  
  // Track which URLs we already asked the browser to preload, to avoid churn
  private readonly preloaded = new Map<string, HTMLImageElement>();
  
  // External magazine data (when storage is managed externally)
  private externalMagazine: T[] = [];

  constructor(config: MagazineConfig, fetcher: ImageFetcher<T>) {
    this.config = config;
    this.fetcher = fetcher;
  }

  /**
   * Read magazine from storage (internal localStorage or external)
   */
  private readMagazine(): T[] {
    if (!this.config.storageKey) {
      return this.externalMagazine;
    }
    
    try {
      const raw = localStorage.getItem(this.config.storageKey);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      // Basic validation
      return arr.filter(
        (x) =>
          x &&
          typeof x.title === "string" &&
          typeof x.author === "string" &&
          typeof x.postUrl === "string" &&
          typeof x.source === "string" &&
          (typeof x.imageUrl === "string" || typeof x.imageUrl === "undefined")
      );
    } catch {
      return [];
    }
  }

  /**
   * Write magazine to storage (internal localStorage or external)
   */
  private writeMagazine(arr: T[]) {
    if (!this.config.storageKey) {
      this.externalMagazine = [...arr];
      return;
    }
    
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(arr));
    } catch {
      // ignore quota or serialization errors
    }
  }

  /**
   * Fill magazine with N images
   */
  private async fillMagazine(n: number): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < n; i++) {
      try {
        const img = await this.fetcher();
        results.push(img);
      } catch (error) {
        console.warn(`Failed to fetch image ${i + 1}/${n}:`, error);
        // Continue with other images even if one fails
      }
    }
    return results;
  }

  /**
   * Top up the magazine asynchronously to maintain preload count
   */
  private async topUpAsync() {
    try {
      // After popping one, we want at least targetPreload items ready.
      let mag = this.readMagazine();
      const need = Math.max(0, this.config.targetPreload - mag.length);
      for (let i = 0; i < need; i++) {
        try {
          const img = await this.fetcher();
          mag = this.readMagazine(); // re-read in case other tabs updated it
          mag.push(img);
          this.writeMagazine(mag);
        } catch (error) {
          console.warn(`Failed to fetch image during top-up:`, error);
          break; // Stop trying if fetcher is failing
        }
      }
      // After topping up, warm the cache for upcoming images
      this.preloadUpcoming();
    } catch {
      // Swallow errors; UX still shows the immediately returned image
    }
  }

  /**
   * Preload next few images by creating Image objects to warm HTTP cache.
   * This is a best-effort, zero-maintenance preloader.
   */
  private preloadUpcoming() {
    const mag = this.readMagazine();
    const nextUrls = mag
      .slice(0, this.config.preloadLookahead)
      .map((m) => m.imageUrl)
      .filter((u): u is string => !!u);

    // Remove references for URLs that are no longer in our lookahead
    for (const [url, img] of this.preloaded) {
      if (!nextUrls.includes(url)) {
        // Drop our reference; the browser cache retains the resource
        img.onload = null;
        img.onerror = null;
        this.preloaded.delete(url);
      }
    }

    // Add new preloaders for unseen URLs
    for (const url of nextUrls) {
      if (this.preloaded.has(url)) continue;
      try {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        // Optional: avoid referrer leakage; adjust if you need referers.
        img.referrerPolicy = "no-referrer";
        img.src = url;
        // No need to attach to DOM; request starts immediately.
        this.preloaded.set(url, img);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Get the next image from the magazine
   * Returns immediately from cache if available, otherwise fetches new images
   */
  async getNext(): Promise<T> {
    let mag = this.readMagazine();

    if (mag.length === 0) {
      // Cold start: fetch initial fill, store, return first
      const filled = await this.fillMagazine(this.config.initialFill);
      if (filled.length === 0) {
        throw new Error("Failed to fetch any images during initial fill");
      }
      this.writeMagazine(filled);
      const [first, ...rest] = filled;
      this.writeMagazine(rest);
      // Top up and start preloading upcoming images
      void this.topUpAsync(); // fire-and-forget
      // Warm cache for what's currently in rest
      this.preloadUpcoming();
      return first;
    }

    // Pop first and return immediately
    const next = mag.shift()!;
    this.writeMagazine(mag);

    // Preload now for remaining magazine, then top up in background
    this.preloadUpcoming();
    void this.topUpAsync();

    return next;
  }

  /**
   * Clear the magazine cache
   */
  clear() {
    if (this.config.storageKey) {
      try {
        localStorage.removeItem(this.config.storageKey);
      } catch {
        // ignore errors
      }
    } else {
      this.externalMagazine = [];
    }
    
    // Drop preloader references
    for (const [, img] of this.preloaded) {
      img.onload = null;
      img.onerror = null;
    }
    this.preloaded.clear();
  }

  /**
   * Set magazine data (for external storage management)
   */
  setMagazineData(data: T[]) {
    if (!this.config.storageKey) {
      this.externalMagazine = [...data];
    } else {
      console.warn("Cannot set external magazine data when storageKey is configured");
    }
  }

  /**
   * Get current magazine data (for external storage management)
   */
  getMagazineData(): T[] {
    return this.readMagazine();
  }

  /**
   * Get magazine status (for debugging)
   */
  getStatus() {
    const mag = this.readMagazine();
    return {
      count: mag.length,
      targetPreload: this.config.targetPreload,
      needsRefill: mag.length < this.config.targetPreload,
      lookahead: this.config.preloadLookahead,
      preloadedCount: this.preloaded.size,
      config: this.config,
    };
  }

  /**
   * Get current magazine contents (for debugging)
   */
  getCurrentMagazine(): T[] {
    return this.readMagazine();
  }
}
