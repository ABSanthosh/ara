import { ImageResponse } from "../../image.engine";

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
