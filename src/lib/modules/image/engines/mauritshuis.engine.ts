import { ImageEngine, ImageResponse } from "../image.engine";

export class MauritshuisEngineImpl extends ImageEngine<ImageResponse> {
  private readonly BASE_URL = "https://data.mauritshuis.nl/objects.json";

  async search(
    tag: string,
    limit: number,
    _options?: unknown,
  ): Promise<ImageResponse[]> {
    const url = `${this.BASE_URL}?query=${encodeURIComponent(tag)}&limit=${limit}`;

    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Mauritshuis ${res.status}`);

    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.records ?? json.items ?? []).map(
      (item: any): ImageResponse => ({
        id: `mauritshuis-${item.id ?? item.objectnumber}`,
        source: "mauritshuis",
        title: item.title ?? item.label ?? "Untitled",
        artist: item.maker ?? item.artist ?? null,
        date: item.dating ?? item.date ?? null,
        imageUrl: item.iiifUrl
          ? `${item.iiifUrl}/full/full/0/default.jpg`
          : (item.imageUrl ?? null),
        thumbnailUrl: item.iiifUrl
          ? `${item.iiifUrl}/full/!300,300/0/default.jpg`
          : null,
        tags: item.tags ?? item.keywords ?? [],
        sourceUrl: item.url ?? null,
      }),
    );
  }
}
