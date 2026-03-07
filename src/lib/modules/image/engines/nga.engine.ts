// Original source https://docs.google.com/spreadsheets/d/1XmTMSaZ2_OpqP7Rv3QUlZv0uOfzI5S5TCVh0NeQUGz0/pub?gid=973777172&single=true
// My source sheet https://docs.google.com/spreadsheets/d/1X9yd14djfaWDBGDBLQB4HLFkYExsSeSqtfss36aFiqc/edit#gid=858621800
// Found the original source by decompiling this extension: https://chromewebstore.google.com/detail/artsytabs/moomampnjdnadponhcegnlaophmdcmnm
// Probable i can just download openaccess files like this from github upload it to sheets and make a random query like so.
import { ImageEngine, ImageResponse } from "../image.engine";

export class NGAEngineImpl extends ImageEngine<ImageResponse> {
  private readonly SHEET_ID = "1X9yd14djfaWDBGDBLQB4HLFkYExsSeSqtfss36aFiqc";
  private readonly SHEET_GID = "858621800";
  // https://docs.google.com/spreadsheets/d/1X9yd14djfaWDBGDBLQB4HLFkYExsSeSqtfss36aFiqc/gviz/tq?tq=SELECT%20A%2CB%2CC%2CD%20WHERE%20D%3E%3D0.4912043196%20ORDER%20BY%20D%20LIMIT%201
  /**
   * NGA does not support search by keyword
   */
  async search(
    tag: string,
    limit: number,
    _options?: unknown,
  ): Promise<ImageResponse[]> {
    return Promise.reject(new Error("NGA API does not support search"));
  }

  /**
   * Get `limit` random images from the spreadsheet.
   */
  async getRandom(
    tag: string,
    limit = 1,
    _options?: unknown,
  ): Promise<ImageResponse[]> {
    const results: ImageResponse[] = [];

    for (let i = 0; i < limit; i++) {
      // Generate a client-side random number 0–1
      const rand = Number(Math.random().toPrecision(10));

      // Build the Google Visualization API query
      // We assume your sheet has a "rand_key" column in column D (1-based index 4)
      const query = encodeURIComponent(
        `SELECT A,B,C,D WHERE D>=${rand} ORDER BY D LIMIT 1`,
      );

      const url = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tq=${query}&gid=${this.SHEET_GID}`;

      try {
        const res = await this.fetchWithTimeout(url);
        const data = this.parseGvizResponse(await res.text());

        const row = data.table.rows[0]?.c;
        if (!row) continue;

        const [imageUrl, title, source, randKey] = row.map(
          (c: any) => c?.v ?? null,
        );

        // Parse title format: "Title, Artist, Date"
        let parsedTitle = title;
        let artist = null;
        let date = null;

        if (title) {
          const parts = title.split(',').map((part: string) => part.trim());
          if (parts.length >= 3) {
            date = parts[parts.length - 1];
            artist = parts[parts.length - 2];
            parsedTitle = parts.slice(0, parts.length - 2).join(', ');
          } else if (parts.length === 2) {
            date = parts[parts.length - 1];
            parsedTitle = parts[0];
          }
        }

        results.push({
          id: imageUrl ?? title ?? source ?? `${Math.random()}`,
          source: "NGA",
          title: parsedTitle,
          artist,
          date,
          imageUrl,
          thumbnailUrl: imageUrl, // optionally same as full
          tags: [],
          sourceUrl: source,
        });
      } catch (err) {
        console.error("Failed to fetch random NGA row:", err);
      }
    }

    return results;
  }

  private parseGvizResponse(raw: string) {
    raw = raw.replace("/*O_o*/", "").trim();
    return JSON.parse(
      raw
        .replace(/^\/\*.*\*\//, "")
        .replace(/^google\.visualization\.Query\.setResponse\(/, "")
        .replace(/\);$/, "")
        .trim(),
    );
  }
}
