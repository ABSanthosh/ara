import { ImageEngine, ImageResponse } from "../image.engine";

export class GettyEngineImpl extends ImageEngine<ImageResponse> {
  private readonly SEARCH_URL =
    "https://collectionapi.getty.edu/public/collection/v1/search";
  private readonly OBJECT_URL =
    "https://collectionapi.getty.edu/public/collection/v1/objects";

  async search(
    tag: string,
    limit: number,
    _options?: unknown,
  ): Promise<ImageResponse[]> {
    const res = await this.fetchWithTimeout(
      `${this.SEARCH_URL}?q=${encodeURIComponent(tag)}&hasImages=true`,
    );
    if (!res.ok) throw new Error(`Getty ${res.status}`);

    const json = await res.json();
    const ids: number[] = (json.objectIDs ?? []).slice(0, limit);

    const results = await Promise.allSettled(
      ids.map(async (id): Promise<ImageResponse> => {
        const detailRes = await this.fetchWithTimeout(
          `${this.OBJECT_URL}/${id}`,
        );
        if (!detailRes.ok)
          throw new Error(`Getty object ${id}: ${detailRes.status}`);
        const d = await detailRes.json();
        return {
          id: `getty-${id}`,
          source: "getty",
          title: d.title ?? "Untitled",
          artist: d.artistDisplayName ?? null,
          date: d.objectDate ?? null,
          imageUrl: d.primaryImage ?? null,
          thumbnailUrl: d.primaryImageSmall ?? null,
          tags: d.tags?.map((t: { term: string }) => t.term) ?? [],
          sourceUrl: d.objectURL ?? null,
        };
      }),
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<ImageResponse> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);
  }
}
