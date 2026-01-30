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
  page_url: string;
}

export interface APODOptions {
  date?: string; // YYYY-MM-DD format
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  count?: number; // Random selection count
  thumbs?: boolean; // Return thumbnail URL for videos
}