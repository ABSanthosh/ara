import { Magazine, type ImageItem, type MagazineConfig } from "../../utils/Magazine";

export interface CatImage extends ImageItem {
  subreddit: string;
  // Alias source to subreddit for backward compatibility
  source: string;
}

interface RedditListingResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

interface RedditPost {
  title: string;
  permalink: string;
  url?: string;
  url_overridden_by_dest?: string;
  subreddit: string;
  author: string;
  over_18: boolean;
  is_gallery?: boolean;
}

export class CatEngine {
  private readonly subreddits = [
    "Catswithjobs",
    "catpics",
    "catpictures",
    "catsinboxes",
    "CatsInBusinessAttire",
    "CatsInHats",
  ];

  private readonly magazine: Magazine<CatImage>;

  constructor() {
    const magazineConfig: MagazineConfig = {
      // No storageKey - the catStore will manage magazine data
      targetPreload: 5, // how many to keep in magazine
      initialFill: 5, // on cold start
      preloadLookahead: 3, // how many upcoming URLs to warm
    };

    this.magazine = new Magazine(magazineConfig, () => this.fetchOneSafe());
  }

  /**
   * Fetch a random cat image from Reddit
   */
  async fetchRandomCatImage(): Promise<CatImage> {
    const sub =
      this.subreddits[Math.floor(Math.random() * this.subreddits.length)];
    const resp = await fetch(
      `https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=25`,
      { headers: { "User-Agent": "random-image-demo/1.0" } }
    );

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data: RedditListingResponse = await resp.json();
    const posts: RedditPost[] = data.data.children.map((c) => c.data);

    // Basic image filters
    const images = posts.filter((p) => {
      const url = p.url_overridden_by_dest || p.url || "";
      const isImageHost =
        /^(https?:)?\/\/(i\.redd\.it|i\.imgur\.com|preview\.redd\.it)/i.test(
          url
        ) || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      const notGallery = !p.is_gallery;
      return !p.over_18 && isImageHost && notGallery;
    });

    if (!images.length) throw new Error("No image posts found.");

    const pick = images[Math.floor(Math.random() * images.length)];
    return {
      title: pick.title,
      postUrl: `https://reddit.com${pick.permalink}`,
      imageUrl: pick.url_overridden_by_dest || pick.url,
      subreddit: pick.subreddit,
      source: pick.subreddit, // Set source to subreddit for Magazine compatibility
      author: pick.author,
    };
  }

  /**
   * Safely fetch one valid image with retries
   */
  private async fetchOneSafe(retries = 3): Promise<CatImage> {
    let lastErr: unknown;
    for (let i = 0; i < retries; i++) {
      try {
        const img = await this.fetchRandomCatImage();
        if (img?.imageUrl) return img;
      } catch (e) {
        lastErr = e;
      }
    }
    throw (lastErr as Error) ?? new Error("Failed to fetch cat image");
  }

  /**
   * Get the next cat image from the magazine
   * Returns immediately from cache if available, otherwise fetches new images
   */
  async getNextCatFromMagazine(): Promise<CatImage> {
    return this.magazine.getNext();
  }

  /**
   * Clear the magazine cache
   */
  clearMagazine() {
    this.magazine.clear();
  }

  /**
   * Get magazine status (for debugging)
   */
  getMagazineStatus() {
    return this.magazine.getStatus();
  }

  /**
   * Set magazine data (for external storage management)
   */
  setMagazineData(data: CatImage[]) {
    this.magazine.setMagazineData(data);
  }

  /**
   * Get magazine data (for external storage management)
   */
  getMagazineData(): CatImage[] {
    return this.magazine.getMagazineData();
  }
}

// Export a singleton instance
export const catEngine = new CatEngine();
