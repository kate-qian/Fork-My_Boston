import type { KnowledgeSource } from "./types";

export const BOSTON_SOURCES: KnowledgeSource[] = [
  {
    id: "boston-open-data",
    name: "Boston Open Data",
    url: "https://data.boston.gov/",
    category: "public-data",
    method: "public-api",
    refreshIntervalHours: 720,
    enabled: true,
    description: "Public datasets from the City of Boston.",
  },
  {
    id: "openstreetmap",
    name: "OpenStreetMap",
    url: "https://overpass-api.de/api/interpreter",
    category: "places",
    method: "public-api",
    refreshIntervalHours: 168,
    enabled: true,
    description: "Geographic data and points of interest.",
  },
  {
    id: "mbta",
    name: "MBTA",
    url: "https://api-v3.mbta.com/",
    category: "transportation",
    method: "public-api",
    refreshIntervalHours: 1,
    enabled: true,
    description: "Transit routes, stops, schedules, and alerts.",
  },
  {
    id: "meet-boston",
    name: "Meet Boston",
    url: "https://www.meetboston.com/",
    category: "neighborhoods",
    method: "manual",
    refreshIntervalHours: 168,
    enabled: true,
    description: "Reference material for Boston attractions and neighborhoods.",
  },
];
