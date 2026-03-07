// Ref: https://github.com/art-institute-of-chicago/browser-extension
import { ImageEngine, ImageResponse } from "../image.engine";

const AIC_SEARCH_URL = "https://api.artic.edu/api/v1/artworks/search";
// Fallback only — prefer config.iiif_url from the API response per docs
const AIC_IIIF_FALLBACK = "https://www.artic.edu/iiif/2";

/** AIC thumbnail dimensions returned by the API — used for aspect ratio */
interface AICThumbnail {
  width: number;
  height: number;
  alt_text?: string;
}

/** AIC-specific ImageResponse with extra fields available from the API */
export interface AICArtworkResponse extends ImageResponse {
  source: "aic";
  /** Artwork description (CC-By licensed) */
  description: string | null;
  /** Full-resolution download URL (3000px wide, public domain only) */
  downloadUrl: string | null;
  /** Aspect ratio metadata from the API */
  thumbnail: AICThumbnail | null;
}

export class AICEngineImpl extends ImageEngine<AICArtworkResponse> {
  private static readonly FIELDS = [
    "id",
    "title",
    "artist_title",
    "image_id",
    "date_display",
    "description",
    "thumbnail",
  ];

  /**
   * Keyword search using AIC's Elasticsearch endpoint (GET + params=).
   * The docs recommend GET with the full ES query as minified URL-encoded
   * JSON in the `params` parameter for production use.
   * Filters to public-domain works with valid images only.
   */
  async search(
    tag: string,
    limit: number,
    _options?: unknown,
  ): Promise<AICArtworkResponse[]> {
    return this.getSearch(tag, limit, Date.now());
  }

  /**
   * Overrides default shuffle-after-search.
   * AIC supports `random_score` natively in its ES query — each call uses
   * a fresh millisecond seed so results differ every time without any
   * client-side shuffling.
   */
  override async getRandom(
    _tag: string,
    limit = 10,
    _options?: unknown,
  ): Promise<AICArtworkResponse[]> {
    const results = await this.getSearch(null, limit, Date.now());
    return results.filter((r) => r.imageUrl !== null);
  }

  // ── Private helpers ──────────────────────────────────────────

  private async getSearch(
    tag: string | null,
    limit: number,
    seed: number,
  ): Promise<AICArtworkResponse[]> {
    const query = this.buildQuery(tag, limit, seed);

    // Per docs: use GET with the full ES query as minified URL-encoded JSON
    // in the `params` query parameter for production
    const params = encodeURIComponent(JSON.stringify(query));
    const url = `${AIC_SEARCH_URL}?params=${params}`;

    const res = await this.fetchWithTimeout(url, {
      headers: {
        // Docs ask for AIC-User-Agent as a courtesy so they can reach out
        // if we're using disproportionate resources. Use AIC- prefix because
        // modifying User-Agent directly is forbidden by some browsers.
        "AIC-User-Agent": "image-engine (your-contact@email.com)",
      },
    });
    if (!res.ok) throw new Error(`AIC ${res.status}`);

    const json = await res.json();

    // Read iiif_url from config — docs say don't hardcode this value
    const iiifBase: string = json.config?.iiif_url ?? AIC_IIIF_FALLBACK;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.data ?? []).map((item: any): AICArtworkResponse => {
      const slug = this.slugify(item.title ?? "");
      return {
        id: `aic-${item.id}`,
        source: "aic",
        title: item.title ?? "Untitled",
        artist: item.artist_title ?? null,
        date: item.date_display ?? null,
        description: item.description ?? null,
        imageUrl: item.image_id
          ? `${iiifBase}/${item.image_id}/full/843,/0/default.jpg`
          : null,
        thumbnailUrl: item.image_id
          ? `${iiifBase}/${item.image_id}/full/200,/0/default.jpg`
          : null,
        downloadUrl: item.image_id
          ? `${iiifBase}/${item.image_id}/full/1686,/0/default.jpg`
          : null,
        thumbnail: item.thumbnail ?? null,
        tags: [],
        sourceUrl: `https://www.artic.edu/artworks/${item.id}/${slug}`,
      };
    });
  }

  /**
   * Builds the ES query object.
   * When `tag` is null — pure random public-domain artworks (getRandom).
   * When `tag` is provided — keyword match on top of the base filters (search).
   * Uses `size` for ES pagination per the docs (not `limit`).
   */
  private buildQuery(tag: string | null, size: number, seed: number): object {
    const baseFilters = [
      { term: { is_public_domain: true } },
      { exists: { field: "image_id" } },
      { exists: { field: "thumbnail.width" } },
      { exists: { field: "thumbnail.height" } },
    ];

    const boolQuery = tag
      ? {
          must: [
            {
              multi_match: {
                query: tag,
                fields: ["title", "artist_title", "subject_titles"],
              },
            },
          ],
          filter: baseFilters,
        }
      : { filter: baseFilters };

    return {
      fields: AICEngineImpl.FIELDS,
      boost: false,
      size, // ES uses `size`, not `limit`, per the docs
      query: {
        function_score: {
          query: { bool: boolQuery },
          boost_mode: "replace",
          // Native random ordering — ms timestamp seed means every call differs
          random_score: { field: "id", seed },
        },
      },
    };
  }

  /** Matches the AIC website's slug format to avoid redirects */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
