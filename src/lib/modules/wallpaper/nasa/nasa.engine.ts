import { APODOptions, APODResponse } from "./nasa.types";


export class NASAEngineImpl {
  private APOD_BASE_URL = "https://api.nasa.gov/planetary/apod";
  private _apiKey: string;

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  set apiKey(key: string) {
    this._apiKey = key;
  }

  /**
   * Builds the APOD website page URL from a date string
   * @param date - Date in YYYY-MM-DD format
   * @returns The APOD page URL (e.g., https://apod.nasa.gov/apod/ap251203.html)
  */
  private buildPageURL(date: string): string {
    const [year, month, day] = date.split('-');

    const yy = year.slice(-2);
    const mm = month.padStart(2, '0');
    const dd = day.padStart(2, '0');

    return `https://apod.nasa.gov/apod/ap${yy}${mm}${dd}.html`;
  }

  /**
   * Fetches NASA's Astronomy Picture of the Day (APOD)
   * @param apiKey - NASA API key
   * @param options - Optional parameters for the APOD request
   * @returns Promise<APODResponse | APODResponse[]> - Single APOD or array of APODs
   */
  public async getAPOD(
    options: APODOptions = {},
    apiKey: string = this._apiKey,
  ): Promise<APODResponse> {
    try {
      const url = new URL(this.APOD_BASE_URL);
      url.searchParams.append("api_key", apiKey);

      // loop through options and append to URL
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });

      const response: APODResponse = await fetch(url.toString()).then(res => {
        if (!res.ok) {
          throw new Error(`NASA APOD API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      });

      response.page_url = this.buildPageURL(response.date);
      if (response.media_type === "video" && response.thumbnail_url) {
        response.url = response.thumbnail_url
      }

      return response;
    } catch (error) {
      throw new Error("Failed to fetch APOD data: " + error);
    }
  }

  /**
   * Fetches a random APOD from NASA's collection
   * @returns Promise<APODResponse> - A random APOD from 1995-06-16 to today
   */
  public async getRandomAPOD(): Promise<APODResponse> {
    const startDate = new Date("1995-06-16");
    const endDate = new Date();
    const randomDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    const dateStr = randomDate.toISOString().split("T")[0];

    return this.getAPOD({ date: dateStr });
  }

  /**
   * Checks if the provided API key is valid by making a test request
   * @param apiKey - NASA API key to validate
   * @returns Promise<boolean> - True if the API key is valid, false otherwise
   */
  public async validateAPIKey(apiKey: string): Promise<boolean> {
    try {
      const testAPOD = await this.getAPOD({}, apiKey);
      return !!testAPOD;
    } catch {
      return false;
    }
  }
}

export const NASAEngine = new NASAEngineImpl("DEMO_KEY");