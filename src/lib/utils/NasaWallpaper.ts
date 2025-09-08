export interface APODResponse {
  copyright?: string;
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: "image" | "video";
  thumbnail_url?: string;
  service_version: string;
  title: string;
  url: string;
}

interface APODOptions {
  date?: string; // YYYY-MM-DD format
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  count?: number; // Random selection count
  thumbs?: boolean; // Return thumbnail URL for videos
}

const APOD_BASE_URL = "https://api.nasa.gov/planetary/apod";

/**
 * Fetches NASA's Astronomy Picture of the Day (APOD)
 * @param apiKey - NASA API key
 * @param options - Optional parameters for the APOD request
 * @returns Promise<APODResponse | APODResponse[]> - Single APOD or array of APODs
 */
export async function fetchAPOD(
  apiKey: string,
  options: APODOptions = {}
): Promise<APODResponse | APODResponse[]> {
  try {
    const url = new URL(APOD_BASE_URL);
    url.searchParams.append("api_key", apiKey);

    // Add optional parameters
    if (options.date) {
      url.searchParams.append("date", options.date);
    }
    if (options.start_date) {
      url.searchParams.append("start_date", options.start_date);
    }
    if (options.end_date) {
      url.searchParams.append("end_date", options.end_date);
    }
    if (options.count) {
      url.searchParams.append("count", options.count.toString());
    }
    if (options.thumbs) {
      url.searchParams.append("thumbs", "true");
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `NASA APOD API error: ${response.status} ${response.statusText}`
      );
    }

    const data: APODResponse = await response.json();
    if (data.media_type === "video" && data.thumbnail_url) {
      data.url = data.thumbnail_url;
    }
    return data;
  } catch (error) {
    console.error("Error fetching NASA APOD:", error);
    throw error;
  }
}

/**
 * Fetches today's APOD
 * @param apiKey - NASA API key
 * @returns Promise<APODResponse> - Today's APOD
 */
export async function fetchTodaysAPOD(apiKey: string): Promise<APODResponse> {
  const result = await fetchAPOD(apiKey);
  return result as APODResponse;
}

/**
 * Fetches APOD for a specific date
 * @param apiKey - NASA API key
 * @param date - Date in YYYY-MM-DD format
 * @returns Promise<APODResponse> - APOD for the specified date
 */
export async function fetchAPODByDate(
  apiKey: string,
  date: string
): Promise<APODResponse> {
  const result = await fetchAPOD(apiKey, { date });
  return result as APODResponse;
}

/**
 * Fetches random APOD entries
 * @param apiKey - NASA API key
 * @param count - Number of random entries to fetch
 * @returns Promise<APODResponse[]> - Array of random APODs
 */
export async function fetchRandomAPODs(
  apiKey: string,
  count: number
): Promise<APODResponse[]> {
  const result = await fetchAPOD(apiKey, { count });
  return result as APODResponse[];
}

/**
 * Fetches APOD entries for a date range
 * @param apiKey - NASA API key
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise<APODResponse[]> - Array of APODs in the date range
 */
export async function fetchAPODRange(
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<APODResponse[]> {
  const result = await fetchAPOD(apiKey, {
    start_date: startDate,
    end_date: endDate,
  });
  return result as APODResponse[];
}

/**
 * Fetches a random APOD from the past
 * @param apiKey - NASA API key
 * @returns Promise<APODResponse> - Random APOD from the past
 */
export async function fetchRandomPastAPOD(
  apiKey: string
): Promise<APODResponse> {
  // APOD started on June 16, 1995
  const startDate = new Date("1995-06-16");
  const endDate = new Date();

  // Generate a random date between start and end
  const randomTime =
    startDate.getTime() +
    Math.random() * (endDate.getTime() - startDate.getTime());
  const randomDate = new Date(randomTime);

  // Format as YYYY-MM-DD
  const dateString = randomDate.toISOString().split("T")[0];

  const result = await fetchAPOD(apiKey, { date: dateString });
  return result as APODResponse;
}
