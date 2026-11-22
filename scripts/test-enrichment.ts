
import { fetchBostonPlaces } from "../lib/knowledge/connectors/openstreetmap";
import { enrichPlaces } from "../lib/knowledge/enrichment";

async function main() {
  const places = await fetchBostonPlaces({
    category: "cafe",
    limit: 20,
  });

  const enriched = enrichPlaces(places);

  console.log(`Enriched ${enriched.length} places.\n`);

  enriched.slice(0, 5).forEach((place) => {
    console.log({
      name: place.name,
      normalizedName: place.normalizedName,
      category: place.normalizedCategory,
      website: place.normalizedWebsite,
      address: place.structuredAddress,
      completeness: place.metadata.dataCompleteness,
    });
  });
}

main().catch(console.error);
