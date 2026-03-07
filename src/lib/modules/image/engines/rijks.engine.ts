import { ImageEngine, ImageResponse } from "../image.engine";

export class RijksEngineImpl extends ImageEngine<ImageResponse> {
  private readonly BASE_URL = "https://www.rijksmuseum.nl/api/en/collection";
  private readonly apiKey: string;

  /** @param apiKey - Free key from https://www.rijksmuseum.nl/en/research/conduct-research/data/api */
  constructor(apiKey: string, timeoutMs?: number) {
    super(timeoutMs);
    this.apiKey = apiKey;
  }

  async search(
    tag: string,
    limit: number,
    _options?: unknown,
  ): Promise<ImageResponse[]> {
    const url = `${this.BASE_URL}?key=${this.apiKey}&q=${encodeURIComponent(tag)}&imgonly=true&ps=${limit}`;

    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Rijksmuseum ${res.status}`);

    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.artObjects ?? []).map(
      (item: any): ImageResponse => ({
        id: `rijksmuseum-${item.objectNumber}`,
        source: "rijksmuseum",
        title: item.title ?? "Untitled",
        artist: item.principalOrFirstMaker ?? null,
        date: null,
        imageUrl: item.webImage?.url ?? null,
        thumbnailUrl: item.headerImage?.url ?? item.webImage?.url ?? null,
        tags: (item.longTitle ?? "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
        sourceUrl: item.links?.web ?? null,
      }),
    );
  }
}
