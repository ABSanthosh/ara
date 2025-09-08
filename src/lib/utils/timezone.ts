export interface CityTimezone {
  name: string;
  timezone: string;
  country: string;
  abbr: string;
}

// Union type of all supported city names
export type SupportedCityName = typeof SUPPORTED_CITIES[number]['name'];

export const SUPPORTED_CITIES: CityTimezone[] = [
  // North America
  { name: "New York", timezone: "America/New_York", country: "USA", abbr: "NYC" },
  { name: "Los Angeles", timezone: "America/Los_Angeles", country: "USA", abbr: "LAX" },
  { name: "Chicago", timezone: "America/Chicago", country: "USA", abbr: "CHI" },
  { name: "Denver", timezone: "America/Denver", country: "USA", abbr: "DEN" },
  { name: "Vancouver", timezone: "America/Vancouver", country: "Canada", abbr: "YVR" },
  { name: "Toronto", timezone: "America/Toronto", country: "Canada", abbr: "YYZ" },
  { name: "Mexico City", timezone: "America/Mexico_City", country: "Mexico", abbr: "MEX" },
  
  // Europe
  { name: "London", timezone: "Europe/London", country: "UK", abbr: "LON" },
  { name: "Paris", timezone: "Europe/Paris", country: "France", abbr: "PAR" },
  { name: "Berlin", timezone: "Europe/Berlin", country: "Germany", abbr: "BER" },
  { name: "Rome", timezone: "Europe/Rome", country: "Italy", abbr: "ROM" },
  { name: "Madrid", timezone: "Europe/Madrid", country: "Spain", abbr: "MAD" },
  { name: "Amsterdam", timezone: "Europe/Amsterdam", country: "Netherlands", abbr: "AMS" },
  { name: "Stockholm", timezone: "Europe/Stockholm", country: "Sweden", abbr: "STO" },
  { name: "Moscow", timezone: "Europe/Moscow", country: "Russia", abbr: "MOW" },
  { name: "Istanbul", timezone: "Europe/Istanbul", country: "Turkey", abbr: "IST" },
  
  // Asia
  { name: "Tokyo", timezone: "Asia/Tokyo", country: "Japan", abbr: "TOK" },
  { name: "Shanghai", timezone: "Asia/Shanghai", country: "China", abbr: "SHA" },
  { name: "Hong Kong", timezone: "Asia/Hong_Kong", country: "Hong Kong", abbr: "HKG" },
  { name: "Singapore", timezone: "Asia/Singapore", country: "Singapore", abbr: "SIN" },
  { name: "Mumbai", timezone: "Asia/Kolkata", country: "India", abbr: "BOM" },
  { name: "Delhi", timezone: "Asia/Kolkata", country: "India", abbr: "DEL" },
  { name: "Dubai", timezone: "Asia/Dubai", country: "UAE", abbr: "DXB" },
  { name: "Seoul", timezone: "Asia/Seoul", country: "South Korea", abbr: "ICN" },
  { name: "Bangkok", timezone: "Asia/Bangkok", country: "Thailand", abbr: "BKK" },
  { name: "Jakarta", timezone: "Asia/Jakarta", country: "Indonesia", abbr: "JKT" },
  
  // Australia & Oceania
  { name: "Sydney", timezone: "Australia/Sydney", country: "Australia", abbr: "SYD" },
  { name: "Melbourne", timezone: "Australia/Melbourne", country: "Australia", abbr: "MEL" },
  { name: "Perth", timezone: "Australia/Perth", country: "Australia", abbr: "PER" },
  { name: "Auckland", timezone: "Pacific/Auckland", country: "New Zealand", abbr: "AKL" },
  
  // South America
  { name: "São Paulo", timezone: "America/Sao_Paulo", country: "Brazil", abbr: "SAO" },
  { name: "Buenos Aires", timezone: "America/Argentina/Buenos_Aires", country: "Argentina", abbr: "BUE" },
  { name: "Santiago", timezone: "America/Santiago", country: "Chile", abbr: "SCL" },
  { name: "Lima", timezone: "America/Lima", country: "Peru", abbr: "LIM" },
  
  // Africa
  { name: "Cairo", timezone: "Africa/Cairo", country: "Egypt", abbr: "CAI" },
  { name: "Lagos", timezone: "Africa/Lagos", country: "Nigeria", abbr: "LOS" },
  { name: "Cape Town", timezone: "Africa/Johannesburg", country: "South Africa", abbr: "CPT" },
  { name: "Nairobi", timezone: "Africa/Nairobi", country: "Kenya", abbr: "NBO" },
  
  // Middle East
  { name: "Tehran", timezone: "Asia/Tehran", country: "Iran", abbr: "THR" },
  { name: "Riyadh", timezone: "Asia/Riyadh", country: "Saudi Arabia", abbr: "RUH" },
  { name: "Jerusalem", timezone: "Asia/Jerusalem", country: "Israel", abbr: "JRS" },
];

/**
 * Get all supported IANA timezone identifiers
 * @returns Array of all supported timezone identifiers
 */
export function getAllSupportedTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (error) {
    console.error('Error getting supported timezones:', error);
    // Fallback to empty array if not supported
    return [];
  }
}

/**
 * Validate if a timezone identifier is supported
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns boolean indicating if the timezone is supported
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to format a date with the timezone - will throw if invalid
    new Date().toLocaleString("en-US", { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate all cities in SUPPORTED_CITIES have valid timezones
 * @returns Object with validation results
 */
export function validateSupportedCities(): { valid: CityTimezone[], invalid: CityTimezone[] } {
  const valid: CityTimezone[] = [];
  const invalid: CityTimezone[] = [];
  
  SUPPORTED_CITIES.forEach(city => {
    if (isValidTimezone(city.timezone)) {
      valid.push(city);
    } else {
      invalid.push(city);
    }
  });
  
  return { valid, invalid };
}

/**
 * Get city abbreviation by name
 * @param cityName - The name of the city (case-insensitive)
 * @returns City abbreviation or empty string if not found
 */
export function getCityAbbreviation(cityName?: SupportedCityName): string {
  if (!cityName) {
    return "";
  }
  
  const city = SUPPORTED_CITIES.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  );
  
  return city ? city.abbr : "";
}

/**
 * Get timezone offset for a specific city in hours
 * @param cityName - The name of the city (case-insensitive)
 * @returns Timezone offset in hours (e.g., -5 for EST, +9 for JST)
 */
export function getTimezoneOffset(cityName?: SupportedCityName): number {
  if (!cityName) {
    // Return local timezone offset
    return -new Date().getTimezoneOffset() / 60;
  }
  
  const city = SUPPORTED_CITIES.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  );
  
  if (!city) {
    return -new Date().getTimezoneOffset() / 60;
  }
  
  try {
    const now = new Date();
    
    // Get the time in the target timezone
    const targetTime = new Date(now.toLocaleString("en-US", { 
      timeZone: city.timezone 
    }));
    
    // Get the time in UTC
    const utcTime = new Date(now.toLocaleString("en-US", { 
      timeZone: "UTC" 
    }));
    
    // Calculate offset in hours
    const offsetMs = targetTime.getTime() - utcTime.getTime();
    return Math.round(offsetMs / (1000 * 60 * 60));
  } catch (error) {
    console.error(`Error getting timezone offset for ${cityName}:`, error);
    return -new Date().getTimezoneOffset() / 60;
  }
}

/**
 * Get the current time for a specific city
 * @param cityName - The name of the city (case-insensitive)
 * @returns Date object adjusted for the city's timezone, or current local time if city not found
 */
export function getTimeForCity(cityName?: SupportedCityName): Date {
  if (!cityName) {
    return new Date();
  }
  
  const city = SUPPORTED_CITIES.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  );
  
  if (!city) {
    console.warn(`City "${cityName}" not found in supported cities list. Using local time.`);
    return new Date();
  }
  
  try {
    const now = new Date();
    
    // Get the time string in the target timezone
    const timeString = now.toLocaleString("en-US", { 
      timeZone: city.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the time string back into a Date object
    // Format: "MM/DD/YYYY, HH:MM:SS"
    const [datePart, timePart] = timeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    return new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  } catch (error) {
    console.error(`Error getting time for ${cityName}:`, error);
    return new Date();
  }
}

/**
 * Get a list of all supported city names
 * @returns Array of city names
 */
export function getSupportedCities(): string[] {
  return SUPPORTED_CITIES.map(city => city.name);
}

/**
 * Get city information by name
 * @param cityName - The name of the city (case-insensitive)
 * @returns City information or null if not found
 */
export function getCityInfo(cityName: SupportedCityName): CityTimezone | null {
  return SUPPORTED_CITIES.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  ) || null;
}
