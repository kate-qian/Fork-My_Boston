import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  pointInGeometry,
  type NeighborhoodPolygon,
} from "./neighborhoods";

const MUNICIPALITY_API =
  "https://services2.arcgis.com/d0NFID1O0ng4wccB/ArcGIS/rest/services/Boston_Municipality_Boundary/FeatureServer/0/query";

const CACHE_DIR = path.join(
  process.cwd(),
  "lib",
  "knowledge",
  "cache"
);

const CACHE_FILE = path.join(
  CACHE_DIR,
  "boston-municipal-boundary.geojson"
);

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

interface MunicipalityProperties {
  TOWN: string;
  TOWN_ID?: number;
}

interface MunicipalityFeature {
  type: "Feature";
  properties: MunicipalityProperties;
  geometry: NeighborhoodPolygon;
}

interface MunicipalityCollection {
  type: "FeatureCollection";
  features: MunicipalityFeature[];
}

interface CachedMunicipality {
  fetchedAt: number;
  data: MunicipalityCollection;
}

function isValidCollection(
  value: unknown
): value is MunicipalityCollection {
  if (!value || typeof value !== "object") return false;

  const collection = value as MunicipalityCollection;

  return (
    collection.type === "FeatureCollection" &&
    Array.isArray(collection.features) &&
    collection.features.length > 0
  );
}

async function readCache(): Promise<MunicipalityCollection | null> {
  try {
    const raw = await readFile(CACHE_FILE, "utf-8");
    const cached = JSON.parse(raw) as CachedMunicipality;

    if (
      Date.now() - cached.fetchedAt > CACHE_TTL ||
      !isValidCollection(cached.data)
    ) {
      return null;
    }

    console.log("Using cached Boston municipal boundary.");

    return cached.data;
  } catch {
    return null;
  }
}

async function writeCache(
  data: MunicipalityCollection
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });

  const cached: CachedMunicipality = {
    fetchedAt: Date.now(),
    data,
  };

  await writeFile(
    CACHE_FILE,
    JSON.stringify(cached),
    "utf-8"
  );
}

export async function fetchBostonMunicipalBoundary(
  refresh = false
): Promise<MunicipalityCollection> {
  if (!refresh) {
    const cached = await readCache();

    if (cached) return cached;
  }

  console.log("Fetching Boston municipal boundary...");

  const params = new URLSearchParams({
    where: "TOWN = 'Boston'",
    outFields: "TOWN,TOWN_ID",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });

  const response = await fetch(
    `${MUNICIPALITY_API}?${params.toString()}`,
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
      `Municipal boundary request failed: ${response.status} ${response.statusText}\n${errorBody.slice(0, 500)}`
    );
  }

  const responseText = await response.text();

  let data: unknown;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Expected JSON from MassGIS, but received: ${responseText.slice(0, 250)}`
    );
  }

  if (!isValidCollection(data)) {
    throw new Error(
      "Unexpected municipal boundary response. Check the query and TOWN field."
    );
  }

  const bostonFeature = data.features.find(
    (feature) =>
      feature.properties.TOWN?.toLowerCase() === "boston"
  );

  if (!bostonFeature) {
    throw new Error(
      "The municipal boundary response did not contain Boston."
    );
  }

  const normalizedData: MunicipalityCollection = {
    type: "FeatureCollection",
    features: [bostonFeature],
  };

  await writeCache(normalizedData);

  console.log("Retrieved and cached Boston municipal boundary.");

  return normalizedData;
}

export function isInsideBoston(
  longitude: number,
  latitude: number,
  boundary: MunicipalityCollection
): boolean {
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    return false;
  }

  return boundary.features.some(
    (feature) =>
      feature.geometry &&
      pointInGeometry(
        longitude,
        latitude,
        feature.geometry
      )
  );
}
