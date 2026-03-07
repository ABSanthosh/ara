// ============================================================
// NASAEngineImpl — extends ImageEngine<NASAImageResponse>
// ============================================================
import { SettingStore } from "../../../settings/settings.store";
import { ImageEngine, ImageResponse } from "../../image.engine";
import { APODOptions, APODResponse } from "./nasa.types";

/**
 * NASA's ImageResponse extension.
 * Preserves all APODResponse fields while conforming to the shared base.
 *
 * ImageResponse fields map as:
 *   imageUrl      → hdurl ?? url
 *   thumbnailUrl  → thumbnail_url ?? url
 *   artist        → copyright
 *   date          → date
 *   tags          → ["space", "astronomy", "apod"]
 */
export interface NASAImageResponse extends ImageResponse {
  source: "nasa";
  // NASA-specific fields from APODResponse
  explanation: string;
  mediaType: "image" | "video";
  copyright: string | null; // maps to artist, also kept here for clarity
  hdurl: string | null;
  thumbnailUrl: string | null;
  serviceVersion: string;
  // The raw APODResponse, intact, if you need any field not mapped above
  raw: APODResponse;
}

// ── Implementation ───────────────────────────────────────────

export class NASAEngineImpl extends ImageEngine<NASAImageResponse> {
  private readonly APOD_BASE_URL = "https://api.nasa.gov/planetary/apod";
  private RETRY_LIMIT = 3;
  private _apiKey: string;

  constructor(apiKey: string, timeoutMs?: number) {
    super(timeoutMs);
    this._apiKey = apiKey;
  }

  set apiKey(key: string) {
    this._apiKey = key;
  }
  set retryLimit(limit: number) {
    this.RETRY_LIMIT = limit;
  }
  get apiKey(): string {
    return this._apiKey;
  }

  // ── ImageEngine interface ────────────────────────────────────

  /**
   * `search()` treats `tag` as a YYYY-MM-DD date if it matches that format,
   * otherwise fetches a batch of `limit` random APODs via count=.
   * NASA APOD doesn't have keyword/tag search natively.
   * @param options APODOptions to pass to the NASA API (overrides tag/limit behavior)
   */
  async search(
    tag: string,
    limit: number,
    options?: APODOptions
  ): Promise<NASAImageResponse[]> {
    // If options provided, use them directly
    if (options) {
      const response = await this.getAPOD(options);
      return this.toImageResponse(response);
    }
    
    // Otherwise, use tag/limit logic
    const isDate = /^\d{4}-\d{2}-\d{2}$/.test(tag);
    const apodOptions: APODOptions = isDate
      ? { date: tag }
      : { count: limit, thumbs: true };
    const response = await this.getAPOD(apodOptions);
    return this.toImageResponse(response);
  }

  /**
   * Overrides the default shuffle-after-search approach.
   * Uses getRandomAPOD() to pick a single random date from the full APOD archive,
   * or count= for multiple. Tag is not applicable for NASA APOD.
   * @param options APODOptions to pass to the NASA API
   */
  override async getRandom(
    _tag = "",
    limit = 1,
    options?: APODOptions
  ): Promise<NASAImageResponse[]> {
    // If options provided, use them directly
    if (options) {
      const response = await this.getAPOD(options);
      return this.shuffle(
        this.toImageResponse(response).filter((r) => r.imageUrl !== null),
      );
    }

    // Otherwise, use limit logic
    const apodOptions: APODOptions =
      limit === 1
        ? { date: this.randomDateString() } // single → random date approach
        : { count: limit, thumbs: true }; // multiple → native count param

    const response = await this.getAPOD(apodOptions);
    return this.shuffle(
      this.toImageResponse(response).filter((r) => r.imageUrl !== null),
    );
  }

  /**
   * Overrides base no-op to persist the key via SettingStore.
   */
  override saveAPIKey(apiKey: string): void {
    SettingStore.update((state) => {
      state.wallpaper.plugins.nasa.nasaAPIKey = apiKey;
      return state;
    });
    this._apiKey = apiKey;
  }

  // ── NASA-specific public methods ─────────────────────────────

  private async getAPOD(
    options: APODOptions = {},
    apiKey: string = this._apiKey,
    retries = 0,
  ): Promise<APODResponse> {
    const url = new URL(this.APOD_BASE_URL);
    url.searchParams.append("api_key", apiKey);
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value));
    });

    const res = await this.fetchWithTimeout(url.toString());
    if (!res.ok)
      throw new Error(`NASA APOD API error: ${res.status} ${res.statusText}`);

    let response: APODResponse = await res.json();
    response.page_url = this.buildPageURL(response.date);

    // Retry on video if retries remain
    if (response.media_type === "video" && retries < this.RETRY_LIMIT) {
      return this.getAPOD(options, apiKey, retries + 1);
    }

    return response;
  }

  public async validateAPIKey(apiKey: string): Promise<boolean> {
    try {
      return !!(await this.getAPOD({}, apiKey));
    } catch {
      return false;
    }
  }

  public pinCurrentNasaAPOD() {
    SettingStore.update((state) => {
      if (
        state.wallpaper.activePlugin === "nasa" &&
        state.wallpaper.plugins.nasa.mode === "dynamic"
      ) {
        state.wallpaper.plugins.nasa.mode = "static";
        state.wallpaper.plugins.nasa.staticDate =
          state.wallpaper.plugins.nasa.lastUpdate;
      }
      return state;
    });
  }

  public async unpinCurrentNasaAPOD() {
    const today = new Date().toISOString().split("T")[0];
    const results = await this.search(today, 1);
    const wallpaper = results[0];
    SettingStore.update((state) => {
      if (
        state.wallpaper.activePlugin === "nasa" &&
        state.wallpaper.plugins.nasa.mode === "static"
      ) {
        state.wallpaper.plugins.nasa.mode = "dynamic";
        state.wallpaper.plugins.nasa.metadata = wallpaper.raw;
        state.wallpaper.url = wallpaper.imageUrl || "";
        state.wallpaper.plugins.nasa.lastUpdate = new Date(
          new Date().setHours(0, 0, 0, 0),
        );
        delete state.wallpaper.plugins.nasa.staticDate;
      }
      return state;
    });
  }

  public addNasaFavorite(date: string) {
    SettingStore.update((state) => {
      if (!state.wallpaper.plugins.nasa.favorites.includes(date)) {
        state.wallpaper.plugins.nasa.favorites.push(date);
      }
      return state;
    });
  }

  public removeNasaFavorite(date: string) {
    SettingStore.update((state) => {
      state.wallpaper.plugins.nasa.favorites =
        state.wallpaper.plugins.nasa.favorites.filter((d) => d !== date);
      return state;
    });
  }

  // ── Private helpers ──────────────────────────────────────────

  /** Maps an APODResponse to NASAImageResponse */
  private toImageResponse = (apod: APODResponse): NASAImageResponse[] => {
    return [{
      // ImageResponse base fields
      id: `nasa-apod-${apod.date}`,
      source: "nasa",
      title: apod.title,
      artist: apod.copyright ?? null,
      date: apod.date,
      imageUrl: apod.hdurl ?? apod.url,
      thumbnailUrl: apod.thumbnail_url ?? apod.url,
      tags: ["space", "astronomy", "apod"],
      sourceUrl: apod.page_url ?? null,
      // NASAImageResponse extension fields
      explanation: apod.explanation,
      mediaType: apod.media_type,
      copyright: apod.copyright ?? null,
      hdurl: apod.hdurl ?? null,
      serviceVersion: apod.service_version,
      raw: apod,
    }];
  };

  private buildPageURL(date: string): string {
    const [year, month, day] = date.split("-");
    return `https://apod.nasa.gov/apod/ap${year.slice(-2)}${month.padStart(2, "0")}${day.padStart(2, "0")}.html`;
  }

  private randomDateString(): string {
    const start = new Date("1995-06-16").getTime();
    const random = new Date(start + Math.random() * (Date.now() - start));
    return random.toISOString().split("T")[0];
  }
}
