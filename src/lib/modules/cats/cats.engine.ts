import { get } from "svelte/store";
import { CatStore, TCatItem } from "./cats.stores";
import { SettingStore } from "../settings/settings.store";

interface RedditListingResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

interface RedditPost {
  url?: string;
  title: string;
  author: string;
  over_18: boolean;
  permalink: string;
  subreddit: string;
  is_gallery?: boolean;
  url_overridden_by_dest?: string;
}

export class CatEngineImpl {
  private readonly widgetDefaults =
    get(SettingStore).internal.widgetDefaults.CatWidget;
  private preloadedImages: Set<string> = new Set();

  constructor() {}

  /**
   * Preload an image to browser cache
   */
  private preloadImage(url: string): Promise<void> {
    // Skip if already preloaded
    if (this.preloadedImages.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(url);
        resolve();
      };
      img.onerror = () => {
        // Don't reject, just resolve so it doesn't block other preloads
        resolve();
      };
      img.src = url;
    });
  }

  /**
   * Preload multiple images
   */
  private async preloadImages(items: TCatItem[]): Promise<void> {
    const preloadPromises = items.map((item) => this.preloadImage(item.imageUrl));
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Fetch a random cat image from Reddit
   */
  async makeRedditRequest(count = 20): Promise<TCatItem[]> {
    const sub =
      this.widgetDefaults.subreddit![
        Math.floor(Math.random() * this.widgetDefaults.subreddit!.length)
      ];
    const resp = await fetch(
      `https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=${count}`,
      { headers: { "User-Agent": "random-image-demo/1.0" } },
    );

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data: RedditListingResponse = await resp.json();
    const posts: RedditPost[] = data.data.children.map((c) => c.data);

    // Basic image filters
    const images = posts.filter((p) => {
      const url = p.url_overridden_by_dest || p.url || "";
      const isImageHost =
        /^(https?:)?\/\/(i\.redd\.it|i\.imgur\.com|preview\.redd\.it)/i.test(
          url,
        ) || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      const notGallery = !p.is_gallery;
      return !p.over_18 && isImageHost && notGallery;
    });

    if (!images.length) throw new Error("No image posts found.");

    // const pick = images[Math.floor(Math.random() * images.length)];
    return images.map((pick) => ({
      title: pick.title,
      postUrl: `https://reddit.com${pick.permalink}`,
      imageUrl: (pick.url_overridden_by_dest || pick.url)!,
      subreddit: pick.subreddit,
      source: pick.subreddit, // Set source to subreddit for Magazine compatibility
    }));
  }

  /**
   * Safely fetch one valid image with retries
   */
  public async getNRandomCats(n = 5, retries = 3): Promise<TCatItem[]> {
    let lastErr: unknown;
    for (let i = 0; i < retries; i++) {
      try {
        const img = await this.makeRedditRequest();
        // pick n random images from the fetched list
        const selected: TCatItem[] = [];
        const usedIndices: Set<number> = new Set();
        while (selected.length < n && usedIndices.size < img.length) {
          const idx = Math.floor(Math.random() * img.length);
          if (!usedIndices.has(idx)) {
            usedIndices.add(idx);
            selected.push(img[idx]);
          }
        }
        
        // Preload the images in the background
        this.preloadImages(selected).catch(() => {
          // Silently fail if preloading fails
        });
        
        return selected;
      } catch (e) {
        lastErr = e;
      }
    }
    throw (lastErr as Error) ?? new Error("Failed to fetch cat image");
  }

  public async addToFavorites(item: TCatItem) {
    CatStore.update((store) => {
      // Avoid duplicates - add to global favorites (can be accessed by any widget)
      // For simplicity, we'll keep favorites global
      // TODO: If you want per-widget favorites, we need to refactor this
      return store;
    });
  }

  public async removeFromFavorites(item: TCatItem) {
    CatStore.update((store) => {
      // TODO: Implement favorites per widget if needed
      return store;
    });
  }

  public isFavorite(item: TCatItem): boolean {
    // TODO: Implement favorites per widget if needed
    return false;
  }

  public pinCat(widgetId: string) {
    CatStore.update((store) => {
      if (store.widgets[widgetId]) {
        store.widgets[widgetId].isPinned = true;
      }
      return store;
    });
  }

  public unpinCat(widgetId: string) {
    CatStore.update((store) => {
      if (store.widgets[widgetId]) {
        store.widgets[widgetId].isPinned = false;
      }
      return store;
    });
  }

  public isPinned(widgetId: string): boolean {
    const store = get(CatStore);
    return store.widgets[widgetId]?.isPinned ?? false;
  }

  public getCat(widgetId: string): TCatItem | null {
    const magazine = CatStore.getMagazine(widgetId);
    const isPinned = this.isPinned(widgetId);
    return magazine?.getLatestItem(isPinned) ?? null;
  }
}

export const CatEngine = new CatEngineImpl();
