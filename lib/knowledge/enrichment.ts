import type { OpenStreetMapPlace, PlaceCategory } from "./connectors/openstreetmap";
import {assignNeighborhood, fetchBostonNeighborhoods, } from "./neighborhoods";
import type { NeighborhoodMatch } from "./neighborhoods";
import { fetchBostonMunicipalBoundary, isInsideBoston, } from "./municipality";

export type GeographicStatus =
  | "assigned"
  | "outside-boston"
  | "inside-boston-unmatched";

export interface EnrichedPlace extends OpenStreetMapPlace {
  normalizedName: string;
  normalizedCategory: PlaceCategory;
  structuredAddress: {
    houseNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
  normalizedWebsite?: string;
  normalizedCuisine?: string[];
  normalizedOpeningHours?: string;
  dataCompleteness: number;
  metadata: Record<string, unknown>;
  neighborhood?: NeighborhoodMatch;
  municipality?: "Boston";
  geographicStatus?: GeographicStatus;
  
}

function cleanText(value?: string): string | undefined {
  if (!value) return undefined;

  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeWebsite(url?: string): string | undefined {
  const cleaned = cleanText(url);

  if (!cleaned) return undefined;

  try {
    const normalized = /^https?:\/\//i.test(cleaned)
      ? cleaned
      : `https://${cleaned}`;

    const parsed = new URL(normalized);

    if (!parsed.hostname.includes(".")) return undefined;

    return parsed.origin + parsed.pathname.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function normalizeCuisine(cuisine?: string): string[] {
  if (!cuisine) return [];

  return cuisine
    .split(";")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getStructuredAddress(
  tags: Record<string, string>
): EnrichedPlace["structuredAddress"] {
  return {
    houseNumber: cleanText(tags["addr:housenumber"]),
    street: cleanText(tags["addr:street"]),
    city: cleanText(tags["addr:city"]),
    state: cleanText(tags["addr:state"]),
    postcode: cleanText(tags["addr:postcode"]),
  };
}

function calculateCompleteness(
  place: OpenStreetMapPlace,
  address: EnrichedPlace["structuredAddress"]
): number {
  const fields = [
    Boolean(cleanText(place.name)),
    Boolean(place.category && place.category !== "other"),
    Boolean(place.latitude && place.longitude),
    Boolean(address.street || place.address),
    Boolean(place.website),
    Boolean(place.phone),
    Boolean(place.openingHours),
  ];

  return Math.round(
    (fields.filter(Boolean).length / fields.length) * 100
  );
}

export function enrichPlace(
  place: OpenStreetMapPlace
): EnrichedPlace {
  const tags = place.tags ?? {};
  const structuredAddress = getStructuredAddress(tags);

  const normalizedWebsite = normalizeWebsite(
    place.website || tags["contact:website"]
  );

  const normalizedCuisine = normalizeCuisine(place.cuisine);
  const normalizedOpeningHours = cleanText(place.openingHours);

  const dataCompleteness = calculateCompleteness(
    place,
    structuredAddress
  );

  const enriched: EnrichedPlace = {
    ...place,

    normalizedName: normalizeName(place.name),
    normalizedCategory: place.category,

    structuredAddress,

    normalizedWebsite,
    normalizedCuisine,
    normalizedOpeningHours,

    dataCompleteness,

    metadata: {
      hasWebsite: Boolean(normalizedWebsite),
      hasPhone: Boolean(cleanText(place.phone)),
      hasOpeningHours: Boolean(normalizedOpeningHours),
      hasAddress: Boolean(
        place.address || structuredAddress.street
      ),
      dataCompleteness,
    },
  };

  return enriched;
}

export function enrichPlaces(
  places: OpenStreetMapPlace[]
): EnrichedPlace[] {
  return places.map(enrichPlace);
}

export async function enrichPlacesWithNeighborhoods(
  places: OpenStreetMapPlace[]
): Promise<EnrichedPlace[]> {
  // Fetch both geographic datasets concurrently.
  const [neighborhoods, municipalBoundary] = await Promise.all([
    fetchBostonNeighborhoods(),
    fetchBostonMunicipalBoundary(),
  ]);

  return enrichPlaces(places).map((place) => {
    const neighborhood = assignNeighborhood(
      place,
      neighborhoods
    );

    const insideBoston = isInsideBoston(
      place.longitude,
      place.latitude,
      municipalBoundary
    );

    let geographicStatus: GeographicStatus;

    if (neighborhood) {
      geographicStatus = "assigned";
    } else if (insideBoston) {
      geographicStatus = "inside-boston-unmatched";
    } else {
      geographicStatus = "outside-boston";
    }

    return {
      ...place,
      neighborhood: neighborhood ?? undefined,
      municipality: insideBoston ? "Boston" : undefined,
      geographicStatus,
    };
  });
}
