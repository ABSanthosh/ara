import { ImageEngine, ImageResponse } from "../image.engine";

export class NGAEngineImpl extends ImageEngine<ImageResponse> {
  private readonly BASE_URL = "https://api.nga.gov/art/tms/objects";

  async search(
    tag: string,
    limit: number,
    _options?: unknown,
  ): Promise<ImageResponse[]> {
    const url = `${this.BASE_URL}?keyword=${encodeURIComponent(tag)}&limit=${limit}&offset=0`;

    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`NGA ${res.status}`);

    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.items ?? []).map(
      (item: any): ImageResponse => ({
        id: `nga-${item.objectid}`,
        source: "nga",
        title: item.title ?? "Untitled",
        artist: item.attribution ?? null,
        date: item.displaydate ?? null,
        imageUrl: item.iiifThumbServiceUrl
          ? `${item.iiifThumbServiceUrl}/full/full/0/default.jpg`
          : null,
        thumbnailUrl: item.iiifThumbServiceUrl
          ? `${item.iiifThumbServiceUrl}/full/!200,200/0/default.jpg`
          : null,
        tags: item.keywords
          ? item.keywords.split(",").map((t: string) => t.trim())
          : [],
        sourceUrl:
          item.url ??
          `https://www.nga.gov/collection/art-object-page.${item.objectid}.html`,
      }),
    );
  }
}
