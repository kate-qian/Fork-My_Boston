/**
 * OpenStreetMap connector for Fork My Boston.
 *
 * Fetches public Boston-area points of interest through Overpass API.
 * No API key required.
 *
 * IMPORTANT:
 * - Call this from server-side code only.
 * - Cache results; don't query Overpass on every page load.
 * - Preserve OpenStreetMap attribution.
 */


import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const CACHE_DIR = path.join(
  process.cwd(),
  "lib",
  "knowledge",
  "cache"
);

const BOSTON_BOUNDS = {
  south: 42.2279,
  west: -71.1912,
  north: 42.3974,
  east: -70.986,
};

export type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "nightlife"
  | "park"
  | "culture"
  | "bookstore"
  | "library"
  | "attraction"
  | "other";

export interface OpenStreetMapPlace {
  id: string;
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  cuisine?: string;
  tags: Record<string, string>;
  source: "OpenStreetMap";
  sourceUrl: string;
  license: "ODbL";
}

interface OSMElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
  remark?: string;
}

export interface FetchPlacesOptions {
  category?: PlaceCategory;
  limit?: number;
  signal?: AbortSignal;
  refresh?: boolean;
  cacheTtlHours?: number;
}

const CATEGORY_FILTERS: Record<Exclude<PlaceCategory, "other">, string[]> = {
  cafe: [
    'nwr["name"]["amenity"~"^(cafe|ice_cream)$"]',
  ],
  restaurant: [
    'nwr["name"]["amenity"~"^(restaurant|fast_food)$"]',
  ],
  nightlife: [
    'nwr["name"]["amenity"~"^(bar|pub)$"]',
  ],
  park: [
    'nwr["name"]["leisure"~"^(park|garden)$"]',
  ],
  culture: [
    'nwr["name"]["tourism"~"^(museum|gallery)$"]',
    'nwr["name"]["amenity"="arts_centre"]',
  ],
  bookstore: [
    'nwr["name"]["shop"="books"]',
  ],
  library: [
    'nwr["name"]["amenity"="library"]',
  ],
  attraction: [
    'nwr["name"]["tourism"="attraction"]',
  ],
};

function buildQuery(category?: PlaceCategory): string {
  const { south, west, north, east } = BOSTON_BOUNDS;

  const filters = category && category !== "other"
    ? CATEGORY_FILTERS[category]
    : Object.values(CATEGORY_FILTERS).flat();

  const queries = filters
    .map(
      (filter) =>
        `${filter}(${south},${west},${north},${east});`
    )
    .join("\n");

  return `
    [out:json][timeout:30];
    (
      ${queries}
    );
    out center tags;
  `;
}

function getCategory(tags: Record<string, string>): PlaceCategory {
  if (tags.amenity === "cafe" || tags.amenity === "ice_cream") {
    return "cafe";
  }

  if (["restaurant", "fast_food"].includes(tags.amenity)) {
    return "restaurant";
  }

  if (["bar", "pub"].includes(tags.amenity)) {
    return "nightlife";
  }

  if (["park", "garden"].includes(tags.leisure)) {
    return "park";
  }

  if (tags.amenity === "library") {
    return "library";
  }

  if (tags.shop === "books") {
    return "bookstore";
  }

  if (
    ["museum", "gallery"].includes(tags.tourism) ||
    tags.amenity === "arts_centre"
  ) {
    return "culture";
  }

  if (tags.tourism === "attraction") {
    return "attraction";
  }

  return "other";
}

function getAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function normalizePlace(element: OSMElement): OpenStreetMapPlace | null {
  const tags = element.tags;

  if (!tags?.name) return null;

  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return {
    id: `${element.type}-${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name: tags.name,
    category: getCategory(tags),
    latitude,
    longitude,
    address: getAddress(tags),
    website: tags.website || tags["contact:website"],
    phone: tags.phone || tags["contact:phone"],
    openingHours: tags.opening_hours,
    cuisine: tags.cuisine,
    tags,
    source: "OpenStreetMap",
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    license: "ODbL",
  };
}

function getCachePath(category?: PlaceCategory): string {
  const key = category ?? "all";
  return path.join(CACHE_DIR, `boston-${key}.json`);
}

async function readCache(
  category?: PlaceCategory,
  ttlHours = 24
): Promise<OpenStreetMapPlace[] | null> {
  try {
    const filePath = getCachePath(category);
    const raw = await readFile(filePath, "utf-8");
    const cached = JSON.parse(raw) as {
      fetchedAt: number;
      places: OpenStreetMapPlace[];
    };

    const age = Date.now() - cached.fetchedAt;
    const maxAge = ttlHours * 60 * 60 * 1000;

    if (age > maxAge) return null;

    console.log(
      `Using cached ${category ?? "all"} places (${Math.round(age / 60000)} minutes old).`
    );

    return cached.places;
  } catch {
    return null;
  }
}

async function writeCache(
  places: OpenStreetMapPlace[],
  category?: PlaceCategory
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });

  const cacheData = {
    fetchedAt: Date.now(),
    places,
  };

  await writeFile(
    getCachePath(category),
    JSON.stringify(cacheData, null, 2),
    "utf-8"
  );
}

export async function fetchBostonPlaces(
  options: FetchPlacesOptions = {}
): Promise<OpenStreetMapPlace[]> {
  const {
    category,
    limit = 500,
    signal,
    refresh = false,
    cacheTtlHours = 24,
  } = options;

  if (!Number.isInteger(limit) || limit < 1 || limit > 5000) {
    throw new Error("Limit must be an integer between 1 and 5000.");
  }

  if (cacheTtlHours < 0) {
    throw new Error("Cache TTL cannot be negative.");
  }

  if (!refresh) {
    const cached = await readCache(category, cacheTtlHours);

    if (cached) {
      return cached.slice(0, limit);
    }
  }

  console.log(
    `Fetching ${category ?? "all"} places from Overpass...`
  );

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "ForkMyBoston/0.1 (YOUR_CONTACT_EMAIL_OR_PROJECT_URL)",
    },
    body: new URLSearchParams({
      data: buildQuery(category),
    }),
    signal: signal ?? AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenStreetMap request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OverpassResponse;

  if (data.remark) {
    throw new Error(`Overpass query warning: ${data.remark}`);
  }

  if (!Array.isArray(data.elements)) {
    throw new Error("Unexpected response from OpenStreetMap.");
  }

  const places = data.elements
    .map(normalizePlace)
    .filter(
      (place): place is OpenStreetMapPlace => place !== null
    );

  const filtered = category
    ? places.filter((place) => place.category === category)
    : places;

  const unique = Array.from(
    new Map(filtered.map((place) => [place.id, place])).values()
  );

  await writeCache(unique, category);

  console.log(`Retrieved and cached ${unique.length} places.`);

  return unique.slice(0, limit);
}
