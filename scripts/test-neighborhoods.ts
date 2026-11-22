import { fetchBostonPlaces } from "../lib/knowledge/connectors/openstreetmap";
import { assignNeighborhood, fetchBostonNeighborhoods, } from "../lib/knowledge/neighborhoods";

async function main() {
  const neighborhoods = await fetchBostonNeighborhoods();

  console.log("\nBoston neighborhoods:");
  neighborhoods.features.forEach((feature) => {
    console.log(`- ${feature.properties.name}`);
  });

  const places = await fetchBostonPlaces({
    category: "cafe",
    limit: 50,
  });

  console.log("\nAssigning neighborhoods to cafes...\n");

  const results = places.map((place) => ({
    name: place.name,
    neighborhood: assignNeighborhood(place, neighborhoods)?.name ?? "Unknown",
  }));

  results.slice(0, 20).forEach((place) => {
    console.log(`${place.name} — ${place.neighborhood}`);
  });

  const assigned = results.filter(
    (place) => place.neighborhood !== "Unknown"
  ).length;

  console.log("\nSummary:");
  console.log(`Total cafes: ${results.length}`);
  console.log(`Assigned: ${assigned}`);
  console.log(`Unknown: ${results.length - assigned}`);
}

main().catch(console.error);
