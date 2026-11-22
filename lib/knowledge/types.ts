export type SourceCategory =
  | "places"
  | "events"
  | "public-data"
  | "transportation"
  | "neighborhoods";

export type SourceMethod =
  | "public-api"
  | "public-website"
  | "manual";

export interface KnowledgeSource {
  id: string;
  name: string;
  url: string;
  category: SourceCategory;
  method: SourceMethod;
  refreshIntervalHours: number;
  enabled: boolean;
  description: string;
}
