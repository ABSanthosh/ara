// ============================================================
// ImageEngine — Abstract base class for all image source engines
// ============================================================

/**
 * Shared response type for all image engines.
 * Engine-specific implementations extend this with their own fields.
 */
export interface ImageResponse {
  id: string;
  /** Which engine/source produced this result */
  source: string;
  title: string;
  artist: string | null;
  date: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  sourceUrl: string | null;
}

/**
 * Generic abstract base. The type parameter `T` lets each engine
 * declare exactly which ImageResponse shape it returns, preserving
 * engine-specific fields all the way up through the call site.
 *
 * @example
 * class NASAEngineImpl extends ImageEngine<NASAImageResponse> { ... }
 * const results: NASAImageResponse[] = await nasa.getRandom("", 5);
 */
export abstract class ImageEngine<T extends ImageResponse = ImageResponse> {
  protected readonly timeoutMs: number;

  constructor(timeoutMs = 8_000) {
    this.timeoutMs = timeoutMs;
  }

  // ── Abstract — every engine must implement ─────────────────

  /**
   * Search for images matching a tag or keyword.
   * @param tag   Keyword to search for (e.g. "landscape", "portrait")
   * @param limit Max number of results to return
   * @param options Optional engine-specific options
   */
  abstract search(tag: string, limit: number, options?: unknown): Promise<T[]>;

  // ── Concrete defaults — engines may override ───────────────

  /**
   * Returns randomly shuffled results for a given tag.
   * Default: delegates to `search()` then shuffles.
   * Override when the API has a native random/count endpoint.
   */
  async getRandom(tag: string, limit = 10, options?: unknown): Promise<T[]> {
    const results = await this.search(tag, limit, options);
    return this.shuffle(results.filter((r) => r.imageUrl !== null));
  }

  /**
   * Persist an API key for this engine.
   * No-op by default — override in engines that need key storage.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveAPIKey(_key: string): void {
    // optional — override to persist
  }

  // ── Shared utilities available to all subclasses ───────────

  protected async fetchWithTimeout(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  protected shuffle<U>(arr: U[]): U[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
