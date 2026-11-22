import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { OpenStreetMapPlace } from "./connectors/openstreetmap";

const NEIGHBORHOOD_API =
  "https://gis.bostonplans.org/hosting/rest/services/Hosted/Boston_Neighborhood_Boundaries/FeatureServer/5/query";

const CACHE_DIR = path.join(
  process.cwd(),
  "lib",
  "knowledge",
  "cache"
);

const CACHE_FILE = path.join(
  CACHE_DIR,
  "boston-neighborhoods.geojson"
);

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

export interface NeighborhoodProperties {
  name: string;
  neighborhood_id?: string;

  Name?: string;
  OBJECTID?: number | string;
}

export interface NeighborhoodPolygon {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][][] | number[][][];
}

export interface NeighborhoodFeature {
  type: "Feature";
  properties: NeighborhoodProperties;
  geometry: NeighborhoodPolygon;
}

export interface NeighborhoodCollection {
  type: "FeatureCollection";
  features: NeighborhoodFeature[];
}

export interface NeighborhoodMatch {
  name: string;
  id?: string;
  source: "BPDA GIS";
}

interface CachedNeighborhoods {
  fetchedAt: number;
  data: NeighborhoodCollection;
}

function isValidCollection(
  value: unknown
): value is NeighborhoodCollection {
  if (!value || typeof value !== "object") return false;

  const collection = value as NeighborhoodCollection;

  return (
    collection.type === "FeatureCollection" &&
    Array.isArray(collection.features) &&
    collection.features.length > 0
  );
}

async function readNeighborhoodCache(): Promise<NeighborhoodCollection | null> {
  try {
    const raw = await readFile(CACHE_FILE, "utf-8");
    const cached = JSON.parse(raw) as CachedNeighborhoods;

    const age = Date.now() - cached.fetchedAt;

    if (age > CACHE_TTL || !isValidCollection(cached.data)) {
      return null;
    }

    console.log(
      `Using cached Boston neighborhoods (${Math.round(age / 86400000)} days old).`
    );

    return cached.data;
  } catch {
    return null;
  }
}

async function writeNeighborhoodCache(
  data: NeighborhoodCollection
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });

  const cached: CachedNeighborhoods = {
    fetchedAt: Date.now(),
    data,
  };

  await writeFile(
    CACHE_FILE,
    JSON.stringify(cached),
    "utf-8"
  );
}

export async function fetchBostonNeighborhoods(
  refresh = false
): Promise<NeighborhoodCollection> {
  if (!refresh) {
    const cached = await readNeighborhoodCache();

    if (cached) return cached;
  }

  console.log("Fetching Boston neighborhood boundaries...");

  const params = new URLSearchParams({
    where: "1=1",
    outFields: "name,neighborhood_id",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });

  const response = await fetch(
    `${NEIGHBORHOOD_API}?${params.toString()}`,
    {
      headers: {
        Accept: "application/geo+json, application/json",
      },
      signal: AbortSignal.timeout(45000),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Neighborhood request failed: ${response.status} ${response.statusText}\n${errorBody.slice(0, 500)}`
    );
  }

  const responseText = await response.text();

  let data: unknown;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Expected JSON from Boston GIS, but received: ${responseText.slice(0, 250)}`
    );
  }

  if (!isValidCollection(data)) {
    throw new Error("Unexpected neighborhood boundary response.");
  }

  await writeNeighborhoodCache(data);

  console.log(
    `Retrieved and cached ${data.features.length} neighborhoods.`
  );

  return data;
}

// Check whether a point lies directly on a polygon edge.
function isOnSegment(
  x: number,
  y: number,
  a: number[],
  b: number[]
): boolean {
  const cross =
    (y - a[1]) * (b[0] - a[0]) -
    (x - a[0]) * (b[1] - a[1]);

  if (Math.abs(cross) > 1e-10) return false;

  return (
    x >= Math.min(a[0], b[0]) - 1e-10 &&
    x <= Math.max(a[0], b[0]) + 1e-10 &&
    y >= Math.min(a[1], b[1]) - 1e-10 &&
    y <= Math.max(a[1], b[1]) + 1e-10
  );
}

// GeoJSON coordinates are [longitude, latitude].
function pointInRing(
  longitude: number,
  latitude: number,
  ring: number[][]
): boolean {
  let inside = false;

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const a = ring[j];
    const b = ring[i];

    if (isOnSegment(longitude, latitude, a, b)) {
      return true;
    }

    const intersects =
      (a[1] > latitude) !== (b[1] > latitude) &&
      longitude <
        ((b[0] - a[0]) * (latitude - a[1])) /
          (b[1] - a[1]) +
          a[0];

    if (intersects) inside = !inside;
  }

  return inside;
}

// a polygon's first ring is its exterior; additional rings represent holes.
function pointInPolygon(
  longitude: number,
  latitude: number,
  rings: number[][][]
): boolean {
  if (rings.length === 0) return false;

  const insideExterior = pointInRing(
    longitude,
    latitude,
    rings[0]
  );

  if (!insideExterior) return false;

  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(longitude, latitude, rings[i])) {
      return false;
    }
  }

  return true;
}

export function pointInGeometry(
  longitude: number,
  latitude: number,
  geometry: NeighborhoodPolygon
): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygon(
      longitude,
      latitude,
      geometry.coordinates as number[][][]
    );
  }

  return (
    geometry.type === "MultiPolygon" &&
    (geometry.coordinates as number[][][][]).some(
      (polygon) =>
        pointInPolygon(longitude, latitude, polygon)
    )
  );
}

export function findNeighborhood(
  longitude: number,
  latitude: number,
  neighborhoods: NeighborhoodCollection
): NeighborhoodMatch | null {
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  for (const feature of neighborhoods.features) {
    if (
      !feature.properties?.name ||
      !feature.geometry
    ) {
      continue;
    }

    if (
      pointInGeometry(
        longitude,
        latitude,
        feature.geometry
      )
    ) {
      return {
        name: feature.properties.name,
        id: feature.properties.neighborhood_id,
        source: "BPDA GIS",
      };
    }
  }

  return null;
}

export function assignNeighborhood(
  place: Pick<OpenStreetMapPlace, "longitude" | "latitude">,
  neighborhoods: NeighborhoodCollection
): NeighborhoodMatch | null {
  return findNeighborhood(
    place.longitude,
    place.latitude,
    neighborhoods
  );
}
